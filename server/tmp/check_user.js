const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/Users/anish/OneDrive/Desktop/Project-1/server/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkUser() {
  try {
    const { rows } = await pool.query("SELECT id, name, email, role, github_id FROM users WHERE email = 'sadmin@gmail.com'");
    console.log('User search result:', JSON.stringify(rows, null, 2));
    if (rows.length === 0) {
      const { rows: allUsers } = await pool.query("SELECT email FROM users LIMIT 10");
      console.log('Recent users sample:', JSON.stringify(allUsers, null, 2));
    }
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await pool.end();
  }
}

checkUser();
