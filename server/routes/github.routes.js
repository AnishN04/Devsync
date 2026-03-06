const router = require('express').Router();
const passport = require('passport');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const {
    getOrgRepos, getOrgMembers, syncOrgToDevSync, searchGitHubUsers
} = require('../controllers/github.controller');

// Redirect to GitHub login
router.get('/auth', (req, res, next) => {
    const { redirect } = req.query;
    passport.authenticate('github', {
        scope: ['read:org', 'repo', 'read:user', 'user:email'],
        state: redirect || '/' // Pass redirect to GitHub state
    })(req, res, next);
});

// GitHub redirects here after login
router.get('/callback',
    passport.authenticate('github', { session: false }),
    (req, res) => {
        const { accessToken, refreshToken } = req.user;
        const redirectPath = req.query.state || '/';
        res.redirect(
            `${process.env.CLIENT_URL}/auth/callback` +
            `?accessToken=${accessToken}&refreshToken=${refreshToken}` +
            `&redirect=${encodeURIComponent(redirectPath)}`
        );
    }
);

router.get('/org/repos', verifyToken, getOrgRepos);
router.get('/org/members', verifyToken, getOrgMembers);
router.post('/org/sync', verifyToken, syncOrgToDevSync);
router.get('/search-users', verifyToken, searchGitHubUsers);

module.exports = router;
