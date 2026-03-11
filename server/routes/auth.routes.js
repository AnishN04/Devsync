const router = require('express').Router();
const { register, login, refresh, logout, completeOnboarding } = require('../controllers/auth.controller');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', verifyToken, logout);

// New route — returns logged in user from DB
router.get('/me', verifyToken, async (req, res) => {
  try {
    const { findById } = require('../models/user.model');
    const user = await findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Returns all users
router.get('/users', verifyToken, require('../controllers/auth.controller').getAllUsers);

// Search users
router.get('/users/search', verifyToken, require('../controllers/auth.controller').searchUsers);

// Admin only: Delete user
router.delete('/users/:id', verifyToken, checkRole(['Admin', 'sadmin']), require('../controllers/auth.controller').deleteUser);

// Admin only: Update user role
router.patch('/users/:id/role', verifyToken, checkRole(['Admin', 'sadmin']), require('../controllers/auth.controller').updateUserRole);

// Complete onboarding
router.patch('/onboard', verifyToken, completeOnboarding);

// Organization invitations
router.post('/invite', verifyToken, checkRole(['Admin', 'sadmin']), require('../controllers/auth.controller').inviteUser);
router.post('/accept-invite', verifyToken, require('../controllers/auth.controller').acceptInvitation);
router.get('/invite-details/:token', require('../controllers/auth.controller').getInvitationDetails);

module.exports = router;