const router = require('express').Router();
const { register, login, refresh, logout } = require('../controllers/auth.controller');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', verifyToken, logout);

// New route — returns logged in user from JWT
router.get('/me', verifyToken, (req, res) => {
  res.json(req.user);
});

// Returns all users
router.get('/users', verifyToken, require('../controllers/auth.controller').getAllUsers);

// Search users
router.get('/users/search', verifyToken, require('../controllers/auth.controller').searchUsers);

// Admin only: Delete user
router.delete('/users/:id', verifyToken, checkRole(['Admin']), require('../controllers/auth.controller').deleteUser);

// Admin only: Update user role
router.patch('/users/:id/role', verifyToken, checkRole(['Admin']), require('../controllers/auth.controller').updateUserRole);

module.exports = router;