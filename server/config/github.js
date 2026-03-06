const { Octokit } = require('@octokit/rest');

// Returns an authenticated Octokit instance for a given user token
const getOctokit = (token) => new Octokit({ auth: token });

module.exports = { getOctokit };
