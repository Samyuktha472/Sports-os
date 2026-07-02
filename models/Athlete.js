const mongoose = require("mongoose");

const athleteSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    age: {
        type: Number,
        required: true
    },

    gender: {
        type: String,
        required: true
    },

    sport: {
        type: String,
        required: true
    },

    coach: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    address: {
        type: String,
        required: true
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Athlete", athleteSchema);