const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createAnnouncement,
    getAnnouncements,
    deleteAnnouncement
} = require('../controllers/announcementController');

router.post('/', protect, createAnnouncement);
router.get('/', protect, getAnnouncements);
router.delete('/:id', protect, deleteAnnouncement);

module.exports = router;
