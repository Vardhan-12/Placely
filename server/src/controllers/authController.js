// authController.js - Handles user signup and login

const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { notifyAllAdmins } = require("../services/notificationService");
const { uploadDir } = require("../middleware/uploadProof");

// --- Helper: Generate a signed JWT ---
// Payload contains user's id and role (used by protect middleware later)
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// ─────────────────────────────────────────────
// @route   POST /api/auth/signup
// @desc    Register a new junior, senior, or admin user
// @access  Public
// ─────────────────────────────────────────────
const signup = async (req, res, next) => {
  try {
    const { name, email, password, role, branch, placedCompany, placedYear, adminCode } = req.body;

    // Validate name (required, trimmed, at least 2 chars)
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name is required and must be at least 2 characters",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Validate password (at least 6 characters)
    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Validate role (defaults to junior)
    const userRole = role || "junior";
    const allowedRoles = ["junior", "senior", "admin"];
    if (!allowedRoles.includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: "Role must be junior, senior, or admin",
      });
    }

    // Admin validation: requires matching admin code from environment
    if (userRole === "admin") {
      if (
        !process.env.ADMIN_SIGNUP_CODE ||
        !adminCode ||
        adminCode !== process.env.ADMIN_SIGNUP_CODE
      ) {
        return res.status(403).json({
          success: false,
          message: "Invalid admin code",
        });
      }
    }

    // Senior validation: placedCompany, placedYear, and proof file are required
    if (userRole === "senior") {
      if (!placedCompany || !placedCompany.toString().trim() || placedYear === undefined || placedYear === null || placedYear === "") {
        // Cleanup uploaded file if text validation fails
        if (req.file) {
          try { fs.unlinkSync(req.file.path); } catch (e) {}
        }
        return res.status(400).json({
          success: false,
          message: "placedCompany and placedYear are required for senior signup",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Proof document (PDF, JPG, or PNG up to 5 MB) is required for senior verification",
        });
      }
    }

    // Create user (isVerified set in User model pre-save hook based on role)
    const user = await User.create({
      name: name.trim(),
      email: email.trim(),
      password,
      role: userRole,
      branch: branch ? branch.trim() : undefined,
      placedCompany: placedCompany ? placedCompany.toString().trim() : undefined,
      placedYear: placedYear ? Number(placedYear) : undefined,
      proofFile: userRole === "senior" && req.file ? req.file.filename : undefined,
      proofUploadedAt: userRole === "senior" && req.file ? new Date() : undefined,
      verificationStatus: userRole === "senior" ? "pending" : "approved",
    });

    // Notify all admins of the new senior verification request
    if (userRole === "senior") {
      await notifyAllAdmins({
        message: `New senior verification request: ${user.name} (${user.placedCompany})`,
        link: "/admin",
        type: "senior_signup",
      });
    }

    // Generate JWT for the new user
    const token = generateToken(user._id, user.role);

    // Return user data without password or adminCode
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        placedCompany: user.placedCompany,
        placedYear: user.placedYear,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
        rejectionReason: user.rejectionReason,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    // Mongoose duplicate key error (email already exists)
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with that email already exists",
      });
    }
    next(err); // Pass unexpected errors to the central error handler
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Log in an existing user
// @access  Public
// ─────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // --- Input validation ---
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user by email — explicitly select the password field since it's hidden by default
    const user = await User.findOne({ email }).select("+password");

    // Do NOT reveal whether the email or password was wrong (security best practice)
    const INVALID_CREDS_MSG = "Invalid email or password";

    if (!user) {
      return res.status(401).json({ success: false, message: INVALID_CREDS_MSG });
    }

    // Compare entered password against the stored bcrypt hash
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: INVALID_CREDS_MSG });
    }

    // Generate JWT for the logged-in user
    const token = generateToken(user._id, user.role);

    // Return user data WITHOUT the password field
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        placedCompany: user.placedCompany,
        placedYear: user.placedYear,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
        rejectionReason: user.rejectionReason,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/auth/resubmit-proof
// @desc    Resubmit proof document for rejected/pending seniors
// @access  Private — Senior
// ─────────────────────────────────────────────
const resubmitProof = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Proof document (PDF, JPG, or PNG up to 5 MB) is required",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user || user.role !== "senior") {
      // delete uploaded file if not senior
      if (req.file) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(403).json({
        success: false,
        message: "Only seniors can upload verification proof",
      });
    }

    // Delete old file if exists
    if (user.proofFile) {
      const oldFilePath = path.join(uploadDir, user.proofFile);
      if (fs.existsSync(oldFilePath)) {
        try { fs.unlinkSync(oldFilePath); } catch (e) {}
      }
    }

    user.proofFile = req.file.filename;
    user.proofUploadedAt = new Date();
    user.verificationStatus = "pending";
    user.isVerified = false;
    user.rejectionReason = undefined;

    await user.save();

    // Notify all admins of the resubmission
    await notifyAllAdmins({
      message: `Senior verification resubmission: ${user.name} (${user.placedCompany || "Senior"})`,
      link: "/admin",
      type: "senior_resubmission",
    });

    res.status(200).json({
      success: true,
      message: "Proof resubmitted successfully. Under review by admins.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        placedCompany: user.placedCompany,
        placedYear: user.placedYear,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
        rejectionReason: user.rejectionReason,
      },
    });
  } catch (err) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    next(err);
  }
};

module.exports = { signup, login, resubmitProof };
