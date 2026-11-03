// Company.js - Mongoose model for placement companies

const mongoose = require("mongoose");

// Each round in a drive has a name, type, and optional description
const roundSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Round name is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Round type is required"],
      enum: {
        values: ["aptitude", "coding", "technical", "hr", "other"],
        message: "Round type must be: aptitude, coding, technical, hr, or other",
      },
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { _id: true } // each round gets its own _id
);

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      unique: true,      // MongoDB creates a unique index for this field
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    // Job roles this company hires for, e.g. ["SDE", "Analyst"]
    roles: {
      type: [String],
      default: [],
    },

    // Salary range in LPA (Lakhs Per Annum)
    packageMin: {
      type: Number,
    },
    packageMax: {
      type: Number,
    },

    // Minimum CGPA required to be eligible
    cgpaCutoff: {
      type: Number,
    },

    // Interview/selection rounds for this company
    rounds: {
      type: [roundSchema],
      default: [],
    },

    // True if the drive hasn't happened yet (upcoming)
    isUpcoming: {
      type: Boolean,
      default: false,
    },

    // Optional date of the next placement drive
    nextDriveDate: {
      type: Date,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model("Company", companySchema);

