// aiController.js - Handles AI-powered company interview experience summaries

const mongoose = require("mongoose");
const Company = require("../models/Company");
const Experience = require("../models/Experience");
const CompanySummary = require("../models/CompanySummary");
const { generateCompanySummary } = require("../services/aiService");

// In-memory rate limiter: max 10 generation calls per user per hour
// Key: userId string -> Value: { count: number, resetAt: number }
const userRateLimits = new Map();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const checkRateLimit = (userId) => {
  const now = Date.now();
  let userLimit = userRateLimits.get(userId);

  if (!userLimit || now >= userLimit.resetAt) {
    userLimit = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    userRateLimits.set(userId, userLimit);
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((userLimit.resetAt - now) / 1000),
    };
  }

  return { allowed: true, record: userLimit };
};

const incrementRateLimit = (userLimit) => {
  if (userLimit) {
    userLimit.count += 1;
  }
};

/**
 * GET /api/ai/company/:id/summary
 * Protected (any logged-in user).
 * Returns existing cached summary if experienceCount matches, otherwise generates a new one.
 */
const getCompanySummary = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID",
      });
    }

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Load company's experiences
    const experiences = await Experience.find({ company: id }).lean();
    const count = experiences.length;

    if (count < 3) {
      return res.status(200).json({
        success: true,
        enoughData: false,
        count,
        message: "Not enough experiences yet to summarize (need at least 3)",
      });
    }

    // Check cached summary
    const cached = await CompanySummary.findOne({ company: id });
    if (cached && cached.experienceCount === count) {
      return res.status(200).json({
        success: true,
        enoughData: true,
        count,
        generatedAt: cached.generatedAt,
        cached: true,
        data: cached.summary,
      });
    }

    // Generation is needed -> check rate limit
    const userId = req.user._id.toString();
    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: `Rate limit reached. Maximum ${RATE_LIMIT_MAX} AI summaries per hour. Try again in ${rateCheck.retryAfterSeconds} seconds.`,
      });
    }

    // Generate summary via Gemini API
    let summary;
    try {
      summary = await generateCompanySummary(company.name, experiences);
      incrementRateLimit(rateCheck.record);
    } catch (aiErr) {
      return res.status(503).json({
        success: false,
        message: "AI service is temporarily unavailable. Please try again later.",
      });
    }

    const generatedAt = new Date();

    // Upsert into CompanySummary
    await CompanySummary.findOneAndUpdate(
      { company: id },
      {
        company: id,
        experienceCount: count,
        summary,
        generatedAt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      enoughData: true,
      count,
      generatedAt,
      cached: false,
      data: summary,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * POST /api/ai/company/:id/summary/refresh
 * Protected (admin only).
 * Forces re-generation of the summary regardless of cache.
 */
const refreshCompanySummary = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID",
      });
    }

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const experiences = await Experience.find({ company: id }).lean();
    const count = experiences.length;

    if (count < 3) {
      return res.status(200).json({
        success: true,
        enoughData: false,
        count,
        message: "Not enough experiences yet to summarize (need at least 3)",
      });
    }

    // Rate limit check
    const userId = req.user._id.toString();
    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: `Rate limit reached. Maximum ${RATE_LIMIT_MAX} AI summaries per hour. Try again in ${rateCheck.retryAfterSeconds} seconds.`,
      });
    }

    let summary;
    try {
      summary = await generateCompanySummary(company.name, experiences);
      incrementRateLimit(rateCheck.record);
    } catch (aiErr) {
      return res.status(503).json({
        success: false,
        message: "AI service is temporarily unavailable. Please try again later.",
      });
    }

    const generatedAt = new Date();

    await CompanySummary.findOneAndUpdate(
      { company: id },
      {
        company: id,
        experienceCount: count,
        summary,
        generatedAt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      enoughData: true,
      count,
      generatedAt,
      cached: false,
      data: summary,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getCompanySummary,
  refreshCompanySummary,
};

