const { query } = require('./config/db');

async function fixProjects() {
    console.log('🔍 Starting project org_id cleanup...');
    try {
        // Find projects with no org_id specifically for users who HAVE an org_id
        // We match them via their owner_id
        const res = await query(`
            UPDATE projects p
            SET org_id = u.org_id
            FROM users u
            WHERE p.owner_id = u.id
              AND p.org_id IS NULL
              AND u.org_id IS NOT NULL
            RETURNING p.id, p.title, u.org_id
        `);

        if (res.rows.length > 0) {
            console.log(`✅ Fixed ${res.rows.length} projects:`);
            res.rows.forEach(r => console.log(`   - Project [${r.id}] "${r.title}" assigned to Org [${r.org_id}]`));
        } else {
            console.log('✨ No projects needed fixing.');
        }
    } catch (err) {
        console.error('❌ Error fixing projects:', err);
    } finally {
        process.exit();
    }
}

fixProjects();
