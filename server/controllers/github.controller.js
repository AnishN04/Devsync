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
    const { repoIds } = req.body; // array of repo id strings the user selected

    if (!github_token) {
        const { rows } = await db.query('SELECT github_token FROM users WHERE id = $1', [ownerId]);
        github_token = rows[0]?.github_token;
    }

    if (!github_token) {
        return res.status(401).json({ message: 'GitHub account not linked or token missing' });
    }

    // Ensure columns exist (idempotent, safe to run each time)
    await db.query(`ALTER TABLE project_members ADD COLUMN IF NOT EXISTS dashboard_visible BOOLEAN DEFAULT TRUE`);
    await db.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT NULL`);

    // Retroactively tag existing commit-sourced Done tasks so they stop showing.
    // Heuristic: status=Done, no PR attached, and description starts with title (commit message pattern).
    await db.query(`
        UPDATE tasks
        SET source = 'github_commit'
        WHERE source IS NULL
          AND status = 'Done'
          AND github_pr_number IS NULL
          AND github_branch IS NULL
          AND description IS NOT NULL
          AND description LIKE title || '%'
    `);

    const allRepos = await githubService.getRepos(github_token, orgName);

    // Determine which repos to actually sync (create/update)
    const selectedRepoIdSet = new Set(
        repoIds && Array.isArray(repoIds) && repoIds.length > 0
            ? repoIds.map(String)
            : allRepos.map(r => String(r.id))
    );

    const selectedRepos = allRepos.filter(r => selectedRepoIdSet.has(String(r.id)));

    // --- Step 1: Hide all existing GitHub-synced projects not in the selection ---
    // Only touch projects that already have a github_repo_id (i.e. came from GitHub sync)
    // Hide ones NOT in the selection for THIS USER ONLY
    const allGithubRepoIds = allRepos.map(r => String(r.id));
    if (allGithubRepoIds.length > 0) {
        const hiddenRepoIds = allGithubRepoIds.filter(id => !selectedRepoIdSet.has(id));
        if (hiddenRepoIds.length > 0) {
            await db.query(
                `UPDATE project_members pm
                 SET dashboard_visible = FALSE
                 FROM projects p
                 WHERE p.id = pm.project_id
                   AND pm.user_id = $1
                   AND p.github_repo_id = ANY($2::text[])`,
                [ownerId, hiddenRepoIds]
            );
        }

        // Make sure selected ones are visible for THIS USER ONLY
        const selectedIdArray = Array.from(selectedRepoIdSet);
        if (selectedIdArray.length > 0) {
            await db.query(
                `UPDATE project_members pm
                 SET dashboard_visible = TRUE
                 FROM projects p
                 WHERE p.id = pm.project_id
                   AND pm.user_id = $1
                   AND p.github_repo_id = ANY($2::text[])`,
                [ownerId, selectedIdArray]
            );
        }
    }

    // --- Step 2: Create/update selected repos as projects ---
    for (const repo of selectedRepos) {
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

        // Ensure syncing user is a member with correct visibility
        await db.query(
            `INSERT INTO project_members (project_id, user_id, role, dashboard_visible)
             VALUES ($1, $2, 'Manager', TRUE)
             ON CONFLICT (project_id, user_id) 
             DO UPDATE SET dashboard_visible = TRUE`,
            [projectId, ownerId]
        );

        // Register webhook
        try {
            await githubService.createRepoWebhook(github_token, repo.owner.login, repo.name, webhookUrl);
        } catch (err) {
            console.log(`Webhook step skipped for ${repo.name}: ${err.message}`);
        }
    }

    res.json({ message: `Synced ${selectedRepos.length} repositories from GitHub` });
};

const searchGitHubUsers = async (req, res) => {
    let { github_token, id } = req.user;
    const { q } = req.query;

    if (!q) return res.status(400).json({ message: 'Query parameter q is required' });

    if (!github_token) {
        const { rows } = await db.query('SELECT github_token FROM users WHERE id = $1', [id]);
        github_token = rows[0]?.github_token;
    }

    if (!github_token) {
        return res.status(401).json({ message: 'GitHub account not linked' });
    }

    try {
        const users = await githubService.searchUsers(github_token, q);
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getOrgRepos, getOrgMembers, syncOrgToDevSync, searchGitHubUsers };
