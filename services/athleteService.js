const Athlete = require("../models/Athlete");

// Get all athletes
const getAllAthletes = async () => {
    return await Athlete.find();
};

// Get athlete by ID
const getAthleteById = async (id) => {
    return await Athlete.findById(id);
};

// Add athlete
const addAthlete = async (data) => {

    // Business Rule 1
    if (!data.name) {
        throw new Error("Athlete name is required");
    }

    // Business Rule 2
    if (data.age < 10 || data.age > 50) {
        throw new Error("Age must be between 10 and 50");
    }

    // Business Rule 3
    if (!data.email) {
        throw new Error("Email is required");
    }

    // Business Rule 4
    const athleteExists = await Athlete.findOne({ email: data.email });

    if (athleteExists) {
        throw new Error("Email already exists");
    }

    // Save Athlete
    const athlete = new Athlete(data);

    return await athlete.save();
};
// Update athlete
const updateAthlete = async (id, data) => {
    return await Athlete.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true
    });
};

// Delete athlete
const deleteAthlete = async (id) => {
    return await Athlete.findByIdAndDelete(id);
};
module.exports = {
    getAllAthletes,
    getAthleteById,
    addAthlete,
    updateAthlete,
    deleteAthlete
};