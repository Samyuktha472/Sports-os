const express = require('express');
const router = express.Router();
const { protect, roleMiddleware } = require('../middleware/authMiddleware');
const { createAnnouncement, getAnnouncements, deleteAnnouncement } = require('../controllers/announcementController');

router.get('/', protect, getAnnouncements);
router.post('/', protect, roleMiddleware(['owner', 'head_coach', 'coach']), createAnnouncement);
router.delete('/:id', protect, roleMiddleware(['owner', 'head_coach', 'coach']), deleteAnnouncement);

module.exports = router;
