const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { NAME_REGEX, EMAIL_REGEX, STRONG_PASSWORD_REGEX, VALID_SPORTS } = require('../utils/validators');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// POST /api/auth/register
// Owner self-registration ONLY. head_coach / coach / athlete accounts are created
// exclusively through the invite flow (inviteController.acceptInvite) — they never
// hit this endpoint, so this can't be used to forge a role.
exports.register = async (req, res) => {
    try {
        const { name, email, phone, password, academyName, sports } = req.body;

        if (!name || !email || !password || !academyName) {
            return res.status(400).json({ message: 'name, email, password, and academyName are required.' });
        }

        const trimmedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();
        const trimmedAcademyName = academyName.trim();

        if (!NAME_REGEX.test(trimmedName)) {
            return res.status(400).json({ message: 'Name must start with a letter and contain only letters, spaces, hyphens or apostrophes.' });
        }

        if (!EMAIL_REGEX.test(normalizedEmail)) {
            return res.status(400).json({ message: 'Enter a valid email address.' });
        }

        if (!STRONG_PASSWORD_REGEX.test(password)) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character (@$!%*?&).'
            });
        }

        if (trimmedAcademyName.length < 3) {
            return res.status(400).json({ message: 'Academy name must be at least 3 characters.' });
        }

        const existingEmail = await User.findOne({ email: normalizedEmail });
        if (existingEmail) {
            return res.status(400).json({ message: 'A user with this email already exists.' });
        }
        const existingPhone = await User.findOne({ phone: phone.trim() });

if (existingPhone) {
    return res.status(400).json({
        message: "This phone number is already registered."
    });
}
        // One academy name = one tenant. Block near-duplicates (case-insensitive) so two
        // owners can never end up sharing — and seeing — each other's data.
        const existingAcademy = await User.findOne({
            role: 'owner',
            academyName: { $regex: `^${escapeRegex(trimmedAcademyName)}$`, $options: 'i' },
        });
        if (existingAcademy) {
            return res.status(400).json({ message: 'An academy with this name is already registered. Please choose a different name.' });
        }

        const validatedSports = Array.isArray(sports) ? sports.filter(s => VALID_SPORTS.includes(s)) : [];
const finalSports = validatedSports.length > 0 ? validatedSports : ['cricket'];

        const user = await User.create({
            name: trimmedName,
            email: normalizedEmail,
            phone,
            password,
            role: 'owner',
            academyName: trimmedAcademyName,
            sport: finalSports[0],
sports: finalSports, // keep single 'sport' field for backward compatibility with existing code
        });

        res.status(201).json({
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                sport: user.sport,
                sports: user.sports,
                academyName: user.academyName,
                initials: user.initials,
                profilePicture: user.profilePicture,
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                message: 'Email/Mobile and password are required.'
            });
        }

        // Check whether user entered email or mobile number
        let user;

        if (identifier.includes("@")) {
            user = await User.findOne({
                email: identifier.trim().toLowerCase()
            });
        } else {
            user = await User.findOne({
                phone: identifier.trim()
            });
        }

        if (!user) {
            return res.status(401).json({
                message: 'Invalid email/mobile or password.'
            });
        }

        const match = await user.comparePassword(password);

        if (!match) {
            return res.status(401).json({
                message: 'Invalid email/mobile or password.'
            });
        }

        if (req.body.role && req.body.role !== user.role) {
            return res.status(401).json({
                message: 'Incorrect role selected for this account.'
            });
        }

        let sport = user.sport || '';
        let sports = user.sports || [];

        if (user.role !== 'owner') {
            const owner = await User.findOne({
                role: 'owner',
                academyName: user.academyName
            });

            if (owner) {
                sport = owner.sport || '';
                sports = owner.sports || [];
            }
        }

        res.status(200).json({
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                sport,
                sports,
                academyName: user.academyName,
                initials: user.initials,
                batchAssigned: user.batchAssigned,
                specialization: user.specialization,
                profilePicture: user.profilePicture,
            }
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found.' });

        res.status(200).json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            sport: user.sport,
            sports: user.sports,
            academyName: user.academyName,
            initials: user.initials,
            batchAssigned: user.batchAssigned,
            specialization: user.specialization,
            profilePicture: user.profilePicture,
            phone: user.phone,
            bloodGroup: user.bloodGroup,
            emergencyContact: user.emergencyContact,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/auth/coaches
// Tenant-scoped: same academy AND same sport. (Previously only filtered by sport —
// this was leaking coach lists across unrelated academies.)
exports.getCoaches = async (req, res) => {
    try {
        const filter = { role: { $in: ['coach', 'head_coach'] } };
        if (req.user?.academyName) {
            filter.academyName = req.user.academyName;
        }
        if (req.user?.sport) {
            filter.sport = req.user.sport;
        }
        const coaches = await User.find(filter).select('-password');
        res.status(200).json(coaches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PATCH /api/auth/profile-picture
exports.updateProfilePicture = async (req, res) => {
    try {
        const { profilePicture } = req.body;
        if (!profilePicture) return res.status(400).json({ message: 'profilePicture is required.' });

        const user = await User.findByIdAndUpdate(
            req.user.id, { profilePicture }, { new: true, runValidators: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: 'User not found.' });

        res.status(200).json({
            id: user._id, name: user.name, email: user.email,
            role: user.role, sport: user.sport, initials: user.initials,
            batchAssigned: user.batchAssigned, specialization: user.specialization,
            profilePicture: user.profilePicture,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PATCH /api/auth/profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, email, phone, bloodGroup, emergencyContact } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required.' });
        }

        if (!NAME_REGEX.test(name.trim())) {
            return res.status(400).json({ message: 'Name must start with a letter and contain only letters, spaces, hyphens or apostrophes.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        if (!EMAIL_REGEX.test(normalizedEmail)) {
            return res.status(400).json({ message: 'Enter a valid email address.' });
        }

        const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: req.user.id } });
        if (existing) {
            return res.status(409).json({ message: 'Email already in use.' });
        }

        const updates = { name: name.trim(), email: normalizedEmail };
        if (phone !== undefined) updates.phone = phone.trim();
        if (bloodGroup !== undefined) updates.bloodGroup = bloodGroup.trim();
        if (emergencyContact !== undefined) updates.emergencyContact = emergencyContact.trim();

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            sport: user.sport,
            academyName: user.academyName,
            initials: user.initials,
            batchAssigned: user.batchAssigned,
            specialization: user.specialization,
            profilePicture: user.profilePicture,
            phone: user.phone,
            bloodGroup: user.bloodGroup,
            emergencyContact: user.emergencyContact,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/auth/google/callback
exports.googleCallback = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.redirect('/login.html?error=no_account');
        }
        const token = generateToken(user._id);

        let sport = user.sport || '';
        if (!sport && user.role !== 'owner') {
            const owner = await User.findOne({ role: 'owner', academyName: user.academyName });
            if (owner) sport = owner.sport || '';
        }

        const params = new URLSearchParams({
            token,
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            sport,
            academyName: user.academyName || '',
        });

        res.redirect(`/login.html?googleAuth=${encodeURIComponent(params.toString())}`);
    } catch (err) {
        res.redirect('/login.html?error=google_failed');
    }
};