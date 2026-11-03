// companyController.js - CRUD handlers for the Company resource

const mongoose = require("mongoose");
const Company = require("../models/Company");

// ─────────────────────────────────────────────
// @route   GET /api/companies
// @desc    Get all companies (public)
//          Query params: search, isUpcoming, sort
// @access  Public
// ─────────────────────────────────────────────
const getCompanies = async (req, res, next) => {
  try {
    const { search, isUpcoming, sort } = req.query;

    // Build filter object based on provided query params
    const filter = {};

    // Case-insensitive partial match on company name
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    // Filter by upcoming status if provided (convert string to boolean)
    if (isUpcoming !== undefined) {
      filter.isUpcoming = isUpcoming === "true";
    }

    // Determine sort order
    let sortOption = {};
    if (sort === "name") {
      sortOption = { name: 1 }; // alphabetical A→Z
    } else if (sort === "latest") {
      sortOption = { createdAt: -1 }; // newest first
    }

    const companies = await Company.find(filter).sort(sortOption);

    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/companies/:id
// @desc    Get a single company by ID (public)
// @access  Public
// ─────────────────────────────────────────────
const getCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Reject the request early if the ID isn't a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID format",
      });
    }

    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/companies
// @desc    Create a new company (admin only)
// @access  Private — admin
// ─────────────────────────────────────────────
const createCompany = async (req, res, next) => {
  try {
    const { name, packageMin, packageMax } = req.body;

    // name is required
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Company name is required",
      });
    }

    // packageMax must not be less than packageMin when both are provided
    if (
      packageMin !== undefined &&
      packageMax !== undefined &&
      packageMax < packageMin
    ) {
      return res.status(400).json({
        success: false,
        message: "packageMax must not be less than packageMin",
      });
    }

    const company = await Company.create(req.body);

    res.status(201).json({ success: true, data: company });
  } catch (err) {
    // Duplicate company name — MongoDB error code 11000
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A company with that name already exists",
      });
    }
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   PUT /api/companies/:id
// @desc    Update a company (admin only)
// @access  Private — admin
// ─────────────────────────────────────────────
const updateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID format",
      });
    }

    // Validate package range on update if both values are supplied
    const { packageMin, packageMax } = req.body;
    if (
      packageMin !== undefined &&
      packageMax !== undefined &&
      packageMax < packageMin
    ) {
      return res.status(400).json({
        success: false,
        message: "packageMax must not be less than packageMin",
      });
    }

    const company = await Company.findByIdAndUpdate(id, req.body, {
      new: true,           // return the updated document
      runValidators: true, // run schema validators on the updated fields
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({ success: true, data: company });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A company with that name already exists",
      });
    }
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   DELETE /api/companies/:id
// @desc    Delete a company (admin only)
// @access  Private — admin
// ─────────────────────────────────────────────
const deleteCompany = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID format",
      });
    }

    const company = await Company.findByIdAndDelete(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Company "${company.name}" deleted successfully`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
};

