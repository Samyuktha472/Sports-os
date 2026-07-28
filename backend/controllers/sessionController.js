const Session = require('../models/Session');

exports.logSession = async (req, res) => {
    try {

        // Only Head Coach can create sessions with voice notes
        if (req.user.role !== 'head_coach') {
            return res.status(403).json({
                message: 'Only Head Coach can log training sessions.'
            });
        }

        const {
            drillType,
            sessionDate,
            coachNotes,
            batch,
            loggedBy,
            voiceNoteUrl
        } = req.body;

        const session = new Session({
            drillType,
            sessionDate,
            coachNotes,
            batch,
            loggedBy,
            voiceNoteUrl,
            sport: req.user?.sport || '',
            academyName: req.user?.academyName || '',
        });

        await session.save();

        res.status(201).json(session);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getSessions = async (req, res) => {
    if (req.user.role === 'owner') {
    return res.status(403).json({
        message: 'Owners cannot access session voice logs.'
    });
}
    try {
        const { batchId, date } = req.query;
        const filters = {};

        if (req.user?.sport) filters.sport = req.user.sport;
        if (req.user?.academyName) filters.academyName = req.user.academyName;

        if (batchId) filters.batch = batchId;

        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            filters.sessionDate = { $gte: start, $lte: end };
        }

        const sessions = await Session.find(filters)
            .sort({ createdAt: -1 })
            .populate('loggedBy', 'name')
            .populate('batch', 'name');

        res.status(200).json(sessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSessionById = async (req, res) => {
    if (req.user.role === 'owner') {
    return res.status(403).json({
        message: 'Owners cannot access session voice logs.'
    });
}
    try {
        const session = await Session.findById(req.params.id)
            .populate('loggedBy', 'name')
            .populate('batch', 'name');

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // sport check
        if (req.user?.sport && session.sport && session.sport !== req.user.sport) {
            return res.status(403).json({ message: 'Access denied.' });
        }
        if (req.user?.academyName && session.academyName && session.academyName !== req.user.academyName) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        res.status(200).json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};