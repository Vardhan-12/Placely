// authController.js - Handles user signup and login

const jwt = require("jsonwebtoken");
const User = require("../models/User");

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
// @desc    Register a new junior or senior user
// @access  Public
// ─────────────────────────────────────────────
const signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // --- Input validation ---
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Only junior or senior roles are allowed at signup; admin accounts cannot be self-created
    const allowedRoles = ["junior", "senior"];
    if (role && !allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "You cannot sign up with that role. Allowed roles: junior, senior",
      });
    }

    // --- Create user (password hashed in pre-save hook) ---
    const user = await User.create({
      name,
      email,
      password,
      role: role || "junior", // default to junior if not provided
    });

    // Generate JWT for the new user
    const token = generateToken(user._id, user.role);

    // Return user data WITHOUT the password field
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
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
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login };
