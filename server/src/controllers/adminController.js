// adminController.js - Admin operations for senior verification

const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const User = require("../models/User");
const Company = require("../models/Company");
const Experience = require("../models/Experience");
const Question = require("../models/Question");
const { notifyUser } = require("../services/notificationService");
const { uploadDir } = require("../middleware/uploadProof");

// ─────────────────────────────────────────────
// @route   GET /api/admin/seniors
// @desc    List senior users with optional status filter (pending | approved | rejected)
// @access  Private — Admin
// ─────────────────────────────────────────────
const getSeniors = async (req, res, next) => {
  try {
    const { status } = req.query;

    const filter = { role: "senior" };

    if (status === "pending") {
      filter.$or = [
        { verificationStatus: "pending" },
        { verificationStatus: { $exists: false }, isVerified: false },
      ];
    } else if (status === "approved") {
      filter.$or = [
        { verificationStatus: "approved" },
        { verificationStatus: { $exists: false }, isVerified: true },
      ];
    } else if (status === "rejected") {
      filter.verificationStatus = "rejected";
    }

    // Never return passwords or raw proof file paths
    const seniors = await User.find(filter)
      .select("-password -proofFile")
      .sort({ createdAt: -1 })
      .lean();

    // Map to include hasProof and normalize verificationStatus
    const transformed = seniors.map((s) => ({
      _id: s._id,
      name: s.name,
      email: s.email,
      role: s.role,
      branch: s.branch,
      placedCompany: s.placedCompany,
      placedYear: s.placedYear,
      isVerified: Boolean(s.isVerified),
      verificationStatus: s.verificationStatus || (s.isVerified ? "approved" : "pending"),
      rejectionReason: s.rejectionReason,
      hasProof: Boolean(s.proofUploadedAt),
      proofUploadedAt: s.proofUploadedAt,
      createdAt: s.createdAt,
    }));

    res.status(200).json({
      success: true,
      count: transformed.length,
      data: transformed,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/admin/seniors/:id/proof
// @desc    Stream the uploaded proof document (Admin only)
// @access  Private — Admin
// ─────────────────────────────────────────────
const streamSeniorProof = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const user = await User.findById(id).select("+proofFile");
    if (!user || user.role !== "senior" || !user.proofFile) {
      return res.status(404).json({
        success: false,
        message: "Proof document not found for this senior",
      });
    }

    const filePath = path.join(uploadDir, user.proofFile);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Proof file not found on server disk",
      });
    }

    const ext = path.extname(user.proofFile).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="proof-${id}${ext}"`);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   PATCH /api/admin/seniors/:id/approve
// @desc    Approve a senior user (sets approved/isVerified true, deletes proof file)
// @access  Private — Admin
// ─────────────────────────────────────────────
const approveSenior = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const user = await User.findById(id);

    if (!user || user.role !== "senior") {
      return res.status(404).json({
        success: false,
        message: "Senior not found",
      });
    }

    // Delete proof file if exists
    if (user.proofFile) {
      const filePath = path.join(uploadDir, user.proofFile);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
      user.proofFile = undefined;
    }

    user.isVerified = true;
    user.verificationStatus = "approved";
    user.rejectionReason = undefined;
    await user.save();

    // Notify senior
    await notifyUser(user._id, {
      message: "You are verified! You can now post experiences and answer questions.",
      link: "/my-posts",
      type: "senior_approved",
    });

    res.status(200).json({
      success: true,
      message: "Senior approved successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   PATCH /api/admin/seniors/:id/reject
// @desc    Reject a senior user (requires reason, sets rejected/isVerified false)
// @access  Private — Admin
// ─────────────────────────────────────────────
const rejectSenior = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "A rejection reason is required",
      });
    }

    const user = await User.findById(id);

    if (!user || user.role !== "senior") {
      return res.status(404).json({
        success: false,
        message: "Senior not found",
      });
    }

    user.isVerified = false;
    user.verificationStatus = "rejected";
    user.rejectionReason = reason.trim();
    await user.save();

    // Notify senior
    await notifyUser(user._id, {
      message: `Verification rejected: ${reason.trim()}. Please re-upload proof.`,
      link: "/profile",
      type: "senior_rejected",
    });

    res.status(200).json({
      success: true,
      message: "Senior verification rejected",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
        rejectionReason: user.rejectionReason,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/admin/stats
// @desc    Get dashboard stats (users, pending seniors, companies, experiences, questions)
// @access  Private — Admin
// ─────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const [users, pendingSeniors, companies, experiences, questions] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "senior", isVerified: false }),
      Company.countDocuments(),
      Experience.countDocuments(),
      Question.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pendingSeniors,
        companies,
        experiences,
        questions,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSeniors,
  approveSenior,
  rejectSenior,
  streamSeniorProof,
  getStats,
};

