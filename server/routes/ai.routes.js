const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const { suggestTasks } = require('../controllers/ai.controller');

// POST /api/ai/suggest — Admin, Manager
router.post('/suggest', verifyToken, checkRole(['Admin', 'Manager']), suggestTasks);

module.exports = router;
