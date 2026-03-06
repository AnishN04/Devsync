const crypto = require('crypto');

const verifyWebhook = (req, res, next) => {
    const signature = req.headers['x-hub-signature-256'];
    const payload = JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');

    if (signature !== digest) {
        return res.status(401).json({ message: 'Invalid webhook signature' });
    }
    next();
};

module.exports = verifyWebhook;
