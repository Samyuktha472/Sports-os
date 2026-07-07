const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} = require('../controllers/notificationController');

const router = express.Router();

router.get('/', protect, getMyNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.post('/:id/read', protect, markAsRead);
router.post('/mark-all-read', protect, markAllAsRead);

module.exports = router;