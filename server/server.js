require('./config/env'); // validate env vars first

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const memberRoutes = require('./routes/member.routes');
const aiRoutes = require('./routes/ai.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const githubRoutes = require('./routes/github.routes');
const webhookRoutes = require('./routes/webhook.routes');
const invitationRoutes = require('./routes/invitation.routes');
const errorHandler = require('./middleware/errorHandler');
const initSockets = require('./sockets/index');
const session = require('express-session');
const passport = require('passport');
require('./config/passport');

// Temporary DB Migration for Onboarding
const { query: dbQuery } = require('./config/db');
(async () => {
    try {
        const hasColumn = await dbQuery(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='onboarded'
        `);

        if (hasColumn.rows.length === 0) {
            await dbQuery(`ALTER TABLE users ADD COLUMN onboarded BOOLEAN DEFAULT FALSE`);
            await dbQuery(`ALTER TABLE users ADD COLUMN onboarding_type VARCHAR(20)`);
            await dbQuery(`UPDATE users SET onboarded = TRUE`);
            console.log('✅ Database onboarding fields added');
        }

        // Add Organizations table
        await dbQuery(`
            CREATE TABLE IF NOT EXISTS organizations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                slug VARCHAR(150) UNIQUE,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Add org_id to users
        await dbQuery(`ALTER TABLE users ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL`);

        // Add org_id to projects
        await dbQuery(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL`);

        // Add org_invitations
        await dbQuery(`
            CREATE TABLE IF NOT EXISTS org_invitations (
                id SERIAL PRIMARY KEY,
                org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
                email VARCHAR(150) NOT NULL,
                token VARCHAR(255) UNIQUE NOT NULL,
                role VARCHAR(20) NOT NULL,
                invited_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT NOW(),
                expires_at TIMESTAMP NOT NULL,
                accepted_at TIMESTAMP,
                UNIQUE(org_id, email)
            )
        `);

        // Ensure any existing users skip onboarding if column exists but values missing
        await dbQuery(`UPDATE users SET onboarded = TRUE WHERE onboarded IS FALSE AND onboarding_type IS NULL`);
    } catch (err) {
        console.error('⚠️ Database migration notice (onboarding):', err.message);
    }
})();

const app = express();
const server = http.createServer(app);   // wrap Express in HTTP server
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
    },
});

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'devsync_secret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Make io accessible inside REST controllers via req.app.get('io')
app.set('io', io);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// REST API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/invitations', invitationRoutes);

// Global error handler (must be last)
app.use(errorHandler);

// WebSocket init
initSockets(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 DevSync server running on port ${PORT}`));
