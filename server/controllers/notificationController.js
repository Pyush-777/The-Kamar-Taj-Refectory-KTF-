const Notification = require("../models/Notification");

// Get logged-in user's notifications
const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            user: req.user.userId
        })
            .sort({ createdAt: -1 })
            .limit(30);

        const unreadCount = await Notification.countDocuments({
            user: req.user.userId,
            read: false
        });

        return res.status(200).json({
            success: true,
            unreadCount,
            notifications
        });
    } catch (error) {
        console.error("Get notifications error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch notifications."
        });
    }
};

// Mark single notification as read
const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        await Notification.findOneAndUpdate(
            { _id: notificationId, user: req.user.userId },
            { $set: { read: true } }
        );

        return res.status(200).json({
            success: true,
            message: "Marked as read."
        });
    } catch (error) {
        console.error("Mark read error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update notification."
        });
    }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user.userId, read: false },
            { $set: { read: true } }
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read."
        });
    } catch (error) {
        console.error("Mark all read error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to mark all as read."
        });
    }
};

module.exports = {
    getMyNotifications,
    markAsRead,
    markAllAsRead
};
