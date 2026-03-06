const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { sendInvite, acceptInvite, getInviteDetails } = require('../controllers/invitation.controller');

router.post('/send', verifyToken, sendInvite);
router.get('/details/:token', getInviteDetails);
router.post('/accept/:token', verifyToken, acceptInvite);

module.exports = router;
