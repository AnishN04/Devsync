const socketAuth = require('../middleware/socketAuth');
const taskHandler = require('./handlers/task.handler');
const projectHandler = require('./handlers/project.handler');
const notificationHandler = require('./handlers/notification.handler');
const presenceHandler = require('./handlers/presence.handler');

const initSockets = (io) => {
    io.use(socketAuth); // apply JWT auth to ALL socket connections

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.name} [${socket.id}]`);

        // Join personal room for direct notifications
        socket.join(`user:${socket.user.id}`);

        // Register event handlers
        taskHandler(io, socket);
        projectHandler(io, socket);
        notificationHandler(io, socket);
        presenceHandler(io, socket);

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.name}`);
        });
    });
};

module.exports = initSockets;
