const EVENTS = require('../events');

const notificationHandler = (io, socket) => {
    // Client can also trigger notifications (e.g. @ mentions)
    socket.on(EVENTS.NOTIFICATION_NEW, ({ toUserId, message, type }) => {
        io.to(`user:${toUserId}`).emit(EVENTS.NOTIFICATION_NEW, {
            message,
            type,       // 'task_assigned' | 'member_added' | 'task_updated'
            timestamp: new Date().toISOString(),
        });
    });
};

// Called from REST controllers to push server-side notifications
const sendNotification = (io, toUserId, payload) => {
    io.to(`user:${toUserId}`).emit(EVENTS.NOTIFICATION_NEW, {
        ...payload,
        timestamp: new Date().toISOString(),
    });
};

module.exports = notificationHandler;
module.exports.sendNotification = sendNotification;
