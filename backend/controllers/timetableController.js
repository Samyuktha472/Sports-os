const Timetable = require('../models/Timetable');
const Batch = require('../models/Batch');

exports.getTimetable = async (req, res) => {
    try {
        const user = req.user;
        let filter = {};

        // Always try to filter by academy if available
        if (user.academyName) {
            filter.academyName = user.academyName;
        }

        if (user.role === 'coach') {
            const myBatches = await Batch.find({ coachId: user._id, academyName: user.academyName }).select('_id');
            if (myBatches.length > 0) {
                filter.batch = { $in: myBatches.map(b => b._id) };
            }
        } else if (user.role === 'athlete') {
            const myBatch = await Batch.findOne({ athletes: user._id, academyName: user.academyName }).select('_id');
            filter.batch = myBatch ? myBatch._id : { _id: null };
        }

        const slots = await Timetable.find(filter)
            .populate('batch', 'name')
            .populate('coach', 'name')
            .sort({ dayOfWeek: 1, startTime: 1 });

        res.status(200).json(slots);
    } catch (err) {
        console.error('getTimetable error:', err);
        res.status(500).json({ message: 'Failed to fetch timetable' });
    }
};

exports.createEntry = async (req, res) => {
    try {
        const { batch, coach, dayOfWeek, startTime, endTime, activityType, location, notes } = req.body;

        const slot = new Timetable({
            batch, coach, dayOfWeek, startTime, endTime,
            activityType, location, notes,
            createdBy: req.user._id,
            academyName: req.user.academyName,
        });

        await slot.save();
        const populated = await slot.populate([
            { path: 'batch', select: 'name' },
            { path: 'coach', select: 'name' },
        ]);

        res.status(201).json(populated);
    } catch (err) {
        console.error('createEntry error:', err);
        res.status(500).json({ message: err.message || 'Failed to create timetable slot' });
    }
};

exports.updateEntry = async (req, res) => {
    try {
        const slot = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('batch', 'name')
            .populate('coach', 'name');

        if (!slot) return res.status(404).json({ message: 'Slot not found' });
        res.status(200).json(slot);
    } catch (err) {
        console.error('updateEntry error:', err);
        res.status(500).json({ message: err.message || 'Failed to update timetable slot' });
    }
};

exports.deleteEntry = async (req, res) => {
    try {
        await Timetable.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Slot deleted successfully' });
    } catch (err) {
        console.error('deleteEntry error:', err);
        res.status(500).json({ message: 'Failed to delete timetable slot' });
    }
};
