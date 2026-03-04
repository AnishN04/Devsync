const { query } = require('../config/db');

const findByEmail = async (email) => {
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
};

const findById = async (id) => {
    const { rows } = await query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [id]);
    return rows[0] || null;
};

const create = async ({ name, email, passwordHash, role }) => {
    const { rows } = await query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
        [name, email, passwordHash, role || 'Developer']
    );
    return rows[0];
};

module.exports = { findByEmail, findById, create };
