// notificationController.js - Handles notification retrieval and read status updates

const Notification = require("../models/Notification");

// GET /api/notifications (protect)
// Returns latest 20 notifications + unreadCount
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      Notification.countDocuments({ user: userId, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/:id/read (protect)
const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notif = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { isRead: true },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      data: notif,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/read-all (protect)
const markAllNotificationsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};

