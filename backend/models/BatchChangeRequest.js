const mongoose = require('mongoose');

// A chat-style request an athlete opens when they want to move from their
// current batch to a different one. Both the current batch's coach and the
// target batch's coach can see the thread and reply — the athlete can only
// message within this thread, never directly to another athlete.
const batchChangeRequestSchema = new mongoose.Schema(
    {
        athleteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        currentBatchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Batch',
            required: true,
        },
        targetBatchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Batch',
            required: true,
        },
        // Denormalized so we can find/authorize requests without populating
        // the batches every time (e.g. "show me requests where I'm a coach").
        currentCoachId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        targetCoachId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        // Whichever coach approves/rejects — either the current or target
        // coach is authorized to act on this request.
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        resolvedAt: {
            type: Date,
        },
        messages: [
            {
                senderId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
                senderRole: {
                    type: String,
                    enum: ['athlete', 'coach', 'head_coach', 'owner'],
                    required: true,
                },
                text: {
                    type: String,
                    required: true,
                    trim: true,
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        academyName: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('BatchChangeRequest', batchChangeRequestSchema);