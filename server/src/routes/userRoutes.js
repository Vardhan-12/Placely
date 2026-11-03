// userRoutes.js - Public user profile routes

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const Experience = require("../models/Experience");
const Answer = require("../models/Answer");

// ─────────────────────────────────────────────
// @route   GET /api/users/:id/public
// @desc    Get public profile of a user (name, role, branch, and for seniors: counts)
//          Never returns email or password
// @access  Public
// ─────────────────────────────────────────────
router.get("/:id/public", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userData = {
      id: user._id,
      name: user.name,
      role: user.role,
    };

    if (user.branch) {
      userData.branch = user.branch;
    }

    // For seniors, include their experience count and answer count
    if (user.role === "senior") {
      const [experienceCount, answerCount] = await Promise.all([
        Experience.countDocuments({ author: user._id }),
        Answer.countDocuments({ answeredBy: user._id }),
      ]);
      userData.experienceCount = experienceCount;
      userData.answerCount = answerCount;
    }

    res.status(200).json({
      success: true,
      data: userData,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

