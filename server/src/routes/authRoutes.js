// authRoutes.js - Routes for user authentication

const express = require("express");
const router = express.Router();

const { signup, login } = require("../controllers/authController");

// POST /api/auth/signup  → register a new user
router.post("/signup", signup);

// POST /api/auth/login   → login and receive a JWT
router.post("/login", login);

module.exports = router;
