const { query } = require('../config/db');

// All projects where user is owner OR a member
const findForUser = async (userId, orgId) => {
    const { rows } = await query(
        `WITH PriorityTasks AS (
            SELECT id, title, priority, project_id,
                   ROW_NUMBER() OVER (
                       PARTITION BY project_id 
                       ORDER BY 
                           CASE priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 ELSE 4 END, 
                           created_at DESC
                   ) as rnk
            FROM tasks
            WHERE status = 'Todo' 
              AND (source IS NULL OR source != 'github_commit')
        )
        SELECT p.*, 
        (SELECT COUNT(*) FROM project_members pm2 WHERE pm2.project_id = p.id) as members,
        (SELECT 
            CASE 
                WHEN COUNT(CASE WHEN t.status IN ('In Progress', 'Done') THEN 1 END) = 0 THEN 0 
                ELSE ROUND((COUNT(CASE WHEN t.status = 'Done' THEN 1 END) * 100.0) / COUNT(CASE WHEN t.status IN ('In Progress', 'Done') THEN 1 END)) 
            END 
         FROM tasks t 
         WHERE t.project_id = p.id 
           AND (t.source IS NULL OR t.source != 'github_commit')) as progress,
        pt.tasks as priority_tasks
     FROM projects p
     JOIN project_members pm ON pm.project_id = p.id
     LEFT JOIN (
        SELECT project_id, json_agg(json_build_object('id', id, 'title', title, 'priority', priority)) as tasks
        FROM PriorityTasks
        WHERE rnk <= 3
        GROUP BY project_id
     ) pt ON pt.project_id = p.id
     WHERE pm.user_id = $1
       AND (p.org_id = $2 OR (p.org_id IS NULL AND $2 IS NULL))
       AND (pm.dashboard_visible IS TRUE OR pm.dashboard_visible IS NULL)
     ORDER BY p.created_at DESC`,
        [userId, orgId]
    );
    return rows;
};

const findById = async (id, orgId) => {
    const { rows } = await query(
        `WITH PriorityTasks AS (
            SELECT id, title, priority, project_id,
                   ROW_NUMBER() OVER (
                       PARTITION BY project_id 
                       ORDER BY 
                           CASE priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 ELSE 4 END, 
                           created_at DESC
                   ) as rnk
            FROM tasks
            WHERE status = 'Todo' 
              AND project_id = $1
              AND (source IS NULL OR source != 'github_commit')
        )
        SELECT p.*, 
        (SELECT COUNT(*) FROM project_members pm2 WHERE pm2.project_id = p.id) as members,
        (SELECT 
            CASE 
                WHEN COUNT(CASE WHEN t.status IN ('In Progress', 'Done') THEN 1 END) = 0 THEN 0 
                ELSE ROUND((COUNT(CASE WHEN t.status = 'Done' THEN 1 END) * 100.0) / COUNT(CASE WHEN t.status IN ('In Progress', 'Done') THEN 1 END)) 
            END 
         FROM tasks t 
         WHERE t.project_id = p.id
           AND (t.source IS NULL OR t.source != 'github_commit')) as progress,
        pt.tasks as priority_tasks
     FROM projects p 
     LEFT JOIN (
        SELECT project_id, json_agg(json_build_object('id', id, 'title', title, 'priority', priority)) as tasks
        FROM PriorityTasks
        WHERE rnk <= 3
        GROUP BY project_id
     ) pt ON pt.project_id = p.id
     WHERE p.id = $1 AND (p.org_id = $2 OR (p.org_id IS NULL AND $2 IS NULL))`,
        [id, orgId]
    );
    return rows[0] || null;
};

const create = async ({ title, description, ownerId, orgId }) => {
    const { rows } = await query(
        'INSERT INTO projects (title, description, owner_id, org_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [title, description || null, ownerId, orgId]
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
