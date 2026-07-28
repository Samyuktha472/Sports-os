const Batch = require('../models/Batch');
const User = require('../models/User');
const Notification = require('../models/Notification');

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
        const { name, coachId, coaches, athletes, sport } = req.body;
        const user = req.user;

        if (!name) {
            return res.status(400).json({ message: 'Batch name is required' });
        }

        let finalCoachId;
        let finalCoaches = [];

        if (user.role === 'owner') {
            // Owner picks any head coach + any coaches
            if (!coachId) {
                return res.status(400).json({ message: 'Head coach is required' });
            }
            finalCoachId = coachId;
            finalCoaches = Array.isArray(coaches) ? coaches : [];
        } else if (user.role === 'head_coach') {
            // Head coach is always themself; they can add coaches
            finalCoachId = user._id;
            finalCoaches = Array.isArray(coaches) ? coaches : [];
        } else if (user.role === 'coach') {
            // Coach is always themself; cannot add other coaches
            finalCoachId = user._id;
            finalCoaches = [];
        } else {
            return res.status(403).json({ message: 'You are not authorized to create batches' });
        }

        const batch = new Batch({
            name,
            coachId: finalCoachId,
            coaches: finalCoaches,
            athletes: Array.isArray(athletes) ? athletes : [],
            sport: sport || user.sport,
            academyName: user.academyName,
        });

        await batch.save();
        res.status(201).json(batch);
    } catch (error) {
        console.error('createBatch error:', error);
        res.status(500).json({ message: error.message });
    }
};
exports.updateBatch = async (req, res) => {
    try {
        const { name, coachId, coaches, athletes } = req.body;
        const user = req.user;

        const filter = { _id: req.params.id };
        if (user.academyName) filter.academyName = user.academyName;

        const batch = await Batch.findOne(filter);
        if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
        }

        if (name) batch.name = name;
        if (Array.isArray(athletes)) batch.athletes = athletes;

        if (user.role === 'owner') {
            if (coachId) batch.coachId = coachId;
            if (Array.isArray(coaches)) batch.coaches = coaches;
        } else if (user.role === 'head_coach') {
            // head_coach cannot change who the head coach is, but can manage coaches list
            if (Array.isArray(coaches)) batch.coaches = coaches;
        } else if (user.role === 'coach') {
            // coach can only touch athletes, already handled above
        } else {
            return res.status(403).json({ message: 'You are not authorized to edit batches' });
        }

        await batch.save();
        res.status(200).json(batch);
    } catch (error) {
        console.error('updateBatch error:', error);
        res.status(500).json({ message: error.message });
    }
};
exports.deleteBatch = async (req, res) => {
    try {
        const user = req.user;
        const filter = { _id: req.params.id };
        if (user.academyName) filter.academyName = user.academyName;

        const batch = await Batch.findOne(filter);
        if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
        }

        // Only owner and head_coach can delete batches
        if (user.role !== 'owner' && user.role !== 'head_coach') {
            return res.status(403).json({ message: 'You are not authorized to delete batches' });
        }

        await Batch.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: 'Batch deleted successfully' });
    } catch (error) {
        console.error('deleteBatch error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ── Coach join requests ─────────────────────────────────────────────────
// A coach who created a batch (and so is auto-set as its coachId /
// "Head Coach" slot) can request to instead be added as a regular Coach
// (coaches[] entry) on that batch. Owner/head_coach approve or reject.

exports.requestCoachJoin = async (req, res) => {
    try {
        const user = req.user;

        if (user.role !== 'coach') {
            return res.status(403).json({ message: 'Only coaches can request to join a batch as a coach' });
        }

        const filter = { _id: req.params.id };
        if (user.academyName) filter.academyName = user.academyName;

        const batch = await Batch.findOne(filter);
        if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
        }

        // Only the coach who created the batch (i.e. is currently its
        // coachId) can request to be re-added as a plain coach on it.
        if (String(batch.coachId) !== String(user._id)) {
            return res.status(403).json({ message: 'You can only request to join batches you created' });
        }

        const alreadyCoach = batch.coaches.some(c => String(c) === String(user._id));
        if (alreadyCoach) {
            return res.status(400).json({ message: 'You are already listed as a coach on this batch' });
        }

        const alreadyPending = batch.pendingCoachRequests.some(
            r => String(r.coachId) === String(user._id) && r.status === 'pending'
        );
        if (alreadyPending) {
            return res.status(400).json({ message: 'You already have a pending request for this batch' });
        }

        batch.pendingCoachRequests.push({ coachId: user._id });
        await batch.save();

        // Notify every owner and head_coach in this academy
        const recipients = await User.find({
            academyName: user.academyName,
            role: { $in: ['owner', 'head_coach'] },
        }).select('_id');

        if (recipients.length) {
            const notifications = recipients.map(r => ({
                recipientId: r._id,
                type: 'coach_join_request',
                referenceId: batch._id,
                referenceModel: 'Batch',
                fromUserId: user._id,
                message: `${user.name} requested to be added as a coach on "${batch.name}"`,
                academyName: user.academyName,
            }));
            await Notification.insertMany(notifications);
        }

        res.status(200).json({ message: 'Request sent to owner/head coach', batch });
    } catch (error) {
        console.error('requestCoachJoin error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.approveCoachJoin = async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'owner' && user.role !== 'head_coach') {
            return res.status(403).json({ message: 'You are not authorized to approve coach requests' });
        }

        const filter = { _id: req.params.id };
        if (user.academyName) filter.academyName = user.academyName;

        const batch = await Batch.findOne(filter);
        if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
        }

        const request = batch.pendingCoachRequests.find(
            r => String(r.coachId) === String(req.params.coachId) && r.status === 'pending'
        );
        if (!request) {
            return res.status(404).json({ message: 'No pending request found for this coach' });
        }

        request.status = 'approved';
        if (!batch.coaches.some(c => String(c) === String(request.coachId))) {
            batch.coaches.push(request.coachId);
        }
        await batch.save();

        await Notification.updateMany(
            { referenceId: batch._id, referenceModel: 'Batch', type: 'coach_join_request' },
            { isRead: true }
        );

        res.status(200).json({ message: 'Coach request approved', batch });
    } catch (error) {
        console.error('approveCoachJoin error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.rejectCoachJoin = async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'owner' && user.role !== 'head_coach') {
            return res.status(403).json({ message: 'You are not authorized to reject coach requests' });
        }

        const filter = { _id: req.params.id };
        if (user.academyName) filter.academyName = user.academyName;

        const batch = await Batch.findOne(filter);
        if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
        }

        const request = batch.pendingCoachRequests.find(
            r => String(r.coachId) === String(req.params.coachId) && r.status === 'pending'
        );
        if (!request) {
            return res.status(404).json({ message: 'No pending request found for this coach' });
        }

        request.status = 'rejected';
        await batch.save();

        await Notification.updateMany(
            { referenceId: batch._id, referenceModel: 'Batch', type: 'coach_join_request' },
            { isRead: true }
        );

        res.status(200).json({ message: 'Coach request rejected', batch });
    } catch (error) {
        console.error('rejectCoachJoin error:', error);
        res.status(500).json({ message: error.message });
    }
};