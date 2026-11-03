// Question.js - Mongoose model for placement Q&A questions

const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company reference is required"],
    },

    askedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },

    text: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
      maxlength: [500, "Question cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Question", questionSchema);

