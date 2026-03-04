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
const errorHandler = require('./middleware/errorHandler');
const initSockets = require('./sockets/index');

const app = express();
const server = http.createServer(app);   // wrap Express in HTTP server
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
    },
});

app.use(cors());
app.use(express.json());

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

// Global error handler (must be last)
app.use(errorHandler);

// WebSocket init
initSockets(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 DevSync server running on port ${PORT}`));
