const authService = require('../services/auth.service');
const { query } = require('../config/db');
const userModel = require('../models/user.model');

const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'name, email and password are required' });
        }
        const user = await authService.registerUser({ name, email, password, role });
        res.status(201).json({ message: 'User registered successfully', user });
    } catch (err) {
        next(err);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'email and password are required' });
        }
        const result = await authService.loginUser({ email, password });
        res.json(result);
    } catch (err) {
        next(err);
    }
};

const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: 'refreshToken is required' });
        const accessToken = await authService.refreshAccessToken(refreshToken);
        res.json({ accessToken });
    } catch (err) {
        next(err);
    }
};

const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) await authService.logoutUser(refreshToken);
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        next(err);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (Number(id) === req.user.id) {
            return res.status(400).json({ message: 'You cannot delete yourself' });
        }
        await query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        next(err);
    }
};

const updateUserRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!['Admin', 'Manager', 'Developer', 'sadmin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        await query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
        res.json({ message: 'User role updated successfully' });
    } catch (err) {
        next(err);
    }
};

const completeOnboarding = async (req, res, next) => {
    try {
        const { type, role, orgName } = req.body;
        const userId = req.user.id;
        
        if (!type) {
            return res.status(400).json({ message: 'Type is required' });
        }

        let orgId = null;
        if (type === 'organization' && orgName) {
            const { rows } = await query(
                'INSERT INTO organizations (name) VALUES ($1) RETURNING id',
                [orgName]
            );
            orgId = rows[0].id;
        }

        // Validate choice
        const onboardingType = type === 'organization' ? 'Organization' : 'Personal';
        const finalRole = type === 'organization' ? (role || 'Developer') : 'Developer';

        await query(
            'UPDATE users SET onboarded = TRUE, onboarding_type = $1, role = $2, org_id = $3 WHERE id = $4',
            [onboardingType, finalRole, orgId, userId]
        );

        res.json({ message: 'Onboarding completed successfully', onboarded: true });
    } catch (err) {
        next(err);
    }
};

const getAllUsers = async (req, res, next) => {
    try {
        const orgId = req.user.org_id;
        const { rows } = await query(`
            SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.role, 
                u.created_at as joined,
                (SELECT COUNT(*) FROM project_members pm WHERE pm.user_id = u.id) as project_count,
                (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = u.id) as task_count
            FROM users u 
            WHERE u.org_id = $1 OR (u.org_id IS NULL AND u.id = $2)
            ORDER BY u.created_at DESC
        `, [orgId, req.user.id]);
        res.json(rows);
    } catch (err) {
        next(err);
    }
};

const searchUsers = async (req, res, next) => {
    try {
        const { query: searchQuery } = req.query;
        const orgId = req.user.org_id;
        if (!searchQuery) return res.json([]);

        const { rows } = await query(
            `SELECT id, name, email, github_username 
             FROM users 
             WHERE (email ILIKE $1 OR name ILIKE $1 OR github_username ILIKE $1) 
             AND (org_id = $2 OR (org_id IS NULL AND id = $3))
             LIMIT 10`,
            [`%${searchQuery}%`, orgId, req.user.id]
        );
        res.json(rows);
    } catch (err) {
        next(err);
    }
};

const inviteUser = async (req, res, next) => {
    try {
        const { email, role } = req.body;
        const orgId = req.user.org_id;

        if (!email || !role) {
            return res.status(400).json({ message: 'Email and Role are required' });
        }

        const { rows: orgRows } = await query('SELECT name FROM organizations WHERE id = $1', [orgId]);
        const orgName = orgRows[0]?.name || 'DevSync';

        const crypto = require('crypto');
        const token = crypto.randomBytes(20).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await query(
            `INSERT INTO org_invitations (org_id, email, token, role, invited_by, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (org_id, email) DO UPDATE SET token = $3, role = $4, expires_at = $6`,
            [orgId, email, token, role, req.user.id, expiresAt]
        );

        // Send actual email
        const { sendInvitationEmail } = require('../utils/emailService');
        await sendInvitationEmail(email, orgName, role, token);

        res.json({ message: 'Invitation dispatched to the email address', token });
    } catch (err) {
        next(err);
    }
};

const acceptInvitation = async (req, res, next) => {
    try {
        const { token } = req.body;
        const userId = req.user.id;

        const { rows } = await query(
            'SELECT * FROM org_invitations WHERE token = $1 AND expires_at > NOW() AND accepted_at IS NULL',
            [token]
        );

        const invite = rows[0];
        if (!invite) return res.status(400).json({ message: 'Invalid or expired invitation' });

        await query('UPDATE users SET org_id = $1, role = $2, onboarded = TRUE WHERE id = $3', [invite.org_id, invite.role, userId]);
        await query('UPDATE org_invitations SET accepted_at = NOW() WHERE id = $1', [invite.id]);

        // Fetch updated user to generate fresh tokens with new role/org_id
        const user = await userModel.findById(userId);
        const tokens = await authService.generateTokens(user);

        res.json({ 
            message: 'Invitation accepted successfully',
            ...tokens,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        next(err);
    }
};

const getInvitationDetails = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { rows } = await query(
            `SELECT oi.email, oi.role, oi.expires_at, o.name as org_name
             FROM org_invitations oi
             JOIN organizations o ON oi.org_id = o.id
             WHERE oi.token = $1 AND oi.expires_at > NOW() AND oi.accepted_at IS NULL`,
            [token]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Invitation not found or expired' });
        }

        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
};

module.exports = { 
    register, 
    login, 
    refresh, 
    logout, 
    getAllUsers, 
    deleteUser, 
    updateUserRole, 
    searchUsers, 
    completeOnboarding,
    inviteUser,
    acceptInvitation,
    getInvitationDetails
};
