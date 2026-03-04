const { query } = require('../config/db');

const findByProject = async (projectId) => {
    const { rows } = await query(
        'SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC',
        [projectId]
    );
    return rows;
};

const findById = async (id) => {
    const { rows } = await query('SELECT * FROM tasks WHERE id = $1', [id]);
    return rows[0] || null;
};

const create = async ({ projectId, title, description, status, priority, assignedTo, dueDate }) => {
    const { rows } = await query(
        `INSERT INTO tasks (project_id, title, description, status, priority, assigned_to, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
            projectId,
            title,
            description || null,
            status || 'Todo',
            priority || 'Medium',
            assignedTo || null,
            dueDate || null,
        ]
    );
    return rows[0];
};

const update = async (id, { title, description, status, priority, assignedTo, dueDate }) => {
    const { rows } = await query(
        `UPDATE tasks SET
      title       = COALESCE($1, title),
      description = COALESCE($2, description),
      status      = COALESCE($3, status),
      priority    = COALESCE($4, priority),
      assigned_to = COALESCE($5, assigned_to),
      due_date    = COALESCE($6, due_date)
     WHERE id = $7 RETURNING *`,
        [title, description, status, priority, assignedTo, dueDate, id]
    );
    return rows[0] || null;
};

const remove = async (id) => {
    const { rows } = await query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
    return rows[0] || null;
};

module.exports = { findByProject, findById, create, update, remove };
