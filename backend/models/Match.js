const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
{
    opponent: {
        type: String,
        required: true,
        trim: true,
    },

    format: {
        type: String,
        default: '',
    },

    sport: {
        type: String,
        enum: ['cricket', 'tennis', 'kabaddi'],
        required: true,
    },

    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
        required: true,
    },

    matchDate: {
        type: Date,
        required: true,
    },

    startTime: {
        type: String,
        required: true,
    },

    endTime: {
        type: String,
        required: true,
    },

    location: {
        type: String,
        default: '',
    },

    squadSize: {
        type: Number,
        default: 0,
    },

    academyName: {
        type: String,
        required: true,
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
},
{ timestamps: true }
);

module.exports = mongoose.model('Match', matchSchema);