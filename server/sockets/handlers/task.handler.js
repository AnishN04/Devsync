const EVENTS = require('../events');

const taskHandler = (io, socket) => {
    // Join a project room
    socket.on('joinProject', ({ projectId }) => {
        socket.join(EVENTS.PROJECT_ROOM(projectId));
        console.log(`${socket.user.name} joined room: project:${projectId}`);
    });

    // Leave a project room
    socket.on('leaveProject', ({ projectId }) => {
        socket.leave(EVENTS.PROJECT_ROOM(projectId));
        console.log(`${socket.user.name} left room: project:${projectId}`);
    });

    // Broadcast task status change (client-driven, e.g. Kanban drag)
    socket.on(EVENTS.TASK_STATUS_CHANGED, ({ projectId, taskId, status }) => {
        io.to(EVENTS.PROJECT_ROOM(projectId)).emit(EVENTS.TASK_STATUS_CHANGED, {
            taskId,
            status,
            updatedBy: socket.user.name,
            timestamp: new Date().toISOString(),
        });
    });

    // Broadcast new task
    socket.on(EVENTS.TASK_CREATED, ({ projectId, task }) => {
        io.to(EVENTS.PROJECT_ROOM(projectId)).emit(EVENTS.TASK_CREATED, { task });
    });

    // Broadcast task deletion
    socket.on(EVENTS.TASK_DELETED, ({ projectId, taskId }) => {
        io.to(EVENTS.PROJECT_ROOM(projectId)).emit(EVENTS.TASK_DELETED, { taskId });
    });
};

module.exports = taskHandler;
