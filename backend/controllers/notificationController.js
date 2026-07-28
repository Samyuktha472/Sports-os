const Notification = require('../models/Notification');

// ── Get all notifications for the logged-in user ─────────────────────────
exports.getMyNotifications = async (req, res) => {
    try {
        const user = req.user;
        const notifications = await Notification.find({ recipientId: user._id })
            .populate('fromUserId', 'name initials')
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json(notifications);
    } catch (error) {
        console.error('getMyNotifications error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ── Unread count only — cheap call for the bell badge ────────────────────
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipientId: req.user._id,
            isRead: false,
        });
        res.status(200).json({ count });
    } catch (error) {
        console.error('getUnreadCount error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ── Mark a single notification as read (e.g. when the user opens it) ─────
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            recipientId: req.user._id,
        });
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        notification.isRead = true;
        await notification.save();
        res.status(200).json(notification);
    } catch (error) {
        console.error('markAsRead error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ── Mark all of the logged-in user's notifications as read ───────────────
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipientId: req.user._id, isRead: false },
            { isRead: true }
        );
        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('markAllAsRead error:', error);
        res.status(500).json({ message: error.message });
    }
};