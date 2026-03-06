const { query } = require('../config/db');
const crypto = require('crypto');
const { sendInvitationEmail } = require('../services/mail.service');
const projectModel = require('../models/project.model');
const memberModel = require('../models/member.model');

const sendInvite = async (req, res, next) => {
    try {
        const { projectId: rawProjectId, email, role } = req.body;
        const invitedBy = req.user.id;
        const projectId = Number(rawProjectId);

        console.log('Sending invite:', { projectId, email, role, invitedBy });

        if (!projectId || !email || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const project = await projectModel.findById(projectId);
        if (!project) {
            console.log('Project not found:', projectId);
            return res.status(404).json({ message: 'Project not found' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        await query(
            `INSERT INTO invitations (project_id, email, token, role, invited_by, expires_at) 
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (project_id, email) DO UPDATE 
             SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at, accepted_at = NULL`,
            [projectId, email, token, role, invitedBy, expiresAt]
        );

        const inviteLink = `${process.env.CLIENT_URL}/invitations/accept/${token}`;
        const sent = await sendInvitationEmail(email, project.title, inviteLink);

        if (!sent) {
            return res.status(500).json({ message: 'Failed to send invite email' });
        }

        res.json({ message: 'Invitation sent successfully' });
    } catch (err) {
        console.error('SERVER ERROR IN SENDINVITE:', err);
        next(err);
    }
};

const acceptInvite = async (req, res, next) => {
    try {
        const { token } = req.params;
        const userId = req.user.id;

        const result = await query(
            'SELECT * FROM invitations WHERE token = $1 AND accepted_at IS NULL AND expires_at > NOW()',
            [token]
        );

        const invite = result.rows[0];
        if (!invite) return res.status(400).json({ message: 'Invalid or expired invitation token' });

        // Add user as project member
        await memberModel.add({
            projectId: invite.project_id,
            userId,
            role: invite.role
        });

        // Mark invitation as accepted
        await query(
            'UPDATE invitations SET accepted_at = NOW() WHERE id = $1',
            [invite.id]
        );

        res.json({ message: 'Invitation accepted', projectId: invite.project_id });
    } catch (err) {
        next(err);
    }
};

const getInviteDetails = async (req, res, next) => {
    try {
        const { token } = req.params;
        const result = await query(
            `SELECT i.*, p.title as project_name 
             FROM invitations i 
             JOIN projects p ON i.project_id = p.id 
             WHERE i.token = $1 AND i.accepted_at IS NULL AND i.expires_at > NOW()`,
            [token]
        );

        const invite = result.rows[0];
        if (!invite) return res.status(404).json({ message: 'Invite not found or expired' });

        res.json(invite);
    } catch (err) {
        next(err);
    }
};

module.exports = { sendInvite, acceptInvite, getInviteDetails };
