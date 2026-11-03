// Answer.js - Mongoose model for placement Q&A answers

const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: [true, "Question reference is required"],
    },

    answeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },

    text: {
      type: String,
      required: [true, "Answer text is required"],
      trim: true,
      maxlength: [1000, "Answer cannot exceed 1000 characters"],
    },

    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isBest: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Answer", answerSchema);

