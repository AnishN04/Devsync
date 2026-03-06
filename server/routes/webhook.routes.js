const router = require('express').Router();
const verifyWebhook = require('../middleware/verifyWebhook');
const { handleGithubEvent } = require('../controllers/webhook.controller');

// GitHub sends all PR and member events here
router.post('/github', verifyWebhook, handleGithubEvent);

module.exports = router;
