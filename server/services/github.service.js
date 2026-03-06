const { getOctokit } = require('../config/github');

const getRepos = async (githubToken, orgName) => {
    const octokit = getOctokit(githubToken);

    // If orgName is provided, try listing org repos
    if (orgName && orgName !== 'DevSync-Org') {
        try {
            const { data } = await octokit.repos.listForOrg({
                org: orgName, type: 'all', per_page: 100
            });
            return data;
        } catch (err) {
            if (err.status !== 404) throw err;
            // If 404, fall through to list for user
        }
    }

    // Fallback: list for the authenticated user
    const { data } = await octokit.repos.listForAuthenticatedUser({
        visibility: 'all', per_page: 100, affiliation: 'owner,collaborator,organization_member'
    });
    return data;
};

const getOrgMembers = async (githubToken, orgName) => {
    const octokit = getOctokit(githubToken);
    const { data } = await octokit.orgs.listMembers({
        org: orgName, per_page: 100
    });
    return data;
};

const getRepoContributors = async (githubToken, owner, repoName) => {
    const octokit = getOctokit(githubToken);
    const { data } = await octokit.repos.listContributors({
        owner, repo: repoName, per_page: 100
    });
    return data;
};

const createRepoWebhook = async (githubToken, owner, repoName, webhookUrl) => {
    const octokit = getOctokit(githubToken);
    await octokit.repos.createWebhook({
        owner,
        repo: repoName,
        config: {
            url: webhookUrl,
            content_type: 'json',
            secret: process.env.GITHUB_WEBHOOK_SECRET
        },
        events: ['pull_request', 'member'],
        active: true
    });
};

const getRecentCommits = async (githubToken, owner, repoName) => {
    const octokit = getOctokit(githubToken);
    const { data } = await octokit.repos.listCommits({
        owner, repo: repoName, per_page: 30
    });
    return data;
};

const searchUsers = async (githubToken, query) => {
    const octokit = getOctokit(githubToken);
    const { data } = await octokit.search.users({
        q: query, per_page: 5
    });
    return data.items;
};

module.exports = {
    getRepos,
    getOrgMembers,
    getRepoContributors,
    getRecentCommits,
    createRepoWebhook,
    searchUsers
};
