const { query } = require('../config/db');

const findByProject = async (projectId) => {
    const { rows } = await query(
        `SELECT pm.*, u.name, u.email, u.role AS global_role
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = $1
     ORDER BY pm.joined_at DESC`,
        [projectId]
    );
    return rows;
};

const findMembership = async (projectId, userId) => {
    const { rows } = await query(
        'SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
    );
    return rows[0] || null;
};

const add = async ({ projectId, userId, role }) => {
    const { rows } = await query(
        `INSERT INTO project_members (project_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3
     RETURNING *`,
        [projectId, userId, role]
    );
    return rows[0];
};

const remove = async ({ projectId, userId }) => {
    const { rows } = await query(
        'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING *',
        [projectId, userId]
    );
    return rows[0] || null;
};

module.exports = { findByProject, findMembership, add, remove };
