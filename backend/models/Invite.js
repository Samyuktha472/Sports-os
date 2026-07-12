const mongoose = require('mongoose');
const crypto = require('crypto');

const inviteSchema = new mongoose.Schema({
    email: {
        type: String,
        lowercase: true,
        trim: true,
        default: "",
    },
    phone: {
    type: String,
    trim: true,
    default: ""
},
    role: {
        type: String,
        enum: ['head_coach', 'coach', 'athlete'],
        required: true,
    },
    academyName: {
        type: String,
        required: true,
    },
    sport: {
        type: String,
        enum: ['cricket', 'tennis', 'kabaddi'],
        required: true,
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    token: {
        type: String,
        default: () => crypto.randomBytes(32).toString('hex'),
        unique: true,
    },
    used: {
        type: Boolean,
        default: false,
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
});

module.exports = mongoose.model('Invite', inviteSchema);