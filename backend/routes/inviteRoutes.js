const express = require('express');
const router = express.Router();
const { createInvite, getInvite, acceptInvite } = require('../controllers/inviteController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create', protect, createInvite);
router.get('/:token', getInvite);
router.post('/accept', acceptInvite);

module.exports = router;