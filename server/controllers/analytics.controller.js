const { query } = require('../config/db');

const getAnalytics = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const isSadmin = req.user.role === 'sadmin';

        let validTaskCondition;
        let queryParams = [userId];

        if (isSadmin) {
            validTaskCondition = `WHERE (t.source IS NULL OR t.source != 'github_commit')`;
            queryParams = [];
        } else {
            validTaskCondition = `
                JOIN project_members pm ON pm.project_id = t.project_id
                WHERE pm.user_id = $1
                  AND (pm.dashboard_visible IS TRUE OR pm.dashboard_visible IS NULL)
                  AND (t.source IS NULL OR t.source != 'github_commit')
            `;
        }

        // 1. Task Status Breakdown
        const statusRes = await query(`
            SELECT t.status as name, COUNT(t.id) as value
            FROM tasks t
            ${validTaskCondition}
            GROUP BY t.status
        `, queryParams);
        const statusColors = { 'Todo': '#64748b', 'In Progress': '#6366f1', 'Done': '#10b981' };

        const statusDataMap = { 'Todo': 0, 'In Progress': 0, 'Done': 0 };
        statusRes.rows.forEach(r => { statusDataMap[r.name] = parseInt(r.value); });

        const statusData = Object.keys(statusDataMap).map(key => ({
            name: key,
            value: statusDataMap[key],
            color: statusColors[key]
        }));

        // 2. Tasks by Priority
        const priorityRes = await query(`
            SELECT t.priority as name, COUNT(t.id) as value
            FROM tasks t
            ${validTaskCondition}
            GROUP BY t.priority
        `, queryParams);
        const priorityColors = { 'Low': '#64748b', 'Medium': '#f59e0b', 'High': '#ef4444' };

        const priorityDataMap = { 'Low': 0, 'Medium': 0, 'High': 0 };
        priorityRes.rows.forEach(r => { priorityDataMap[r.name] = parseInt(r.value); });

        const priorityData = Object.keys(priorityDataMap).map(key => ({
            name: key,
            value: priorityDataMap[key],
            color: priorityColors[key]
        }));

        // 3. Team Productivity / User Distribution
        let teamData;
        if (isSadmin) {
            // For sadmin: "How many users are there and assigned task"
            // We use the same teamData format but with all users
            const teamRes = await query(`
                SELECT u.name, COUNT(t.id) as task_count
                FROM users u
                LEFT JOIN tasks t ON u.id = t.assigned_to
                GROUP BY u.id, u.name
                ORDER BY task_count DESC
                LIMIT 10
            `);
            teamData = teamRes.rows.map(r => ({
                name: r.name.split(' ')[0],
                completed: parseInt(r.task_count) || 0
            }));
        } else {
            const teamRes = await query(`
                SELECT u.name, COUNT(t.id) as completed
                FROM users u
                JOIN tasks t ON u.id = t.assigned_to
                ${validTaskCondition.replace('WHERE', 'AND')}
                GROUP BY u.name
                ORDER BY completed DESC
                LIMIT 5
            `, [userId]);
            teamData = teamRes.rows.map(r => ({
                name: r.name.split(' ')[0],
                completed: parseInt(r.completed)
            }));
        }

        // 4. Summary Stats
        const overdueRes = await query(`
            SELECT COUNT(t.id) FROM tasks t
            ${validTaskCondition} AND t.due_date < NOW() AND t.status != 'Done'
        `, queryParams);
        const overdueTasks = parseInt(overdueRes.rows[0].count);

        const totalRes = await query(`SELECT COUNT(t.id) FROM tasks t ${validTaskCondition}`, queryParams);
        const doneRes = await query(`SELECT COUNT(t.id) FROM tasks t ${validTaskCondition} AND t.status = 'Done'`, queryParams);
        const totalTasks = parseInt(totalRes.rows[0].count);
        const doneTasks = parseInt(doneRes.rows[0].count);
        const totalTasksInScope = parseInt(statusDataMap['In Progress'] || 0) + parseInt(statusDataMap['Done'] || 0);
        const completionRate = totalTasksInScope > 0 ? Math.round((doneTasks / totalTasksInScope) * 100) : 0;

        // 5. Sprint Burndown (Placeholder)
        const burndownData = [
            { day: 'Start', ideal: totalTasks, actual: totalTasks },
            { day: 'Current', ideal: Math.round(totalTasks * 0.5), actual: totalTasks - doneTasks },
        ];

        // 6. Cumulative Flow (Placeholder)
        const cumulativeData = [
            { name: 'Current', Done: doneTasks, 'In Progress': statusDataMap['In Progress'], Todo: statusDataMap['Todo'] },
        ];

        // 7. Radar Chart / Project Distribution
        let radarData;
        if (isSadmin) {
            // For sadmin: "Which project there are doing"
            // Showing projects by task density
            const projectEffortRes = await query(`
                SELECT p.title, COUNT(t.id) as task_count
                FROM projects p
                LEFT JOIN tasks t ON p.id = t.project_id
                GROUP BY p.id, p.title
                ORDER BY task_count DESC
                LIMIT 6
            `);
            radarData = projectEffortRes.rows.map(r => ({
                subject: r.title.length > 10 ? r.title.substring(0, 10) + '..' : r.title,
                A: parseInt(r.task_count) || 0,
                fullMark: 20
            }));
        } else {
            const teamEffortRes = await query(`
                SELECT u.name, SUM(CASE WHEN t.priority = 'High' THEN 3 WHEN t.priority = 'Medium' THEN 2 ELSE 1 END) as effort
                FROM users u
                JOIN tasks t ON u.id = t.assigned_to
                ${validTaskCondition.replace('WHERE', 'AND')}
                GROUP BY u.name
                LIMIT 6
            `, [userId]);
            radarData = teamEffortRes.rows.map(r => ({
                subject: r.name.split(' ')[0],
                A: parseInt(r.effort),
                fullMark: 15
            }));
        }

        // 8. Overview Stats
        let summary;
        if (isSadmin) {
            const usersCountRes = await query('SELECT COUNT(*) FROM users');
            const projectsCountRes = await query('SELECT COUNT(*) FROM projects');
            summary = {
                totalProjects: parseInt(projectsCountRes.rows[0].count),
                totalTasks: totalTasks,
                completedTasks: doneTasks,
                activeMembers: parseInt(usersCountRes.rows[0].count)
            };
        } else {
            const projectsRes = await query(`
                SELECT COUNT(p.id) FROM projects p
                JOIN project_members pm ON pm.project_id = p.id
                WHERE pm.user_id = $1
                  AND (pm.dashboard_visible IS TRUE OR pm.dashboard_visible IS NULL)
            `, queryParams);

            const teamMembersRes = await query(`
                SELECT COUNT(DISTINCT pm2.user_id) 
                FROM project_members pm1
                JOIN project_members pm2 ON pm1.project_id = pm2.project_id
                WHERE pm1.user_id = $1
                  AND (pm1.dashboard_visible IS TRUE OR pm1.dashboard_visible IS NULL)
            `, queryParams);

            summary = {
                totalProjects: parseInt(projectsRes.rows[0].count),
                totalTasks: totalTasks,
                completedTasks: doneTasks,
                activeMembers: parseInt(teamMembersRes.rows[0].count) || 1
            };
        }

        res.json({
            statusData,
            priorityData,
            teamData,
            overdueTasks,
            completionRate,
            totalTasks,
            taskHistoryData: cumulativeData,
            burndownData,
            radarData,
            summary,
            isSadmin
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { getAnalytics };
