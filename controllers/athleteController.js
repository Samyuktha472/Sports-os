const athleteService = require("../services/athleteService");

// Get all athletes
const getAllAthletes = async (req, res) => {
    try {
        const athletes = await athleteService.getAllAthletes();
        res.status(200).json(athletes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get athlete by ID
const getAthleteById = async (req, res) => {
    try {
        const athlete = await athleteService.getAthleteById(req.params.id);

        if (!athlete) {
            return res.status(404).json({ message: "Athlete not found" });
        }

        res.status(200).json(athlete);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add athlete
const addAthlete = async (req, res) => {
    try {
        const athlete = await athleteService.addAthlete(req.body);
        res.status(201).json(athlete);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
// Update athlete
const updateAthlete = async (req, res) => {
    try {
        const athlete = await athleteService.updateAthlete(
            req.params.id,
            req.body
        );

        if (!athlete) {
            return res.status(404).json({
                message: "Athlete not found"
            });
        }

        res.status(200).json(athlete);
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};

// Delete athlete
const deleteAthlete = async (req, res) => {
    try {
        const athlete = await athleteService.deleteAthlete(req.params.id);

        if (!athlete) {
            return res.status(404).json({
                message: "Athlete not found"
            });
        }

        res.status(200).json({
            message: "Athlete deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    getAllAthletes,
    getAthleteById,
    addAthlete,
    updateAthlete,
    deleteAthlete
};