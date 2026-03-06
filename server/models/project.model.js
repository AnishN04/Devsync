const { query } = require('../config/db');

// All projects where user is owner OR a member
const findForUser = async (userId) => {
    const { rows } = await query(
        `SELECT DISTINCT p.*, 
        (SELECT COUNT(*) FROM project_members pm2 WHERE pm2.project_id = p.id) as members,
        (SELECT 
            CASE 
                WHEN COUNT(t.id) = 0 THEN 0 
                ELSE ROUND((COUNT(CASE WHEN t.status = 'Done' THEN 1 END) * 100.0) / COUNT(t.id)) 
            END 
         FROM tasks t WHERE t.project_id = p.id) as progress
     FROM projects p
     JOIN project_members pm ON pm.project_id = p.id
     WHERE pm.user_id = $1
       AND (pm.dashboard_visible IS TRUE OR pm.dashboard_visible IS NULL)
     ORDER BY p.created_at DESC`,
        [userId]
    );
    return rows;
};

const findById = async (id) => {
    const { rows } = await query(
        `SELECT p.*, 
        (SELECT COUNT(*) FROM project_members pm2 WHERE pm2.project_id = p.id) as members,
        (SELECT 
            CASE 
                WHEN COUNT(t.id) = 0 THEN 0 
                ELSE ROUND((COUNT(CASE WHEN t.status = 'Done' THEN 1 END) * 100.0) / COUNT(t.id)) 
            END 
         FROM tasks t WHERE t.project_id = p.id) as progress
     FROM projects p WHERE p.id = $1`,
        [id]
    );
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
