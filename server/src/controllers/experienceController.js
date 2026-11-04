// experienceController.js - CRUD and upvoting handlers for placement experiences

const mongoose = require("mongoose");
const Experience = require("../models/Experience");
const Company = require("../models/Company");

// Helper function to format experience document according to anonymity rules
const formatExperience = (exp) => {
  const doc = exp.toObject ? exp.toObject() : { ...exp };
  if (doc.isAnonymous) {
    doc.author = { name: "Anonymous" };
  }
  return doc;
};

// ─────────────────────────────────────────────
// @route   POST /api/experiences
// @desc    Create a new placement experience
// @access  Private — Senior (must be verified)
// ─────────────────────────────────────────────
const createExperience = async (req, res, next) => {
  try {
    const { company, year, role, result, packageLPA, difficulty, rounds, tips, mistakes, resources, isAnonymous } = req.body;

    // Validate required fields
    if (!company || !year || !role || !result) {
      return res.status(400).json({
        success: false,
        message: "Company, year, role, and result are required",
      });
    }

    // Check company existence (must return 404 if company id is invalid or not found)
    if (!mongoose.Types.ObjectId.isValid(company)) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const companyExists = await Company.findById(company);
    if (!companyExists) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Author is taken from req.user, never from the request body
    const experience = await Experience.create({
      company,
      author: req.user._id,
      year,
      role,
      result,
      packageLPA,
      difficulty,
      rounds: rounds || [],
      tips,
      mistakes,
      resources: resources || [],
      isAnonymous: Boolean(isAnonymous),
      upvotes: [],
    });

    res.status(201).json({
      success: true,
      data: experience,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/experiences
// @desc    Get all experiences with filters & sorting
//          Query params: company, year, result, sort (latest | upvotes)
// @access  Public
// ─────────────────────────────────────────────
const getExperiences = async (req, res, next) => {
  try {
    const { company, year, result, sort } = req.query;

    const filter = {};

    if (company) {
      if (!mongoose.Types.ObjectId.isValid(company)) {
        return res.status(400).json({
          success: false,
          message: "Invalid company ID format",
        });
      }
      filter.company = company;
    }

    if (year) {
      filter.year = Number(year);
    }

    if (result) {
      filter.result = result;
    }

    let query = Experience.find(filter)
      .populate("company", "name")
      .populate("author", "name");

    if (sort !== "upvotes") {
      // Default to latest
      query = query.sort({ createdAt: -1 });
    }

    let experiences = await query;

    // Sort by upvotes count if requested
    if (sort === "upvotes") {
      experiences = experiences.sort((a, b) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0));
    }

    const formatted = experiences.map(formatExperience);

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/experiences/:id
// @desc    Get single experience by ID
// @access  Public
// ─────────────────────────────────────────────
const getExperienceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid experience ID format",
      });
    }

    const experience = await Experience.findById(id)
      .populate("company", "name")
      .populate("author", "name");

    if (!experience) {
      return res.status(404).json({
        success: false,
        message: "Experience not found",
      });
    }

    res.status(200).json({
      success: true,
      data: formatExperience(experience),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   PUT /api/experiences/:id
// @desc    Update an experience (Author only; Admin cannot edit)
// @access  Private — Author only
// ─────────────────────────────────────────────
const updateExperience = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid experience ID format",
      });
    }

    const experience = await Experience.findById(id);

    if (!experience) {
      return res.status(404).json({
        success: false,
        message: "Experience not found",
      });
    }

    // Only the author can edit. Admin cannot edit.
    if (experience.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only the author can edit this experience.",
      });
    }

    // Check if updating company reference
    if (req.body.company) {
      if (!mongoose.Types.ObjectId.isValid(req.body.company)) {
        return res.status(404).json({
          success: false,
          message: "Company not found",
        });
      }
      const companyExists = await Company.findById(req.body.company);
      if (!companyExists) {
        return res.status(404).json({
          success: false,
          message: "Company not found",
        });
      }
    }

    // Disallow overriding author or upvotes via update
    delete req.body.author;
    delete req.body.upvotes;

    const updated = await Experience.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("company", "name")
      .populate("author", "name");

    res.status(200).json({
      success: true,
      data: formatExperience(updated),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   DELETE /api/experiences/:id
// @desc    Delete an experience (Author or Admin)
// @access  Private — Author or Admin
// ─────────────────────────────────────────────
const deleteExperience = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid experience ID format",
      });
    }

    const experience = await Experience.findById(id);

    if (!experience) {
      return res.status(404).json({
        success: false,
        message: "Experience not found",
      });
    }

    const isAuthor = experience.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    // Only author or admin can delete
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only the author or an admin can delete this experience.",
      });
    }

    await Experience.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Experience deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/experiences/:id/upvote
// @desc    Toggle upvote for an experience
// @access  Private — Any authenticated user
// ─────────────────────────────────────────────
const toggleUpvote = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid experience ID format",
      });
    }

    const experience = await Experience.findById(id);

    if (!experience) {
      return res.status(404).json({
        success: false,
        message: "Experience not found",
      });
    }

    const userIdStr = req.user._id.toString();
    const alreadyUpvoted = experience.upvotes.some((uId) => uId.toString() === userIdStr);

    if (alreadyUpvoted) {
      // Remove upvote
      experience.upvotes = experience.upvotes.filter((uId) => uId.toString() !== userIdStr);
    } else {
      // Add upvote
      experience.upvotes.push(req.user._id);
    }

    await experience.save();

    res.status(200).json({
      success: true,
      upvoteCount: experience.upvotes.length,
      message: alreadyUpvoted ? "Upvote removed" : "Upvote added",
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/experiences/mine
// @desc    Get all experiences authored by the logged-in senior (incl. anonymous)
// @access  Private — Senior only
// ─────────────────────────────────────────────
const getMyExperiences = async (req, res, next) => {
  try {
    const experiences = await Experience.find({ author: req.user._id })
      .populate("company", "name")
      .populate("author", "name")
      .sort({ createdAt: -1 });

    // Return raw docs (isAnonymous visible, real author preserved) — owner sees all
    const data = experiences.map((exp) => {
      const doc = exp.toObject();
      return doc;
    });

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createExperience,
  getExperiences,
  getExperienceById,
  getMyExperiences,
  updateExperience,
  deleteExperience,
  toggleUpvote,
};

