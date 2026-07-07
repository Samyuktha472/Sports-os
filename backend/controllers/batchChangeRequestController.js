const BatchChangeRequest = require('../models/BatchChangeRequest');
const Batch = require('../models/Batch');
const User = require('../models/User');
const Notification = require('../models/Notification');

// ── Helpers ──────────────────────────────────────────────────────────────

function isRequestCoach(request, userId) {
    return (
        String(request.currentCoachId) === String(userId) ||
        String(request.targetCoachId) === String(userId)
    );
}

// ── Athlete: create a new batch-change request ──────────────────────────
// Opens a chat thread visible to the athlete, the current batch's coach,
// and the target batch's coach. The athlete can never message anyone
// outside this thread.

exports.createRequest = async (req, res) => {
    try {
        const user = req.user;
        const { targetBatchId, message } = req.body;

        if (user.role !== 'athlete') {
            return res.status(403).json({ message: 'Only athletes can request a batch change' });
        }
        if (!targetBatchId || !message || !message.trim()) {
            return res.status(400).json({ message: 'Target batch and a message are required' });
        }

        const currentBatch = await Batch.findOne({
            athletes: user._id,
            academyName: user.academyName,
        });
        if (!currentBatch) {
            return res.status(404).json({ message: 'Could not find your current batch' });
        }

        const targetBatch = await Batch.findOne({
            _id: targetBatchId,
            academyName: user.academyName,
        });
        if (!targetBatch) {
            return res.status(404).json({ message: 'Target batch not found' });
        }
        if (String(targetBatch._id) === String(currentBatch._id)) {
            return res.status(400).json({ message: 'You are already in this batch' });
        }

        const existingPending = await BatchChangeRequest.findOne({
            athleteId: user._id,
            status: 'pending',
        });
        if (existingPending) {
            return res.status(400).json({ message: 'You already have a pending batch-change request' });
        }

        const changeRequest = new BatchChangeRequest({
            athleteId: user._id,
            currentBatchId: currentBatch._id,
            targetBatchId: targetBatch._id,
            currentCoachId: currentBatch.coachId,
            targetCoachId: targetBatch.coachId,
            academyName: user.academyName,
            messages: [
                {
                    senderId: user._id,
                    senderRole: 'athlete',
                    text: message.trim(),
                },
            ],
        });

        await changeRequest.save();

        // Notify both coaches (skip duplicate notification if it's the same person)
        const recipientIds = new Set([String(currentBatch.coachId), String(targetBatch.coachId)]);
        const notifications = [...recipientIds].map(id => ({
            recipientId: id,
            type: 'batch_change_request',
            referenceId: changeRequest._id,
            referenceModel: 'BatchChangeRequest',
            fromUserId: user._id,
            message: `${user.name} requested to move from "${currentBatch.name}" to "${targetBatch.name}"`,
            academyName: user.academyName,
        }));
        await Notification.insertMany(notifications);

        res.status(201).json(changeRequest);
    } catch (error) {
        console.error('createRequest error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ── Athlete: view my own requests ────────────────────────────────────────

exports.getMyRequests = async (req, res) => {
    try {
        const requests = await BatchChangeRequest.find({ athleteId: req.user._id })
            .populate('currentBatchId', 'name')
            .populate('targetBatchId', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error) {
        console.error('getMyRequests error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ── Coach: view requests where I'm the current or target coach ──────────

exports.getCoachRequests = async (req, res) => {
    try {
        const user = req.user;
        if (!['coach', 'head_coach', 'owner'].includes(user.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const requests = await BatchChangeRequest.find({
            academyName: user.academyName,
            $or: [{ currentCoachId: user._id }, { targetCoachId: user._id }],
        })
            .populate('athleteId', 'name initials')
            .populate('currentBatchId', 'name')
            .populate('targetBatchId', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json(requests);
    } catch (error) {
        console.error('getCoachRequests error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ── Get single thread (athlete owner or either coach can view) ──────────

exports.getRequestById = async (req, res) => {
    try {
        const user = req.user;
        const request = await BatchChangeRequest.findOne({
            _id: req.params.id,
            academyName: user.academyName,
        })
            .populate('athleteId', 'name initials')
            .populate('currentBatchId', 'name')
            .populate('targetBatchId', 'name')
            .populate('messages.senderId', 'name initials');

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const isOwnerAthlete = String(request.athleteId._id) === String(user._id);
        if (!isOwnerAthlete && !isRequestCoach(request, user._id)) {
            return res.status(403).json({ message: 'You do not have access to this request' });
        }

        res.status(200).json(request);
    } catch (error) {
        console.error('getRequestById error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ── Add a message to the thread (athlete owner or either coach) ─────────

exports.addMessage = async (req, res) => {
    try {
        const user = req.user;
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Message text is required' });
        }

        const request = await BatchChangeRequest.findOne({
            _id: req.params.id,
            academyName: user.academyName,
        });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const isOwnerAthlete = String(request.athleteId) === String(user._id);
        if (!isOwnerAthlete && !isRequestCoach(request, user._id)) {
            return res.status(403).json({ message: 'You do not have access to this request' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'This request has already been resolved' });
        }

        request.messages.push({
            senderId: user._id,
            senderRole: user.role,
            text: text.trim(),
        });
        await request.save();

        res.status(200).json(request);
    } catch (error) {
        console.error('addMessage error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ── Coach: approve → auto-transfer athlete to the target batch ──────────

exports.approveRequest = async (req, res) => {
    try {
        const user = req.user;
        const request = await BatchChangeRequest.findOne({
            _id: req.params.id,
            academyName: user.academyName,
        });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        if (!isRequestCoach(request, user._id)) {
            return res.status(403).json({ message: 'Only the current or target batch coach can approve this request' });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'This request has already been resolved' });
        }

        const [currentBatch, targetBatch] = await Promise.all([
            Batch.findById(request.currentBatchId),
            Batch.findById(request.targetBatchId),
        ]);
        if (!currentBatch || !targetBatch) {
            return res.status(404).json({ message: 'One of the batches no longer exists' });
        }

        // Auto-transfer: remove from current batch, add to target batch
        currentBatch.athletes = currentBatch.athletes.filter(
            a => String(a) !== String(request.athleteId)
        );
        if (!targetBatch.athletes.some(a => String(a) === String(request.athleteId))) {
            targetBatch.athletes.push(request.athleteId);
        }
        await Promise.all([currentBatch.save(), targetBatch.save()]);

        request.status = 'approved';
        request.resolvedBy = user._id;
        request.resolvedAt = new Date();
        request.messages.push({
            senderId: user._id,
            senderRole: user.role,
            text: `Request approved — you've been moved to "${targetBatch.name}".`,
        });
        await request.save();

        await Notification.updateMany(
            { referenceId: request._id, referenceModel: 'BatchChangeRequest' },
            { isRead: true }
        );

        res.status(200).json({ message: 'Request approved, athlete transferred', request });
    } catch (error) {
        console.error('approveRequest error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ── Coach: reject (no transfer) ──────────────────────────────────────────

exports.rejectRequest = async (req, res) => {
    try {
        const user = req.user;
        const request = await BatchChangeRequest.findOne({
            _id: req.params.id,
            academyName: user.academyName,
        });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        if (!isRequestCoach(request, user._id)) {
            return res.status(403).json({ message: 'Only the current or target batch coach can reject this request' });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'This request has already been resolved' });
        }

        request.status = 'rejected';
        request.resolvedBy = user._id;
        request.resolvedAt = new Date();
        request.messages.push({
            senderId: user._id,
            senderRole: user.role,
            text: 'Request rejected.',
        });
        await request.save();

        await Notification.updateMany(
            { referenceId: request._id, referenceModel: 'BatchChangeRequest' },
            { isRead: true }
        );

        res.status(200).json({ message: 'Request rejected', request });
    } catch (error) {
        console.error('rejectRequest error:', error);
        res.status(500).json({ message: error.message });
    }
};