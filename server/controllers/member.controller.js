const memberModel = require('../models/member.model');
const userModel = require('../models/user.model');
const EVENTS = require('../sockets/events');

const getMembers = async (req, res, next) => {
    try {
        const members = await memberModel.findByProject(Number(req.params.projectId));
        res.json(members);
    } catch (err) {
        next(err);
    }
};

const addMember = async (req, res, next) => {
    try {
        const { userId, role } = req.body;
        const projectId = Number(req.params.projectId);
        if (!userId || !role) return res.status(400).json({ message: 'userId and role are required' });

        const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const membership = await memberModel.add({ projectId, userId, role });

        const io = req.app.get('io');
        io.to(EVENTS.PROJECT_ROOM(projectId)).emit(EVENTS.MEMBER_ADDED, { userId, role, user });

        res.status(201).json(membership);
    } catch (err) {
        next(err);
    }
};

const removeMember = async (req, res, next) => {
    try {
        const projectId = Number(req.params.projectId);
        const userId = Number(req.params.userId);

        const removed = await memberModel.remove({ projectId, userId });
        if (!removed) return res.status(404).json({ message: 'Member not found' });

        const io = req.app.get('io');
        io.to(EVENTS.PROJECT_ROOM(projectId)).emit(EVENTS.MEMBER_REMOVED, { userId });

        res.json({ message: 'Member removed', membership: removed });
    } catch (err) {
        next(err);
    }
};

module.exports = { getMembers, addMember, removeMember };
