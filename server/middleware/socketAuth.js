const jwt = require('jsonwebtoken');
const env = require('../config/env');

const socketAuth = (socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
        return next(new Error('Authentication error: no token provided'));
    }

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        socket.user = decoded; // attach user to socket instance
        next();
    } catch (err) {
        return next(new Error('Authentication error: invalid token'));
    }
};

module.exports = socketAuth;
