const { query } = require('../config/db');

// All projects where user is owner OR a member
const findForUser = async (userId) => {
    const { rows } = await query(
        `SELECT DISTINCT p.* FROM projects p
     LEFT JOIN project_members pm ON pm.project_id = p.id
     WHERE p.owner_id = $1 OR pm.user_id = $1
     ORDER BY p.created_at DESC`,
        [userId]
    );
    return rows;
};

const findById = async (id) => {
    const { rows } = await query('SELECT * FROM projects WHERE id = $1', [id]);
    return rows[0] || null;
};

const create = async ({ title, description, ownerId }) => {
    const { rows } = await query(
        'INSERT INTO projects (title, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
        [title, description || null, ownerId]
    );
    return rows[0];
};

const update = async (id, { title, description }) => {
    const { rows } = await query(
        'UPDATE projects SET title = COALESCE($1, title), description = COALESCE($2, description) WHERE id = $3 RETURNING *',
        [title, description, id]
    );
    return rows[0] || null;
};

const remove = async (id) => {
    const { rows } = await query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);
    return rows[0] || null;
};

module.exports = { findForUser, findById, create, update, remove };
