// Experience.js - Mongoose model for interview & placement experiences

const mongoose = require("mongoose");

const experienceRoundSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: {
        values: ["aptitude", "coding", "technical", "hr", "other"],
        message: "Round type must be: aptitude, coding, technical, hr, or other",
      },
    },
    durationMinutes: {
      type: Number,
    },
    topics: {
      type: [String],
      default: [],
    },
    difficulty: {
      type: String,
      enum: {
        values: ["easy", "medium", "hard"],
        message: "Round difficulty must be easy, medium, or hard",
      },
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const experienceSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company reference is required"],
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author reference is required"],
    },

    year: {
      type: Number,
      required: [true, "Placement year is required"],
    },

    role: {
      type: String,
      required: [true, "Role is required"],
      trim: true,
    },

    packageLPA: {
      type: Number,
    },

    result: {
      type: String,
      required: [true, "Interview result is required"],
      enum: {
        values: ["selected", "rejected", "waiting"],
        message: "Result must be selected, rejected, or waiting",
      },
    },

    difficulty: {
      type: String,
      enum: {
        values: ["easy", "medium", "hard"],
        message: "Overall difficulty must be easy, medium, or hard",
      },
    },

    rounds: {
      type: [experienceRoundSchema],
      default: [],
    },

    tips: {
      type: String,
      trim: true,
    },

    mistakes: {
      type: String,
      trim: true,
    },

    resources: {
      type: [String],
      default: [],
    },

    isAnonymous: {
      type: Boolean,
      default: false,
    },

    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Experience", experienceSchema);

