// experienceRoutes.js - Routes for placement experiences

const express = require("express");
const router = express.Router();

const {
  createExperience,
  getExperiences,
  getExperienceById,
  getMyExperiences,
  updateExperience,
  deleteExperience,
  toggleUpvote,
} = require("../controllers/experienceController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { requireVerified } = require("../middleware/verifiedMiddleware");

// Public routes
router.get("/", getExperiences);

// Protected: senior's own experiences — MUST be before /:id to avoid "mine" being treated as an id
router.get("/mine", protect, authorizeRoles("senior"), getMyExperiences);

router.get("/:id", getExperienceById);

// Verified senior only route for posting
router.post("/", protect, authorizeRoles("senior"), requireVerified, createExperience);

// Protected routes (authorization handled inside controllers)
router.put("/:id", protect, updateExperience);
router.delete("/:id", protect, deleteExperience);
router.post("/:id/upvote", protect, toggleUpvote);

module.exports = router;

