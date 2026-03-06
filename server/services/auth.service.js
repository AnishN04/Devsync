const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const userModel = require('../models/user.model');
const env = require('../config/env');

const hashPassword = async (plain) => bcrypt.hash(plain, 10);

const comparePassword = async (plain, hash) => bcrypt.compare(plain, hash);

const generateAccessToken = (user) =>
    jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role, github_username: user.github_username },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
    );

const generateRefreshToken = (user) =>
    jwt.sign(
        { id: user.id },
        env.JWT_REFRESH_SECRET,
        { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
    );

const storeRefreshToken = async (userId, token) => {
    // Refresh tokens expire in 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [userId, token, expiresAt]
    );
};

const findRefreshToken = async (token) => {
    const { rows } = await query(
        'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
        [token]
    );
    return rows[0] || null;
};

const deleteRefreshToken = async (token) => {
    await query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
};

const registerUser = async ({ name, email, password, role }) => {
    const existing = await userModel.findByEmail(email);
    if (existing) throw Object.assign(new Error('Email already registered'), { status: 409 });

    const passwordHash = await hashPassword(password);
    return userModel.create({ name, email, passwordHash, role });
};

const loginUser = async ({ email, password }) => {
    const user = await userModel.findByEmail(email);
    if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await storeRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

const generateTokens = async (user) => {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await storeRefreshToken(user.id, refreshToken);
    return { accessToken, refreshToken };
};

const refreshAccessToken = async (token) => {
    const stored = await findRefreshToken(token);
    if (!stored) throw Object.assign(new Error('Invalid or expired refresh token'), { status: 403 });

    let payload;
    try {
        payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
    } catch {
        throw Object.assign(new Error('Invalid refresh token'), { status: 403 });
    }

    const user = await userModel.findById(payload.id);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

    return generateAccessToken(user);
};

const logoutUser = async (token) => {
    await deleteRefreshToken(token);
};

module.exports = {
    registerUser,
    loginUser,
    generateTokens,
    refreshAccessToken,
    logoutUser,
};
