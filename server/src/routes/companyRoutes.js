// companyRoutes.js - Routes for the Company resource

const express = require("express");
const router = express.Router();

const {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
} = require("../controllers/companyController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// Shorthand: admin-only middleware chain
const adminOnly = [protect, authorizeRoles("admin")];

// Public routes — no token needed
router.get("/", getCompanies);
router.get("/:id", getCompanyById);

// Admin-only routes — require a valid token and admin role
router.post("/", adminOnly, createCompany);
router.put("/:id", adminOnly, updateCompany);
router.delete("/:id", adminOnly, deleteCompany);

module.exports = router;

