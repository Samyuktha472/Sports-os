const Announcement = require('../models/Announcement');

exports.createAnnouncement = async (req, res) => {
    try {
        const { title, message, sport } = req.body;

        if (!title || !message) {
            return res.status(400).json({ message: 'Title and message are required.' });
        }

        const academyName = req.user.academyName;
        if (!academyName) {
            return res.status(400).json({ message: 'User academy name is required.' });
        }

        const announcement = new Announcement({
            title: title.trim(),
            message: message.trim(),
            sport: (sport || 'all').toLowerCase(),
            academyName: academyName,
            createdBy: req.user._id
        });

        await announcement.save();
        res.status(201).json(announcement);
    } catch (err) {
        console.error('Error creating announcement:', err);
        res.status(500).json({ message: err.message || 'Failed to create announcement' });
    }
};

exports.getAnnouncements = async (req, res) => {
    try {
        const academyName = req.user.academyName;
        if (!academyName) return res.json([]);

        const filters = { academyName };
        if (req.user.sport) {
            filters.sport = { $in: [req.user.sport.toLowerCase(), 'all'] };
        }

        const announcements = await Announcement.find(filters).sort({ createdAt: -1 }).limit(10);
        res.json(announcements);
    } catch (err) {
        console.error('Error fetching announcements:', err);
        res.status(500).json({ message: 'Failed to fetch announcements' });
    }
};

exports.deleteAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) return res.status(404).json({ message: 'Announcement not found.' });

        if (announcement.academyName !== req.user.academyName) {
            return res.status(403).json({ message: 'Unauthorized access.' });
        }

        await Announcement.findByIdAndDelete(req.params.id);
        res.json({ message: 'Announcement deleted successfully' });
    } catch (err) {
        console.error('Error deleting announcement:', err);
        res.status(500).json({ message: 'Failed to delete announcement' });
    }
};
