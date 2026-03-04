const env = require('../config/env');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    console.error(`[${new Date().toISOString()}] ${status} — ${message}`);
    if (err.stack && env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }

    res.status(status).json({
        message,
        ...(env.NODE_ENV !== 'production' && err.stack ? { stack: err.stack } : {}),
    });
};

module.exports = errorHandler;
