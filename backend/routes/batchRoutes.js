const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    getAllBatches,
    getBatchById,
    createBatch,
    updateBatch,
    deleteBatch,
    requestCoachJoin,
    approveCoachJoin,
    rejectCoachJoin,
} = require('../controllers/batchController');

const router = express.Router();

router.get('/', protect, getAllBatches);
router.get('/:id', protect, getBatchById);
router.post('/', protect, createBatch);
router.put('/:id', protect, updateBatch);
router.delete('/:id', protect, deleteBatch);

// Coach join requests — a coach who created a batch asks to be added
// to its coaches[] list; owner/head_coach approve or reject.
router.post('/:id/request-coach', protect, requestCoachJoin);
router.post('/:id/coach-requests/:coachId/approve', protect, approveCoachJoin);
router.post('/:id/coach-requests/:coachId/reject', protect, rejectCoachJoin);

module.exports = router;