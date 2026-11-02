// testRoutes.js - TEMPORARY routes for testing auth/role middleware.
// These routes are for development verification only and will be removed later.

const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { requireVerified } = require("../middleware/verifiedMiddleware");

// GET /api/test/me
// protect only — any logged-in user can access this
router.get("/me", protect, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

// GET /api/test/junior-or-senior
// Any logged-in junior or senior can access
router.get("/junior-or-senior", protect, authorizeRoles("junior", "senior"), (req, res) => {
  res.status(200).json({ success: true, message: `Welcome, ${req.user.role}!` });
});

// GET /api/test/senior
// Only a verified senior can access
router.get("/senior", protect, authorizeRoles("senior"), requireVerified, (req, res) => {
  res.status(200).json({ success: true, message: "Welcome, verified senior!" });
});

// GET /api/test/admin
// Only admins can access
router.get("/admin", protect, authorizeRoles("admin"), (req, res) => {
  res.status(200).json({ success: true, message: "Welcome, admin!" });
});

module.exports = router;
