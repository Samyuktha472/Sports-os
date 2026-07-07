const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        coachId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        sport: {
            type: String,
            enum: ['cricket', 'tennis', 'kabaddi'],
        },
        schedule: {
            type: String,
            default: 'Mon–Fri · 6:00am–8:00am',
        },
        studentCount: {
            type: Number,
            default: 0,
        },
        athletes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        coaches: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        // Coaches who created this batch and requested to be added as a
        // regular Coach (not Head Coach) can be tracked here until an
        // owner/head_coach approves or rejects the request.
        pendingCoachRequests: [
            {
                coachId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                requestedAt: {
                    type: Date,
                    default: Date.now,
                },
                status: {
                    type: String,
                    enum: ['pending', 'approved', 'rejected'],
                    default: 'pending',
                },
            },
        ],
        academyName: {
            type: String,
            required: true,
            trim: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Batch', batchSchema);