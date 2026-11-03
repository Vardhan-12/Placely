// bookmarkRoutes.js - Routes for experience bookmarks

const express = require("express");
const router = express.Router();

const {
  toggleBookmark,
  getBookmarks,
} = require("../controllers/bookmarkController");

const { protect } = require("../middleware/authMiddleware");

// All bookmark routes require authentication
router.use(protect);

router.get("/", getBookmarks);
router.post("/:experienceId", toggleBookmark);

module.exports = router;

