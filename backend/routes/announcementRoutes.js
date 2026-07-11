const express = require('express');
const router = express.Router();
const { protect, roleMiddleware } = require('../middleware/authMiddleware');
const { createAnnouncement, getAnnouncements, deleteAnnouncement } = require('../controllers/announcementController');

router.get('/', protect, getAnnouncements);
<<<<<<< HEAD
router.post('/', protect, roleMiddleware(['owner', 'head_coach', 'coach']), createAnnouncement);
=======

// Only allow owners and coaches to post announcements
router.post('/', protect, roleMiddleware(['owner', 'head_coach', 'coach']), createAnnouncement);

>>>>>>> 8e77183 (Update dashboard and fix announcement functionality)
router.delete('/:id', protect, roleMiddleware(['owner', 'head_coach', 'coach']), deleteAnnouncement);

module.exports = router;
