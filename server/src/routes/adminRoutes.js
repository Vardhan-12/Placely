// adminRoutes.js - Routes for admin-only operations (senior verification)

const express = require("express");
const router = express.Router();

const {
  getSeniors,
  approveSenior,
  rejectSenior,
} = require("../controllers/adminController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// All admin routes require a valid token and admin role
router.use(protect, authorizeRoles("admin"));

router.get("/seniors", getSeniors);
router.patch("/seniors/:id/approve", approveSenior);
router.patch("/seniors/:id/reject", rejectSenior);

module.exports = router;

