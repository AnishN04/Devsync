const db = require('../config/db');
const { handlePullRequestEvent, handleMemberEvent } = require('../services/webhook.service');

const handleGithubEvent = async (req, res) => {
    const eventType = req.headers['x-github-event'];
    const payload = req.body;
    const io = req.app.get('io');  // same io instance from server.js

    // Log to audit table
    await db.query(
        `INSERT INTO github_events (event_type, repo_name, payload)
     VALUES ($1, $2, $3)`,
        [eventType, payload?.repository?.name, payload]
    );

    try {
        switch (eventType) {
            case 'pull_request':
                await handlePullRequestEvent(payload, io);
                break;
            case 'member':
                await handleMemberEvent(payload, io);
                break;
            default:
                break;
        }
        res.status(200).json({ received: true });
    } catch (err) {
        console.error('Webhook error:', err);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

module.exports = { handleGithubEvent };
