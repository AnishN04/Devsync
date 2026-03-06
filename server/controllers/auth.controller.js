const authService = require('../services/auth.service');
const { query } = require('../config/db');

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
        if (!['Admin', 'Manager', 'Developer', 'Viewer'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        await query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
        res.json({ message: 'User role updated successfully' });
    } catch (err) {
        next(err);
    }
};

const getAllUsers = async (req, res, next) => {
    try {
        const { rows } = await query('SELECT id, name, email, role, created_at as joined FROM users ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        next(err);
    }
};

const searchUsers = async (req, res, next) => {
    try {
        const { query: searchQuery } = req.query;
        if (!searchQuery) return res.json([]);
        
        const { rows } = await query(
            `SELECT id, name, email, github_username 
             FROM users 
             WHERE (email ILIKE $1 OR name ILIKE $1 OR github_username ILIKE $1) 
             LIMIT 10`,
            [`%${searchQuery}%`]
        );
        res.json(rows);
    } catch (err) {
        next(err);
    }
};

module.exports = { register, login, refresh, logout, getAllUsers, deleteUser, updateUserRole, searchUsers };
