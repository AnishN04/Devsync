module.exports = {
    // Task events
    TASK_CREATED: 'task:created',
    TASK_UPDATED: 'task:updated',
    TASK_DELETED: 'task:deleted',
    TASK_STATUS_CHANGED: 'task:statusChanged',

    // Project events
    PROJECT_UPDATED: 'project:updated',
    MEMBER_ADDED: 'project:memberAdded',
    MEMBER_REMOVED: 'project:memberRemoved',

    // Notification events
    NOTIFICATION_NEW: 'notification:new',

    // Presence events
    USER_ONLINE: 'presence:online',
    USER_OFFLINE: 'presence:offline',
    PRESENCE_LIST: 'presence:list',

    // Room helper
    PROJECT_ROOM: (projectId) => `project:${projectId}`,
};
