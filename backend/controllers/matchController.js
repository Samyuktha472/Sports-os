const Match = require("../models/Match");
const Timetable = require("../models/Timetable");
const Batch = require("../models/Batch");

// Create Match
exports.createMatch = async (req, res) => {
    try {
        const {
            opponent,
            format,
            sport,
            batch,
            matchDate,
            startTime,
            endTime,
            location,
            squadSize
        } = req.body;

        if (
            !opponent ||
            !sport ||
            !batch ||
            !matchDate ||
            !startTime ||
            !endTime
        ) {
            return res.status(400).json({
                message: "Please fill all required fields."
            });
        }

        const batchData = await Batch.findById(batch);

        if (!batchData) {
            return res.status(404).json({
                message: "Batch not found."
            });
        }

        if (batchData.sport !== sport) {
            return res.status(400).json({
                message: "Selected batch does not belong to selected sport."
            });
        }

        const dayOfWeek = new Date(matchDate).toLocaleDateString("en-US", {
            weekday: "long"
        });

        const clash = await Timetable.findOne({
            batch,
            dayOfWeek,
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
        });

        if (clash) {
            return res.status(400).json({
                message: `Batch already has a session from ${clash.startTime} to ${clash.endTime}.`
            });
        }

        const match = await Match.create({
            opponent,
            format,
            sport,
            batch,
            matchDate,
            startTime,
            endTime,
            location,
            squadSize,
            academyName: req.user.academyName,
            createdBy: req.user._id
        });

        res.status(201).json(match);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Get nearest upcoming match
exports.getUpcomingMatch = async (req, res) => {
    try {

        const filters = {
            matchDate: { $gte: new Date() }
        };

        if (req.user.academyName)
            filters.academyName = req.user.academyName;

        if (req.user.sport)
            filters.sport = req.user.sport;

        const match = await Match.findOne(filters)
            .populate("batch", "name sport")
            .sort({ matchDate: 1 });

        if (!match)
            return res.status(200).json(null);

        res.status(200).json(match);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }
};

// Get all matches
exports.getAllMatches = async (req, res) => {

    try {

        const filters = {};

        if (req.user.academyName)
            filters.academyName = req.user.academyName;

        if (req.user.sport)
            filters.sport = req.user.sport;

        const matches = await Match.find(filters)
            .populate("batch", "name")
            .sort({ matchDate: 1 });

        res.status(200).json(matches);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }
};

// Delete Match
exports.deleteMatch = async (req, res) => {

    try {

        await Match.findByIdAndDelete(req.params.id);

        res.json({
            message: "Match deleted successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }
};