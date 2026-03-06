const githubService = require('../services/github.service');
const db = require('../config/db');

const getOrgRepos = async (req, res) => {
    let { github_token, id } = req.user;
    if (!github_token) {
        const { rows } = await db.query('SELECT github_token FROM users WHERE id = $1', [id]);
        github_token = rows[0]?.github_token;
    }
    const repos = await githubService.getRepos(
        github_token, process.env.GITHUB_ORG_NAME
    );
    res.json(repos);
};

const getOrgMembers = async (req, res) => {
    let { github_token, id } = req.user;
    if (!github_token) {
        const { rows } = await db.query('SELECT github_token FROM users WHERE id = $1', [id]);
        github_token = rows[0]?.github_token;
    }
    const members = await githubService.getOrgMembers(
        github_token, process.env.GITHUB_ORG_NAME
    );
    res.json(members);
};

const syncOrgToDevSync = async (req, res) => {
    let { github_token, id: ownerId } = req.user;
    const orgName = process.env.GITHUB_ORG_NAME;
    const webhookUrl = `${process.env.BACKEND_URL}/api/webhooks/github`;

    if (!github_token) {
        const { rows } = await db.query('SELECT github_token FROM users WHERE id = $1', [ownerId]);
        github_token = rows[0]?.github_token;
    }

    if (!github_token) {
        return res.status(401).json({ message: 'GitHub account not linked or token missing' });
    }

    const repos = await githubService.getRepos(github_token, orgName);

    for (const repo of repos) {
        // 1. Create/Find project
        let projectId;
        const existingProject = await db.query(
            'SELECT id FROM projects WHERE github_repo_id = $1', [String(repo.id)]
        );

        if (!existingProject.rows.length) {
            const newProj = await db.query(
                `INSERT INTO projects
                 (title, description, owner_id, github_repo_id,
                  github_repo_name, github_org_name, github_repo_url,
                  tracking_branch, deployment_branch)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, 'dev', 'main') RETURNING id`,
                [repo.name, repo.description || '', ownerId,
                String(repo.id), repo.name, repo.owner.login, repo.html_url]
            );
            projectId = newProj.rows[0].id;
        } else {
            projectId = existingProject.rows[0].id;
        }

        // 1.5. Ensure the syncing user is a member of the project
        await db.query(
            `INSERT INTO project_members (project_id, user_id, role)
             VALUES ($1, $2, 'Manager')
             ON CONFLICT (project_id, user_id) DO NOTHING`,
            [projectId, ownerId]
        );

        // 2. Register webhook
        try {
            await githubService.createRepoWebhook(github_token, repo.owner.login, repo.name, webhookUrl);
        } catch (err) {
            console.log(`Webhook step skipped for ${repo.name}: ${err.message}`);
        }

        // 3. Deep Sync: Pull recent commits into 'Done' section
        try {
            const commits = await githubService.getRecentCommits(github_token, repo.owner.login, repo.name);
            for (const commit of commits) {
                // Skip if task already exists (using commit SHA as a pseudo-identifier or just check title)
                const taskTitle = commit.commit.message.split('\n')[0];
                const existingTask = await db.query(
                    'SELECT id FROM tasks WHERE project_id = $1 AND title = $2',
                    [projectId, taskTitle]
                );

                if (!existingTask.rows.length) {
                    await db.query(
                        `INSERT INTO tasks (project_id, title, description, status, priority, assigned_to)
                         VALUES ($1, $2, $3, 'Done', 'Medium', $4)`,
                        [projectId, taskTitle, commit.commit.message, ownerId]
                    );
                }
            }
        } catch (err) {
            console.error(`Failed to sync commits for ${repo.name}:`, err.message);
        }
    }

    res.json({ message: `Synced ${repos.length} repositories from GitHub` });
};

module.exports = { getOrgRepos, getOrgMembers, syncOrgToDevSync };
