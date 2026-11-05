// CompanySummary.js - Caches AI-generated summaries for company experiences

const mongoose = require("mongoose");

const companySummarySchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      unique: true,
      required: true,
    },
    experienceCount: {
      type: Number,
      required: true,
    },
    summary: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    generatedAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CompanySummary", companySummarySchema);

