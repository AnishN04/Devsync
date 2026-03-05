require('dotenv').config();
const { query } = require('./config/db');

async function seed() {
    try {
        console.log('Clearing database...');
        await query('TRUNCATE TABLE refresh_tokens, tasks, project_members, projects, users RESTART IDENTITY CASCADE;');

        console.log('✅ Database wiped successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error wiping database:', err);
        process.exit(1);
    }
}

seed();
