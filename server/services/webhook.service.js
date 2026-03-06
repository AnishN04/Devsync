const db = require('../config/db');
const EVENTS = require('../sockets/events');

// ── Extract task ID from branch name ──────────────────
// Handles: task-42, feature/task-42, 42-fix-login,
//          bugfix/task-42, feature/42
const extractTaskId = (branchName) => {
    const match = branchName.match(/(?:task-?)?(\d+)/i);
    return match ? parseInt(match[1]) : null;
};

// ── PULL REQUEST EVENT ────────────────────────────────
const handlePullRequestEvent = async (payload, io) => {
    const action = payload.action;
    const pr = payload.pull_request;
    const repoName = payload.repository.name;
    const targetBranch = pr.base.ref;     // branch PR merges INTO
    const sourceBranch = pr.head.ref;     // branch PR comes FROM
    const prNumber = pr.number;
    const prUrl = pr.html_url;
    const prAuthor = pr.user.login;
    const isMerged = pr.merged;

    // Find DevSync project linked to this repo
    const { rows: projects } = await db.query(
        'SELECT * FROM projects WHERE github_repo_name = $1', [repoName]
    );
    if (!projects.length) return;
    const project = projects[0];

    const trackingBranch = project.tracking_branch || 'dev';
    const deploymentBranch = project.deployment_branch || 'main';

    // CASE 1: PR opened → dev = task moves to In Progress
    if (action === 'opened' && targetBranch === trackingBranch) {
        const taskId = extractTaskId(sourceBranch);
        if (!taskId) return;

        await db.query(
            `UPDATE tasks SET status = 'In Progress',
       github_pr_number = $1, github_branch = $2, github_pr_url = $3
       WHERE id = $4 AND project_id = $5`,
            [prNumber, sourceBranch, prUrl, taskId, project.id]
        );

        io.to(EVENTS.PROJECT_ROOM(project.id)).emit(EVENTS.TASK_STATUS_CHANGED, {
            taskId,
            status: 'In Progress',
            updatedBy: `GitHub PR #${prNumber} by ${prAuthor}`,
            prUrl,
            timestamp: new Date().toISOString()
        });

        // Notify task assignee
        const { rows: tasks } = await db.query(
            'SELECT assigned_to FROM tasks WHERE id = $1', [taskId]
        );
        if (tasks[0]?.assigned_to) {
            io.to(`user:${tasks[0].assigned_to}`).emit(EVENTS.NOTIFICATION_NEW, {
                message: `PR #${prNumber} opened for your task`,
                type: 'pr_opened',
                timestamp: new Date().toISOString()
            });
        }
    }

    // CASE 2: PR merged → dev = task moves to Done
    if (action === 'closed' && isMerged && targetBranch === trackingBranch) {
        const taskId = extractTaskId(sourceBranch);
        if (!taskId) return;

        await db.query(
            `UPDATE tasks SET status = 'Done',
       github_pr_number = $1, github_branch = $2, github_pr_url = $3
       WHERE id = $4 AND project_id = $5`,
            [prNumber, sourceBranch, prUrl, taskId, project.id]
        );

        io.to(EVENTS.PROJECT_ROOM(project.id)).emit(EVENTS.TASK_STATUS_CHANGED, {
            taskId,
            status: 'Done',
            updatedBy: `GitHub PR #${prNumber} merged by ${prAuthor}`,
            prUrl,
            timestamp: new Date().toISOString()
        });

        io.to(EVENTS.PROJECT_ROOM(project.id)).emit(EVENTS.NOTIFICATION_NEW, {
            message: `Task #${taskId} completed — PR #${prNumber} merged by ${prAuthor}`,
            type: 'task_done',
            timestamp: new Date().toISOString()
        });
    }

    // CASE 3: dev merged → main = project deployed
    if (
        action === 'closed' && isMerged &&
        sourceBranch === trackingBranch &&
        targetBranch === deploymentBranch
    ) {
        await db.query(
            `UPDATE projects SET is_released = TRUE, released_at = NOW()
       WHERE id = $1`,
            [project.id]
        );

        io.to(EVENTS.PROJECT_ROOM(project.id)).emit('project:released', {
            projectId: project.id,
            projectName: project.title,
            mergedBy: prAuthor,
            timestamp: new Date().toISOString()
        });

        io.to(EVENTS.PROJECT_ROOM(project.id)).emit(EVENTS.NOTIFICATION_NEW, {
            message: `🚀 ${project.title} deployed to production by ${prAuthor}`,
            type: 'project_released',
            timestamp: new Date().toISOString()
        });
    }
};

// ── MEMBER EVENT ──────────────────────────────────────
const handleMemberEvent = async (payload, io) => {
    const action = payload.action;
    const githubUser = payload.member;
    const repoName = payload.repository.name;

    if (action !== 'added') return;

    const { rows: projects } = await db.query(
        'SELECT * FROM projects WHERE github_repo_name = $1', [repoName]
    );
    if (!projects.length) return;
    const project = projects[0];

    const { rows: users } = await db.query(
        'SELECT * FROM users WHERE github_username = $1', [githubUser.login]
    );
    if (!users.length) return;
    const user = users[0];

    await db.query(
        `INSERT INTO project_members (project_id, user_id, role)
     VALUES ($1, $2, 'Developer')
     ON CONFLICT (project_id, user_id) DO NOTHING`,
        [project.id, user.id]
    );

    io.to(EVENTS.PROJECT_ROOM(project.id)).emit(EVENTS.MEMBER_ADDED, {
        userId: user.id,
        name: user.name,
        role: 'Developer',
        addedBy: 'GitHub',
        timestamp: new Date().toISOString()
    });

    io.to(`user:${user.id}`).emit(EVENTS.NOTIFICATION_NEW, {
        message: `You were added to "${project.title}" via GitHub`,
        type: 'member_added',
        timestamp: new Date().toISOString()
    });
};

module.exports = { handlePullRequestEvent, handleMemberEvent };
