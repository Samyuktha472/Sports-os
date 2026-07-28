const mongoose = require('mongoose');

// Generic dashboard notification. Used for:
//   - 'coach_join_request'   → a coach who created a batch requests to be
//                              added to its coaches[] list (needs owner /
//                              head_coach approval)
//   - 'batch_change_request' → an athlete requests to move from their
//                              current batch to a different one (needs
//                              either the current or target coach to act)
// referenceId points at the Batch (for coach_join_request) or the
// BatchChangeRequest (for batch_change_request) that this notification is about.
const notificationSchema = new mongoose.Schema(
    {
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['coach_join_request', 'batch_change_request'],
            required: true,
        },
        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        // Which model referenceId points into — lets one route resolve
        // either kind of notification without guessing.
        referenceModel: {
            type: String,
            enum: ['Batch', 'BatchChangeRequest'],
            required: true,
        },
        fromUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        academyName: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);