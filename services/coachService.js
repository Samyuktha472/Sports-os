const Coach = require("../models/Coach");

// Get all coaches
const getAllCoaches = async () => {
    return await Coach.find();
};

// Get coach by ID
const getCoachById = async (id) => {
    return await Coach.findById(id);
};

// Add coach
const addCoach = async (data) => {

    if (!data.name) {
        throw new Error("Coach name is required");
    }

    const coachExists = await Coach.findOne({ email: data.email });

    if (coachExists) {
        throw new Error("Email already exists");
    }

    const coach = new Coach(data);

    return await coach.save();
};

// Update coach
const updateCoach = async (id, data) => {
    return await Coach.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true
    });
};

// Delete coach
const deleteCoach = async (id) => {
    return await Coach.findByIdAndDelete(id);
};

module.exports = {
    getAllCoaches,
    getCoachById,
    addCoach,
    updateCoach,
    deleteCoach
};