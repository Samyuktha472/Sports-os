const Batch = require('../models/Batch');

exports.getAllBatches = async (req, res) => {
    try {
        const user = req.user;

        // Get sport from query, otherwise use logged-in user's sport
        const selectedSport = req.query.sport || user.sport;

        let filter = { sport: selectedSport };

        if (user.academyName) {
            filter.academyName = user.academyName;
        }

        if (user.role === 'coach') {
            filter = {
                sport: selectedSport,
                $or: [
                    { coachId: user._id },
                    { coaches: user._id }
                ]
            };

            if (user.academyName) {
                filter.academyName = user.academyName;
            }
        }

        const batches = await Batch.find(filter)
            .populate('coachId', 'name email')
            .populate('athletes', 'name initials specialization');

        res.status(200).json(batches);

    } catch (err) {
        console.error('getAllBatches error:', err);
        res.status(500).json({ message: 'Failed to fetch batches' });
    }
};

exports.getBatchById = async (req, res) => {
    try {

        const selectedSport = req.query.sport || req.user.sport;

        const filter = {
            _id: req.params.id,
            sport: selectedSport
        };

        if (req.user.academyName) {
            filter.academyName = req.user.academyName;
        }

        const batch = await Batch.findOne(filter)
            .populate('athletes', 'name specialization initials');

        if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
        }

        res.status(200).json(batch);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createBatch = async (req, res) => {
    try {

        const { name, coachId, athletes, sport } = req.body;

        const batch = new Batch({
            name,
            coachId,
            athletes,
            sport: sport || req.user.sport,
            academyName: req.user.academyName
        });

        await batch.save();

        res.status(201).json(batch);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};