// notificationService.js - Helpers to send notifications

const Notification = require("../models/Notification");
const User = require("../models/User");

/**
 * Send a notification to all admin users
 */
const notifyAllAdmins = async ({ message, link, type = "admin_verification" }) => {
  try {
    const admins = await User.find({ role: "admin" }).select("_id");
    if (!admins.length) return;

    const notifs = admins.map((admin) => ({
      user: admin._id,
      type,
      message,
      link: link || "/admin",
      isRead: false,
    }));

    await Notification.insertMany(notifs);
  } catch (err) {
    console.error("Failed to notify admins:", err.message);
  }
};

/**
 * Send a notification to a specific user
 */
const notifyUser = async (userId, { message, link, type = "verification" }) => {
  try {
    await Notification.create({
      user: userId,
      type,
      message,
      link: link || "",
      isRead: false,
    });
  } catch (err) {
    console.error("Failed to notify user:", err.message);
  }
};

module.exports = {
  notifyAllAdmins,
  notifyUser,
};

