const { query } = require('./config/db');

async function reset() {
    console.log('🔄 Starting database reset...');
    const tables = [
        'tasks',
        'project_members',
        'projects',
        'refresh_tokens',
        'github_events',
        'invitations',
        'org_invitations',
        'users',
        'organizations'
    ];

    try {
        // Truncate with CASCADE to handle foreign key dependencies
        // and RESTART IDENTITY to reset SERIAL counters
        const truncateQuery = `TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE`;
        await query(truncateQuery);
        console.log('✅ All tables truncated and identities restarted.');
    } catch (err) {
        console.error('❌ Error resetting database:', err.message);
        process.exit(1);
    } finally {
        // Close pool to allow script to exit if needed, though process.exit(0) is used
        process.exit(0);
    }
}

reset();
