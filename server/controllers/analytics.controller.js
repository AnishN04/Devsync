const { query } = require('../config/db');

const getAnalytics = async (req, res, next) => {
    try {
        // 1. Task Status Breakdown
        const statusRes = await query(`
            SELECT status as name, COUNT(*) as value
            FROM tasks
            GROUP BY status
        `);
        const statusColors = { 'Todo': '#64748b', 'In Progress': '#6366f1', 'Done': '#10b981' };

        // Initialize with 0s to ensure all statuses show up even if empty
        const statusDataMap = { 'Todo': 0, 'In Progress': 0, 'Done': 0 };
        statusRes.rows.forEach(r => { statusDataMap[r.name] = parseInt(r.value); });

        const statusData = Object.keys(statusDataMap).map(key => ({
            name: key,
            value: statusDataMap[key],
            color: statusColors[key]
        }));

        // 2. Tasks by Priority
        const priorityRes = await query(`
            SELECT priority as name, COUNT(*) as value
            FROM tasks
            GROUP BY priority
        `);
        const priorityColors = { 'Low': '#64748b', 'Medium': '#f59e0b', 'High': '#ef4444' };

        const priorityDataMap = { 'Low': 0, 'Medium': 0, 'High': 0 };
        priorityRes.rows.forEach(r => { priorityDataMap[r.name] = parseInt(r.value); });

        const priorityData = Object.keys(priorityDataMap).map(key => ({
            name: key,
            value: priorityDataMap[key],
            color: priorityColors[key]
        }));

        // 3. Team Productivity (Total assigned tasks per user)
        const teamRes = await query(`
            SELECT u.name, COUNT(t.id) as completed
            FROM users u
            JOIN tasks t ON u.id = t.assigned_to
            GROUP BY u.name
            ORDER BY completed DESC
            LIMIT 5
        `);
        const teamData = teamRes.rows.map(r => ({
            name: r.name.split(' ')[0],
            completed: parseInt(r.completed)
        }));

        // 4. Summary Stats
        const overdueRes = await query(`
            SELECT COUNT(*) FROM tasks WHERE due_date < NOW() AND status != 'Done'
        `);
        const overdueTasks = parseInt(overdueRes.rows[0].count);

        const totalRes = await query(`SELECT COUNT(*) FROM tasks`);
        const doneRes = await query(`SELECT COUNT(*) FROM tasks WHERE status = 'Done'`);
        const totalTasks = parseInt(totalRes.rows[0].count);
        const doneTasks = parseInt(doneRes.rows[0].count);
        const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

        // 5. Sprint Burndown (Placeholder for real historical data)
        const burndownData = [
            { day: 'Start', ideal: totalTasks, actual: totalTasks },
            { day: 'Current', ideal: Math.round(totalTasks * 0.5), actual: totalTasks - doneTasks },
        ];

        // 6. Cumulative Flow (Placeholder for real historical data)
        const cumulativeData = [
            { name: 'Current', Done: doneTasks, 'In Progress': statusDataMap['In Progress'], Todo: statusDataMap['Todo'] },
        ];

        // 7. Radar Chart / Skill Distribution (based on task priority/effort across team)
        const teamEffortRes = await query(`
            SELECT u.name, SUM(CASE WHEN t.priority = 'High' THEN 3 WHEN t.priority = 'Medium' THEN 2 ELSE 1 END) as effort
            FROM users u
            JOIN tasks t ON u.id = t.assigned_to
            GROUP BY u.name
            LIMIT 6
        `);
        const radarData = teamEffortRes.rows.map(r => ({
            subject: r.name.split(' ')[0],
            A: parseInt(r.effort),
            fullMark: 15
        }));

        res.json({
            statusData,
            priorityData,
            teamData,
            overdueTasks,
            completionRate,
            totalTasks,
            taskHistoryData: cumulativeData, // Use cumulative for history
            burndownData,
            radarData
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { getAnalytics };
