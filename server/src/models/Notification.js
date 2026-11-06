// Notification.js - Mongoose model for in-app user notifications

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Target user reference is required"],
    },

    type: {
      type: String,
      default: "verification",
      trim: true,
    },

    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },

    link: {
      type: String,
      trim: true,
      default: "",
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);

