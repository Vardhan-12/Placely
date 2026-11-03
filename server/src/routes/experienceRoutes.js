// experienceRoutes.js - Routes for placement experiences

const express = require("express");
const router = express.Router();

const {
  createExperience,
  getExperiences,
  getExperienceById,
  updateExperience,
  deleteExperience,
  toggleUpvote,
} = require("../controllers/experienceController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { requireVerified } = require("../middleware/verifiedMiddleware");

// Public routes
router.get("/", getExperiences);
router.get("/:id", getExperienceById);

// Verified senior only route for posting
router.post("/", protect, authorizeRoles("senior"), requireVerified, createExperience);

// Protected routes (authorization handled inside controllers)
router.put("/:id", protect, updateExperience);
router.delete("/:id", protect, deleteExperience);
router.post("/:id/upvote", protect, toggleUpvote);

module.exports = router;

