// authRoutes.js - Routes for user authentication

const express = require("express");
const router = express.Router();

const { signup, login, resubmitProof } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { uploadProofSingle } = require("../middleware/uploadProof");

// POST /api/auth/signup  → register a new user (supports JSON or multipart for seniors with proof)
router.post("/signup", uploadProofSingle, signup);

// POST /api/auth/login   → login and receive a JWT
router.post("/login", login);

// POST /api/auth/resubmit-proof → senior re-uploads proof
router.post(
  "/resubmit-proof",
  protect,
  authorizeRoles("senior"),
  uploadProofSingle,
  resubmitProof
);

module.exports = router;
