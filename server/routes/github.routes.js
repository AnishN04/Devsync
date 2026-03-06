const router = require('express').Router();
const passport = require('passport');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const {
    getOrgRepos, getOrgMembers, syncOrgToDevSync
} = require('../controllers/github.controller');

// Redirect to GitHub login
router.get('/auth',
    passport.authenticate('github', {
        scope: ['read:org', 'repo', 'read:user', 'user:email']
    })
);

// GitHub redirects here after login
router.get('/callback',
    passport.authenticate('github', { session: false }),
    (req, res) => {
        const { accessToken, refreshToken } = req.user;
        res.redirect(
            `${process.env.CLIENT_URL}/auth/callback` +
            `?accessToken=${accessToken}&refreshToken=${refreshToken}`
        );
    }
);

router.get('/org/repos', verifyToken, checkRole(['Admin', 'Developer']), getOrgRepos);
router.get('/org/members', verifyToken, checkRole(['Admin', 'Developer']), getOrgMembers);
router.post('/org/sync', verifyToken, checkRole(['Admin', 'Developer']), syncOrgToDevSync);

module.exports = router;
