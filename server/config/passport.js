const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const db = require('../config/db');
const authService = require('../services/auth.service');

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // 1. Check if user exists by github_id
            let { rows: users } = await db.query(
                'SELECT * FROM users WHERE github_id = $1', [profile.id]
            );

            let user = users[0];

            if (!user) {
                // 2. Check if user exists by email (if GitHub provides it)
                const email = profile.emails?.[0]?.value || `${profile.username}@github.com`;

                let { rows: emailUsers } = await db.query(
                    'SELECT * FROM users WHERE email = $1', [email]
                );

                if (emailUsers[0]) {
                    // Link existing user to GitHub
                    const updated = await db.query(
                        `UPDATE users SET github_id = $1, github_username = $2, github_token = $3 
             WHERE id = $4 RETURNING *`,
                        [profile.id, profile.username, accessToken, emailUsers[0].id]
                    );
                    user = updated.rows[0];
                } else {
                    // Create new user
                    const newUser = await db.query(
                        `INSERT INTO users (name, email, password_hash, role, github_id, github_username, github_token)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                        [profile.displayName || profile.username, email, 'OAUTH_USER', 'Developer', profile.id, profile.username, accessToken]
                    );
                    user = newUser.rows[0];
                }
            } else {
                // Update token for existing GitHub user
                const updated = await db.query(
                    'UPDATE users SET github_token = $1 WHERE id = $2 RETURNING *',
                    [accessToken, user.id]
                );
                user = updated.rows[0];
            }

            // Generate DevSync tokens
            const devTokens = await authService.generateTokens(user);

            return done(null, {
                ...user,
                accessToken: devTokens.accessToken,
                refreshToken: devTokens.refreshToken
            });
        } catch (err) {
            return done(err, null);
        }
    }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));
