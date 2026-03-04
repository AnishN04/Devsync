const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const { getMembers, addMember, removeMember } = require('../controllers/member.controller');

// GET /api/members/:projectId — all roles
router.get('/:projectId', verifyToken, getMembers);

// POST /api/members/:projectId — Admin, Manager
router.post('/:projectId', verifyToken, checkRole(['Admin', 'Manager']), addMember);

// DELETE /api/members/:projectId/:userId — Admin, Manager
router.delete('/:projectId/:userId', verifyToken, checkRole(['Admin', 'Manager']), removeMember);

module.exports = router;
