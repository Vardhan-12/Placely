// adminController.js - Admin operations for senior verification

const mongoose = require("mongoose");
const User = require("../models/User");

// ─────────────────────────────────────────────
// @route   GET /api/admin/seniors
// @desc    List senior users with optional status filter (pending | approved)
// @access  Private — Admin
// ─────────────────────────────────────────────
const getSeniors = async (req, res, next) => {
  try {
    const { status } = req.query;

    const filter = { role: "senior" };

    if (status === "pending") {
      filter.isVerified = false;
    } else if (status === "approved") {
      filter.isVerified = true;
    }

    // Never return passwords
    const seniors = await User.find(filter).select("-password").sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: seniors.length,
      data: seniors,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   PATCH /api/admin/seniors/:id/approve
// @desc    Approve a senior user (sets isVerified to true)
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

    user.isVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Senior approved successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   PATCH /api/admin/seniors/:id/reject
// @desc    Reject a senior user (sets isVerified to false, does not delete)
// @access  Private — Admin
// ─────────────────────────────────────────────
const rejectSenior = async (req, res, next) => {
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

    user.isVerified = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Senior verification rejected",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
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
};

