const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    createMatch,
    getUpcomingMatch,
    getAllMatches,
} = require('../controllers/matchController');

const router = express.Router();

router.get('/upcoming', protect, getUpcomingMatch);
router.get('/', protect, getAllMatches);
router.post('/', protect, createMatch);

module.exports = router;