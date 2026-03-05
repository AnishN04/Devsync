const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const { getAnalytics } = require('../controllers/analytics.controller');

router.get('/', verifyToken, getAnalytics);

module.exports = router;
