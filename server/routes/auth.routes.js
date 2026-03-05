const router = require('express').Router();
const { register, login, refresh, logout } = require('../controllers/auth.controller');
const verifyToken = require('../middleware/verifyToken');

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

module.exports = router;