// qaRoutes.js - Routes for Questions and Answers

const express = require("express");
const router = express.Router();

const {
  createQuestion,
  getQuestions,
  getQuestionById,
  createAnswer,
  toggleAnswerUpvote,
  markBestAnswer,
  deleteQuestion,
  deleteAnswer,
} = require("../controllers/qaController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { requireVerified } = require("../middleware/verifiedMiddleware");

// Public routes
router.get("/questions", getQuestions);
router.get("/questions/:id", getQuestionById);

// Question routes (Juniors and Seniors can ask)
router.post("/questions", protect, authorizeRoles("junior", "senior"), createQuestion);
router.delete("/questions/:id", protect, deleteQuestion);

// Answer routes (Verified Seniors can answer)
router.post(
  "/questions/:id/answers",
  protect,
  authorizeRoles("senior"),
  requireVerified,
  createAnswer
);
router.delete("/answers/:id", protect, deleteAnswer);

// Upvote & Best answer routes
router.post("/answers/:id/upvote", protect, toggleAnswerUpvote);
router.patch("/answers/:id/best", protect, markBestAnswer);

module.exports = router;

