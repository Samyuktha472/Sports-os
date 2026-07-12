const Invite = require('../models/Invite');
const User = require('../models/User');
const { EMAIL_REGEX, NAME_REGEX, STRONG_PASSWORD_REGEX } = require('../utils/validators');

// POST /api/invites/create
// Only owner, head_coach, coach can invite (with role restrictions)
exports.createInvite = async (req, res) => {
    try {
        const inviter = req.user;
        const { email, phone, role } = req.body;
        if ((!email && !phone) || !role) {
    return res.status(400).json({
        message: "Email or phone number is required."
    });
}

        let normalizedEmail = "";

if (email) {
    normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({
            message: "Enter a valid email address."
        });
    }
}
      let normalizedPhone = "";

if (phone) {
    normalizedPhone = phone.trim();

    if (!/^\d{10}$/.test(normalizedPhone)) {
        return res.status(400).json({
            message: "Phone number must contain exactly 10 digits."
        });
    }
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
        const existing = await User.findOne({
    $or: [
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : [])
    ]
});

if (existing) {
    if (normalizedEmail && existing.email === normalizedEmail) {
        return res.status(400).json({
            message: "A user with this email already exists."
        });
    }

    if (normalizedPhone && existing.phone === normalizedPhone) {
        return res.status(400).json({
            message: "A user with this phone number already exists."
        });
    }
}

        // Check if active invite already exists for this email/phone
        const existingInvite = await Invite.findOne({
            $or: [
                ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
                ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
            ],
            used: false,
            expiresAt: { $gt: new Date() },
        });
        if (existingInvite) {
            return res.status(400).json({ message: 'An active invite already exists for this email or phone number.' });
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
    email: normalizedEmail,
    phone: normalizedPhone,
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
            phone: invite.phone,
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
        const { token, password, name, email, phone, specialization, dob, bloodGroup, emergencyContact, batchAssigned } = req.body;

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

        if (!STRONG_PASSWORD_REGEX.test(password)) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
            });
        }

        // Use the email captured at invite time if there is one; otherwise the invite
        // was created with phone only, so collect and validate it here.
        let normalizedEmail = invite.email ? invite.email.trim().toLowerCase() : '';
        if (!normalizedEmail) {
            normalizedEmail = email ? email.trim().toLowerCase() : '';
            if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
                return res.status(400).json({ message: 'Enter a valid email address.' });
            }
        }

        // Same idea for phone: only ask for it here if the invite didn't already have one.
        let normalizedPhone = invite.phone ? invite.phone.trim() : '';
        if (!normalizedPhone) {
            normalizedPhone = phone ? phone.trim() : '';
            if (!normalizedPhone || !/^\d{10}$/.test(normalizedPhone)) {
                return res.status(400).json({ message: 'Phone number must contain exactly 10 digits.' });
            }
        }

        const existing = await User.findOne({
            $or: [
                ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
                ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
            ],
        });

        if (existing) {
            if (normalizedEmail && existing.email === normalizedEmail) {
                return res.status(400).json({ message: 'This email is already registered.' });
            }
            if (normalizedPhone && existing.phone === normalizedPhone) {
                return res.status(400).json({ message: 'This phone number is already registered.' });
            }
        }

        const user = await User.create({
            name,
            email: normalizedEmail,
            password,
            role: invite.role,
            academyName: invite.academyName,
            sport: invite.sport,
            phone: normalizedPhone,
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
    if (err.code === 11000) {
        return res.status(400).json({
            message: "Email or phone number already exists."
        });
    }

    res.status(500).json({
        message: err.message
    });
}
};