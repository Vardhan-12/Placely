// bookmarkController.js - Handles bookmarking of experiences

const mongoose = require("mongoose");
const User = require("../models/User");
const Experience = require("../models/Experience");

// ─────────────────────────────────────────────
// @route   POST /api/bookmarks/:experienceId
// @desc    Toggle bookmark for an experience
// @access  Private
// ─────────────────────────────────────────────
const toggleBookmark = async (req, res, next) => {
  try {
    const { experienceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(experienceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid experience ID format",
      });
    }

    const experience = await Experience.findById(experienceId);
    if (!experience) {
      return res.status(404).json({
        success: false,
        message: "Experience not found",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const expIdStr = experienceId.toString();
    const isAlreadyBookmarked = (user.bookmarks || []).some(
      (bId) => bId.toString() === expIdStr
    );

    if (isAlreadyBookmarked) {
      user.bookmarks = user.bookmarks.filter(
        (bId) => bId.toString() !== expIdStr
      );
    } else {
      user.bookmarks.push(experienceId);
    }

    await user.save();

    res.status(200).json({
      success: true,
      isBookmarked: !isAlreadyBookmarked,
      message: isAlreadyBookmarked ? "Bookmark removed" : "Bookmark added",
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/bookmarks
// @desc    Get user's bookmarked experiences (with company populated)
// @access  Private
// ─────────────────────────────────────────────
const getBookmarks = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "bookmarks",
      populate: {
        path: "company",
        select: "name",
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      count: user.bookmarks ? user.bookmarks.length : 0,
      data: user.bookmarks || [],
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  toggleBookmark,
  getBookmarks,
};

