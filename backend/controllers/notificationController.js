const Notification = require("../models/Notification");

// Get all notifications
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user._id
        })
            .populate("sender", "name username profilePicture")
            .populate("post", "caption images")
            .sort({ createdAt: -1 });

        const unreadCount = await Notification.countDocuments({
            recipient: req.user._id,
            isRead: false
        });

        res.status(200).json({
            notifications,
            unreadCount
        });

    } catch (error) {
        console.error("Get notifications error:", error);

        res.status(500).json({
            message: "Unable to fetch notifications"
        });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                recipient: req.user._id
            },
            {
                isRead: true
            },
            {
                new: true
            }
        );

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        res.status(200).json({
            message: "Notification marked as read",
            notification
        });

    } catch (error) {
        console.error("Mark as read error:", error);

        res.status(500).json({
            message: "Unable to update notification"
        });
    }
};

module.exports = {
    getNotifications,
    markAsRead
};