const EVENTS = require('../events');

const projectHandler = (io, socket) => {
    // Join a project room (also used by task handler — harmless if called twice)
    socket.on('joinProject', ({ projectId }) => {
        socket.join(EVENTS.PROJECT_ROOM(projectId));
    });

    // Leave a project room
    socket.on('leaveProject', ({ projectId }) => {
        socket.leave(EVENTS.PROJECT_ROOM(projectId));
    });

    // Broadcast project update (client-driven)
    socket.on(EVENTS.PROJECT_UPDATED, ({ projectId, project }) => {
        io.to(EVENTS.PROJECT_ROOM(projectId)).emit(EVENTS.PROJECT_UPDATED, project);
    });
};

module.exports = projectHandler;
