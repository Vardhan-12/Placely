// aiRoutes.js - Routes for AI-driven company experience summaries

const express = require("express");
const router = express.Router();
const {
  getCompanySummary,
  refreshCompanySummary,
} = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// GET /api/ai/company/:id/summary - View or generate AI summary (all authenticated users)
router.get("/company/:id/summary", protect, getCompanySummary);

// POST /api/ai/company/:id/summary/refresh - Admin force-refresh summary
router.post(
  "/company/:id/summary/refresh",
  protect,
  authorizeRoles("admin"),
  refreshCompanySummary
);

module.exports = router;

