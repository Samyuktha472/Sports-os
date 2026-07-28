const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    createRequest,
    getMyRequests,
    getCoachRequests,
    getRequestById,
    addMessage,
    approveRequest,
    rejectRequest,
} = require('../controllers/batchChangeRequestController');

const router = express.Router();

// Athlete creates a new batch-change request
router.post('/', protect, createRequest);

// Athlete: my own requests
router.get('/my', protect, getMyRequests);

// Coach: requests where I'm the current or target coach
router.get('/coach', protect, getCoachRequests);

// Single thread (athlete owner or either coach)
router.get('/:id', protect, getRequestById);

// Add a chat message to the thread
router.post('/:id/messages', protect, addMessage);

// Coach approves → athlete auto-transferred
router.post('/:id/approve', protect, approveRequest);

// Coach rejects
router.post('/:id/reject', protect, rejectRequest);

module.exports = router;