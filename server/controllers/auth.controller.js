const authService = require('../services/auth.service');

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

module.exports = { register, login, refresh, logout };
