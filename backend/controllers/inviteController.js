const Invite = require('../models/Invite');
const User = require('../models/User');
const { EMAIL_REGEX, NAME_REGEX, STRONG_PASSWORD_REGEX } = require('../utils/validators');

// POST /api/invites/create
// Only owner, head_coach, coach can invite (with role restrictions)
exports.createInvite = async (req, res) => {
    try {
        const inviter = req.user;
        const { email, role } = req.body;

        if (!email || !role) {
            return res.status(400).json({ message: 'Email and role are required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        if (!EMAIL_REGEX.test(normalizedEmail)) {
            return res.status(400).json({ message: 'Enter a valid email address.' });
        }

        // Role permission check
        const allowed = {
            owner:      ['head_coach', 'coach', 'athlete'],
            head_coach: ['coach', 'athlete'],
            coach:      ['athlete'],
        };
        if (!allowed[inviter.role]?.includes(role)) {
            return res.status(403).json({ message: `You cannot invite a ${role}.` });
        }

        // Check if user already exists
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(400).json({ message: 'A user with this email already exists.' });
        }

        // Check if active invite already exists for this email
        const existingInvite = await Invite.findOne({
            email: normalizedEmail,
            used: false,
            expiresAt: { $gt: new Date() },
        });
        if (existingInvite) {
            return res.status(400).json({ message: 'An active invite already exists for this email.' });
        }

        const selectedSport = req.body.sport;

if (!selectedSport) {
    return res.status(400).json({
        message: "Please select a sport"
    });
}

if (
    inviter.role === "owner" &&
    inviter.sports &&
    !inviter.sports.includes(selectedSport)
) {
    return res.status(400).json({
        message: "Invalid sport selected"
    });
}

const invite = await Invite.create({
    email,
    role,
    academyName: inviter.academyName,
    sport: selectedSport,
    invitedBy: inviter._id
});

        const link = `${req.protocol}://${req.get('host')}/accept-invite.html?token=${invite.token}`;

        res.status(201).json({ link });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/invites/:token
// Public — fetch invite details to pre-fill the form
exports.getInvite = async (req, res) => {
    try {
        const invite = await Invite.findOne({
            token: req.params.token,
            used: false,
            expiresAt: { $gt: new Date() },
        });

        if (!invite) {
            return res.status(404).json({ message: 'Invite link is invalid or has expired.' });
        }

        res.json({
            email: invite.email,
            role: invite.role,
            academyName: invite.academyName,
            sport: invite.sport,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/invites/accept
// Public — complete registration via invite
exports.acceptInvite = async (req, res) => {
    try {
        const { token, password, name, phone, specialization, dob, bloodGroup, emergencyContact, batchAssigned } = req.body;

        const invite = await Invite.findOne({
            token,
            used: false,
            expiresAt: { $gt: new Date() },
        });

        if (!invite) {
            return res.status(404).json({ message: 'Invite link is invalid or has expired.' });
        }

        if (!name || !NAME_REGEX.test(name.trim())) {
            return res.status(400).json({ message: 'Name must start with a letter and contain only letters, spaces, hyphens or apostrophes.' });
        }

        if (!EMAIL_REGEX.test(invite.email)) {
            return res.status(400).json({ message: 'Invite email is invalid.' });
        }

        if (!STRONG_PASSWORD_REGEX.test(password)) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
            });
        }

        const user = await User.create({
            name,
            email: invite.email,
            password,
            role: invite.role,
            academyName: invite.academyName,
            sport: invite.sport,
            phone: phone || '',
            specialization: specialization || '',
            dob: dob || '',
            bloodGroup: bloodGroup || '',
            emergencyContact: emergencyContact || '',
            batchAssigned: batchAssigned || '',
        });

        invite.used = true;
        await invite.save();

        const jwt = require('jsonwebtoken');
        const token2 = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.status(201).json({
            token: token2,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                sport: user.sport,
                academyName: user.academyName,
                initials: user.initials,
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};