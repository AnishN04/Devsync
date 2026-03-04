const EVENTS = require('../events');
const onlineUsers = new Map(); // userId → { name, socketId }

const presenceHandler = (io, socket) => {
    socket.on('joinProject', ({ projectId }) => {
        onlineUsers.set(socket.user.id, {
            name: socket.user.name,
            socketId: socket.id,
        });

        // Tell others this user is online
        socket.to(EVENTS.PROJECT_ROOM(projectId)).emit(EVENTS.USER_ONLINE, {
            userId: socket.user.id,
            name: socket.user.name,
        });

        // Send current online list to the joining user
        socket.emit(EVENTS.PRESENCE_LIST, Array.from(onlineUsers.entries()));
    });

    socket.on('disconnect', () => {
        onlineUsers.delete(socket.user.id);
        io.emit(EVENTS.USER_OFFLINE, { userId: socket.user.id });
    });
};

module.exports = presenceHandler;
