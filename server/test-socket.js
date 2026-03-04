/**
 * DevSync — Socket.io integration test
 * Usage: node test-socket.js <accessToken>
 *
 * Tests: connect, joinProject, receive task:created, disconnect
 */
const { io } = require('socket.io-client');

const token = process.argv[2];
const projectId = process.argv[3] || 1;

if (!token) {
    console.error('Usage: node test-socket.js <accessToken> [projectId]');
    process.exit(1);
}

const socket = io('http://localhost:5000', {
    auth: { token },
});

socket.on('connect', () => {
    console.log('✅ Connected to DevSync socket server. Socket ID:', socket.id);

    // Join the project room
    socket.emit('joinProject', { projectId: Number(projectId) });
    console.log(`📡 Emitted joinProject for project ${projectId}`);
});

socket.on('presence:list', (list) => {
    console.log('👥 Online users:', list);
});

socket.on('presence:online', (data) => {
    console.log('🟢 User came online:', data);
});

socket.on('task:created', (data) => {
    console.log('📝 task:created event received:', JSON.stringify(data, null, 2));
});

socket.on('task:statusChanged', (data) => {
    console.log('🔄 task:statusChanged event:', JSON.stringify(data, null, 2));
});

socket.on('task:updated', (data) => {
    console.log('✏️  task:updated event:', JSON.stringify(data, null, 2));
});

socket.on('task:deleted', (data) => {
    console.log('🗑️  task:deleted event:', JSON.stringify(data, null, 2));
});

socket.on('notification:new', (data) => {
    console.log('🔔 notification:new:', JSON.stringify(data, null, 2));
});

socket.on('connect_error', (err) => {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
});

socket.on('disconnect', () => {
    console.log('🔌 Disconnected from server');
});

// Stay connected — press Ctrl+C to stop
console.log('\nListening for events... Press Ctrl+C to exit.\n');
