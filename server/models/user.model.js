const { query } = require('../config/db');

const findByEmail = async (email) => {
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
};

const findById = async (id) => {
    const { rows } = await query('SELECT id, name, email, role, created_at, github_username, onboarded, onboarding_type, org_id FROM users WHERE id = $1', [id]);
    return rows[0] || null;
};

const create = async ({ name, email, passwordHash, role, org_id = null }) => {
    const { rows } = await query(
        'INSERT INTO users (name, email, password_hash, role, onboarded, org_id) VALUES ($1, $2, $3, $4, FALSE, $5) RETURNING id, name, email, role, created_at, onboarded, onboarding_type, org_id',
        [name, email, passwordHash, role || 'Developer', org_id]
    );
    return rows[0];
};

module.exports = { findByEmail, findById, create };
