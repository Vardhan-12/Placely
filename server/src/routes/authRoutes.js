// authRoutes.js - Routes for user authentication

const express = require("express");
const router = express.Router();

const { signup, login, resubmitProof, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { uploadProofSingle } = require("../middleware/uploadProof");
const { authLimiter } = require("../middleware/rateLimiter");

// GET /api/auth/me       → get current logged-in user details
router.get("/me", protect, getMe);

// POST /api/auth/signup  → register a new user (supports JSON or multipart for seniors with proof)
router.post("/signup", authLimiter, uploadProofSingle, signup);

// POST /api/auth/login   → login and receive a JWT
router.post("/login", authLimiter, login);

// POST /api/auth/resubmit-proof → senior re-uploads proof
router.post(
  "/resubmit-proof",
  protect,
  authorizeRoles("senior"),
  uploadProofSingle,
  resubmitProof
);

module.exports = router;
