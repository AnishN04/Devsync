# 🔗 DevSync — GitHub Organization Integration

> Connects DevSync to a real GitHub Organization.
> Branch strategy: all development on `dev`, deployment to `main`.
> Based on the current DevSync backend structure (backend.md).

---

## 🎯 What This Integration Does

| GitHub Action | DevSync Reaction |
|---|---|
| Admin logs in with GitHub OAuth | Sees all org repos as projects on Dashboard |
| Admin clicks "Sync GitHub Repos" | All org repos created as DevSync projects |
| Admin adds contributor to private repo | User auto-added to that project in DevSync |
| Developer opens PR → `dev` | Task moves to In Progress on Kanban |
| PR merged into `dev` | Task moves to Done, progress bar increases |
| `dev` merged into `main` | Project card shows 🚀 Released badge, team notified |
| Analytics page | Charts update from real PR and task data |

---

## 🌿 Branch Strategy — One Repo = One Project

```
GitHub Repo: project-1
  ├── main          ← production / deployment only
  └── dev           ← all development happens here
        ├── feature/task-42
        ├── feature/task-15
        └── bugfix/task-7
```

```
DevSync Project: project-1
  ├── Todo          ← task not started
  ├── In Progress   ← PR opened targeting dev
  └── Done          ← PR merged into dev
```

### The Two Rules

```
feature/* → dev    = work DONE      → task moves to Done
dev       → main   = DEPLOYED       → project gets 🚀 Released badge
```

### Branch Naming for Developers

Developers simply include the task ID anywhere in the branch name:

```bash
git checkout -b task-42
git checkout -b task-42-fix-login
git checkout -b feature/task-42
git checkout -b feature/42-dashboard-bug
git checkout -b bugfix/task-42
```

DevSync extracts the number automatically. No other convention needed.

---

## 🏗️ Architecture Overview

```
GitHub Organization
      ↓  OAuth login            ↓ Webhooks (PR events, member events)
      ↓                         ↓
DevSync Backend (server/) ←─── receives GitHub events
      ↓                         ↓
PostgreSQL DB ←──────────────── stores synced data
      ↓
Socket.io ←──────────────────── broadcasts changes in real time
      ↓
React Frontend (client/) ←────── Kanban + Dashboard update live
```

---

## 📦 New Dependencies to Install

```bash
cd server
npm install @octokit/rest passport passport-github2 express-session
```

For local webhook testing:
```bash
npm install -g ngrok
```

---

## 🗃️ Database — New Columns & Table

Add these to `server/db/schema.sql` and run them on your PostgreSQL DB:

```sql
-- Add GitHub fields to users table
ALTER TABLE users ADD COLUMN github_id        VARCHAR(100) UNIQUE;
ALTER TABLE users ADD COLUMN github_username  VARCHAR(100);
ALTER TABLE users ADD COLUMN github_token     TEXT;

-- Add GitHub fields to projects table
ALTER TABLE projects ADD COLUMN github_repo_id      VARCHAR(100);
ALTER TABLE projects ADD COLUMN github_repo_name    VARCHAR(200);
ALTER TABLE projects ADD COLUMN github_org_name     VARCHAR(200);
ALTER TABLE projects ADD COLUMN github_repo_url     TEXT;
ALTER TABLE projects ADD COLUMN tracking_branch     VARCHAR(100) DEFAULT 'dev';
ALTER TABLE projects ADD COLUMN deployment_branch   VARCHAR(100) DEFAULT 'main';
ALTER TABLE projects ADD COLUMN is_released         BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN released_at         TIMESTAMP;

-- Add GitHub fields to tasks table
ALTER TABLE tasks ADD COLUMN github_pr_number  INTEGER;
ALTER TABLE tasks ADD COLUMN github_branch     VARCHAR(200);
ALTER TABLE tasks ADD COLUMN github_pr_url     TEXT;

-- New table: webhook event audit log
CREATE TABLE github_events (
  id          SERIAL PRIMARY KEY,
  event_type  VARCHAR(100) NOT NULL,
  repo_name   VARCHAR(200),
  payload     JSONB NOT NULL,
  processed   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

---

## 📁 Updated Full Folder Structure

This shows the **complete** `server/` folder with all existing files
plus every new file this integration adds (marked ← NEW).

```
server/
├── config/
│   ├── db.js                        # PostgreSQL pool connection (existing)
│   ├── env.js                       # Environment variable loader (existing)
│   └── github.js                    # ← NEW: Octokit client factory
│
├── controllers/
│   ├── auth.controller.js           # register, login, refresh, logout (existing)
│   ├── project.controller.js        # CRUD for projects (existing)
│   ├── task.controller.js           # CRUD for tasks + socket emit (existing)
│   ├── member.controller.js         # Add/remove project members (existing)
│   ├── ai.controller.js             # AI task suggestion handler (existing)
│   ├── github.controller.js         # ← NEW: OAuth + org data + sync
│   └── webhook.controller.js        # ← NEW: handles incoming GitHub events
│
├── routes/
│   ├── auth.routes.js               # /api/auth/* (existing)
│   ├── project.routes.js            # /api/projects/* (existing)
│   ├── task.routes.js               # /api/tasks/* (existing)
│   ├── member.routes.js             # /api/members/* (existing)
│   ├── ai.routes.js                 # /api/ai/* (existing)
│   ├── github.routes.js             # ← NEW: /api/github/*
│   └── webhook.routes.js            # ← NEW: /api/webhooks/github
│
├── middleware/
│   ├── verifyToken.js               # JWT verification for REST (existing)
│   ├── checkRole.js                 # RBAC role guard (existing)
│   ├── socketAuth.js                # JWT verification for sockets (existing)
│   ├── errorHandler.js              # Global error handler (existing)
│   └── verifyWebhook.js             # ← NEW: validates GitHub webhook signature
│
├── services/
│   ├── auth.service.js              # Business logic: hashing, tokens (existing)
│   ├── project.service.js           # Business logic: project ops (existing)
│   ├── task.service.js              # Business logic: task ops (existing)
│   ├── ai.service.js                # Gemini/OpenAI API calls (existing)
│   ├── github.service.js            # ← NEW: GitHub API via Octokit
│   └── webhook.service.js           # ← NEW: processes PR + member events
│
├── models/
│   ├── user.model.js                # DB queries: users table (existing)
│   ├── project.model.js             # DB queries: projects table (existing)
│   ├── task.model.js                # DB queries: tasks table (existing)
│   └── member.model.js              # DB queries: project_members (existing)
│
├── sockets/
│   ├── index.js                     # Socket.io init + middleware (existing)
│   ├── events.js                    # Event name constants (existing)
│   └── handlers/
│       ├── task.handler.js          # Task events (existing)
│       ├── project.handler.js       # Project events (existing)
│       ├── notification.handler.js  # Notification events (existing)
│       └── presence.handler.js      # Presence events (existing)
│
├── db/
│   └── schema.sql                   # PostgreSQL schema + new ALTER TABLE (existing + updated)
│
├── .env                             # Environment variables (existing + new vars)
├── .env.example                     # Template (existing + updated)
├── package.json                     # (existing + new dependencies)
└── server.js                        # Entry point (existing + new routes mounted)
```

---

## ⚙️ Updated Environment Variables

Add these NEW lines to your existing `server/.env`:

```env
# ── existing variables (keep these) ──────────────
PORT=5000
CLIENT_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/devsync
JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development

# ── NEW: GitHub OAuth ─────────────────────────────
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/github/callback

# ── NEW: GitHub Webhooks ──────────────────────────
GITHUB_WEBHOOK_SECRET=any_random_secret_string_you_choose

# ── NEW: Your GitHub Organization ────────────────
GITHUB_ORG_NAME=your-github-org-name

# ── NEW: Session ─────────────────────────────────
SESSION_SECRET=any_random_session_secret_string
```

---

## 🔐 Step 1 — Create a GitHub OAuth App

1. Go to **GitHub → Settings → Developer Settings → OAuth Apps**
2. Click **New OAuth App**
3. Fill in:
   ```
   Application name : DevSync
   Homepage URL     : http://localhost:3000
   Callback URL     : http://localhost:5000/api/github/callback
   ```
4. Copy **Client ID** and **Client Secret** into `.env`

---

## 📄 New Files to Create

### `config/github.js`
```js
const { Octokit } = require('@octokit/rest');

// Returns an authenticated Octokit instance for a given user token
const getOctokit = (token) => new Octokit({ auth: token });

module.exports = { getOctokit };
```

---

### `services/github.service.js`
```js
const { getOctokit } = require('../config/github');

const getOrgRepos = async (githubToken, orgName) => {
  const octokit = getOctokit(githubToken);
  const { data } = await octokit.repos.listForOrg({
    org: orgName, type: 'all', per_page: 100
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

const getRepoContributors = async (githubToken, orgName, repoName) => {
  const octokit = getOctokit(githubToken);
  const { data } = await octokit.repos.listContributors({
    owner: orgName, repo: repoName, per_page: 100
  });
  return data;
};

const createRepoWebhook = async (githubToken, orgName, repoName, webhookUrl) => {
  const octokit = getOctokit(githubToken);
  await octokit.repos.createWebhook({
    owner: orgName,
    repo:  repoName,
    config: {
      url:          webhookUrl,
      content_type: 'json',
      secret:       process.env.GITHUB_WEBHOOK_SECRET
    },
    events: ['pull_request', 'member'],
    active: true
  });
};

module.exports = { getOrgRepos, getOrgMembers, getRepoContributors, createRepoWebhook };
```

---

### `services/webhook.service.js`
```js
const db     = require('../config/db');
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
  const action       = payload.action;
  const pr           = payload.pull_request;
  const repoName     = payload.repository.name;
  const targetBranch = pr.base.ref;     // branch PR merges INTO
  const sourceBranch = pr.head.ref;     // branch PR comes FROM
  const prNumber     = pr.number;
  const prUrl        = pr.html_url;
  const prAuthor     = pr.user.login;
  const isMerged     = pr.merged;

  // Find DevSync project linked to this repo
  const { rows: projects } = await db.query(
    'SELECT * FROM projects WHERE github_repo_name = $1', [repoName]
  );
  if (!projects.length) return;
  const project = projects[0];

  const trackingBranch   = project.tracking_branch   || 'dev';
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
      status:    'In Progress',
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
        message:   `PR #${prNumber} opened for your task`,
        type:      'pr_opened',
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
      status:    'Done',
      updatedBy: `GitHub PR #${prNumber} merged by ${prAuthor}`,
      prUrl,
      timestamp: new Date().toISOString()
    });

    io.to(EVENTS.PROJECT_ROOM(project.id)).emit(EVENTS.NOTIFICATION_NEW, {
      message:   `Task #${taskId} completed — PR #${prNumber} merged by ${prAuthor}`,
      type:      'task_done',
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
      projectId:   project.id,
      projectName: project.title,
      mergedBy:    prAuthor,
      timestamp:   new Date().toISOString()
    });

    io.to(EVENTS.PROJECT_ROOM(project.id)).emit(EVENTS.NOTIFICATION_NEW, {
      message:   `🚀 ${project.title} deployed to production by ${prAuthor}`,
      type:      'project_released',
      timestamp: new Date().toISOString()
    });
  }
};

// ── MEMBER EVENT ──────────────────────────────────────
const handleMemberEvent = async (payload, io) => {
  const action     = payload.action;
  const githubUser = payload.member;
  const repoName   = payload.repository.name;

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
    userId:    user.id,
    name:      user.name,
    role:      'Developer',
    addedBy:   'GitHub',
    timestamp: new Date().toISOString()
  });

  io.to(`user:${user.id}`).emit(EVENTS.NOTIFICATION_NEW, {
    message:   `You were added to "${project.title}" via GitHub`,
    type:      'member_added',
    timestamp: new Date().toISOString()
  });
};

module.exports = { handlePullRequestEvent, handleMemberEvent };
```

---

### `middleware/verifyWebhook.js`
```js
const crypto = require('crypto');

const verifyWebhook = (req, res, next) => {
  const signature = req.headers['x-hub-signature-256'];
  const payload   = JSON.stringify(req.body);
  const hmac      = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET);
  const digest    = 'sha256=' + hmac.update(payload).digest('hex');

  if (signature !== digest) {
    return res.status(401).json({ message: 'Invalid webhook signature' });
  }
  next();
};

module.exports = verifyWebhook;
```

---

### `controllers/webhook.controller.js`
```js
const db = require('../config/db');
const { handlePullRequestEvent, handleMemberEvent } = require('../services/webhook.service');

const handleGithubEvent = async (req, res) => {
  const eventType = req.headers['x-github-event'];
  const payload   = req.body;
  const io        = req.app.get('io');  // same io instance from server.js

  // Log to audit table
  await db.query(
    `INSERT INTO github_events (event_type, repo_name, payload)
     VALUES ($1, $2, $3)`,
    [eventType, payload?.repository?.name, payload]
  );

  try {
    switch (eventType) {
      case 'pull_request':
        await handlePullRequestEvent(payload, io);
        break;
      case 'member':
        await handleMemberEvent(payload, io);
        break;
      default:
        break;
    }
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

module.exports = { handleGithubEvent };
```

---

### `controllers/github.controller.js`
```js
const githubService = require('../services/github.service');
const db            = require('../config/db');

const getOrgRepos = async (req, res) => {
  const { github_token } = req.user;
  const repos = await githubService.getOrgRepos(
    github_token, process.env.GITHUB_ORG_NAME
  );
  res.json(repos);
};

const getOrgMembers = async (req, res) => {
  const { github_token } = req.user;
  const members = await githubService.getOrgMembers(
    github_token, process.env.GITHUB_ORG_NAME
  );
  res.json(members);
};

const syncOrgToDevSync = async (req, res) => {
  const { github_token, id: ownerId } = req.user;
  const orgName    = process.env.GITHUB_ORG_NAME;
  const webhookUrl = `${process.env.BACKEND_URL}/api/webhooks/github`;

  const repos = await githubService.getOrgRepos(github_token, orgName);

  for (const repo of repos) {
    // Create project if it doesn't exist yet
    const existing = await db.query(
      'SELECT id FROM projects WHERE github_repo_id = $1', [String(repo.id)]
    );

    if (!existing.rows.length) {
      await db.query(
        `INSERT INTO projects
         (title, description, owner_id, github_repo_id,
          github_repo_name, github_org_name, github_repo_url,
          tracking_branch, deployment_branch)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'dev', 'main')`,
        [repo.name, repo.description || '', ownerId,
         String(repo.id), repo.name, orgName, repo.html_url]
      );
    }

    // Register webhook on repo (safe to call — GitHub deduplicates)
    try {
      await githubService.createRepoWebhook(
        github_token, orgName, repo.name, webhookUrl
      );
    } catch (err) {
      // Webhook may already exist — not a fatal error
      console.log(`Webhook already exists for ${repo.name}`);
    }
  }

  res.json({ message: `Synced ${repos.length} repos from ${orgName}` });
};

module.exports = { getOrgRepos, getOrgMembers, syncOrgToDevSync };
```

---

### `routes/github.routes.js`
```js
const router      = require('express').Router();
const passport    = require('passport');
const verifyToken = require('../middleware/verifyToken');
const checkRole   = require('../middleware/checkRole');
const {
  getOrgRepos, getOrgMembers, syncOrgToDevSync
} = require('../controllers/github.controller');

// Redirect to GitHub login
router.get('/auth',
  passport.authenticate('github', {
    scope: ['read:org', 'repo', 'read:user', 'user:email']
  })
);

// GitHub redirects here after login
router.get('/callback',
  passport.authenticate('github', { session: false }),
  (req, res) => {
    const { accessToken, refreshToken } = req.user;
    res.redirect(
      `${process.env.CLIENT_URL}/auth/callback` +
      `?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  }
);

router.get('/org/repos',    verifyToken, checkRole(['Admin']), getOrgRepos);
router.get('/org/members',  verifyToken, checkRole(['Admin']), getOrgMembers);
router.post('/org/sync',    verifyToken, checkRole(['Admin']), syncOrgToDevSync);

module.exports = router;
```

---

### `routes/webhook.routes.js`
```js
const router        = require('express').Router();
const verifyWebhook = require('../middleware/verifyWebhook');
const { handleGithubEvent } = require('../controllers/webhook.controller');

// GitHub sends all PR and member events here
router.post('/github', verifyWebhook, handleGithubEvent);

module.exports = router;
```

---

## 📝 Updated `server.js`

Add these lines to your existing `server.js` (only the NEW lines shown):

```js
// ── NEW imports ───────────────────────────────
const session       = require('express-session');
const passport      = require('passport');
const githubRoutes  = require('./routes/github.routes');
const webhookRoutes = require('./routes/webhook.routes');

// ── NEW middleware (add before routes) ────────
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// ── NEW routes (add alongside existing routes) ─
app.use('/api/github',    githubRoutes);
app.use('/api/webhooks',  webhookRoutes);
```

---

## 🖥️ Frontend Changes

### 1 — Login Page: Add GitHub Button
```tsx
const handleGithubLogin = () => {
  window.location.href = 'http://localhost:5000/api/github/auth';
};

<button onClick={handleGithubLogin}
  className="w-full flex items-center justify-center gap-2
             bg-gray-900 text-white py-2 rounded-lg
             hover:bg-gray-700 transition">
  <GithubIcon size={18} />
  Login with GitHub
</button>
```

### 2 — New Page: `src/pages/AuthCallback.tsx`
```tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params       = new URLSearchParams(window.location.search);
    const accessToken  = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken',  accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      navigate('/');
    } else {
      navigate('/login');
    }
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-slate-900">
      <p className="text-white text-lg">Connecting to GitHub...</p>
    </div>
  );
}
```

### 3 — `App.tsx`: Add callback route
```tsx
<Route path="/auth/callback" element={<AuthCallback />} />
```

### 4 — Dashboard: Sync Button (Admin only)
```tsx
const syncGithubRepos = async () => {
  await api.post('/github/org/sync');
  await refetchProjects();
  toast.success('GitHub repos synced!');
};

{hasPermission(user.role, 'createProject') && (
  <button onClick={syncGithubRepos}>
    <GithubIcon size={16} /> Sync GitHub Repos
  </button>
)}
```

### 5 — ProjectCard: Released Badge
```tsx
{project.is_released && (
  <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">
    🚀 Released
  </span>
)}
```

### 6 — TaskCard: PR Link
```tsx
{task.github_pr_url && (
  <a href={task.github_pr_url} target="_blank"
     className="text-xs text-indigo-400 hover:underline">
    PR #{task.github_pr_number}
  </a>
)}
```

### 7 — Listen for `project:released` in `useProjects` hook
```tsx
socket.on('project:released', ({ projectName }) => {
  toast.success(`🚀 ${projectName} deployed to production!`);
  refetchProjects();
});

return () => socket.off('project:released');
```

---

## 🧪 Testing Webhooks Locally

GitHub cannot reach `localhost`. Use ngrok to get a public URL:

```bash
ngrok http 5000
# → https://abc123.ngrok.io
```

Add to `server/.env`:
```env
BACKEND_URL=https://abc123.ngrok.io
```

Restart your backend. Then login as Admin and click **Sync GitHub Repos**. Webhooks will be registered automatically pointing to your ngrok URL.

---

## 🔄 Complete End-to-End Flow

```
ADMIN SETUP
───────────
Admin → "Login with GitHub" → GitHub OAuth
     → github_token saved to users table
     → Admin clicks "Sync GitHub Repos"
     → All org repos → DevSync projects created
     → Webhooks registered on each repo
     → Dashboard shows all projects

MEMBER ADDED
────────────
Admin adds contributor to repo on GitHub
     → GitHub fires member webhook
     → webhook.service finds user by github_username
     → Inserts into project_members (role: Developer)
     → Socket → member panel updates live
     → New member notified in DevSync

DEVELOPER STARTS TASK
─────────────────────
Developer creates branch: feature/task-42
     → Opens PR: feature/task-42 → dev
     → GitHub fires pull_request webhook (opened)
     → webhook.service extracts task ID = 42
     → Task status → In Progress
     → Socket → Kanban updates live for whole team

DEVELOPER FINISHES TASK
───────────────────────
PR reviewed + merged into dev
     → GitHub fires pull_request webhook (closed + merged)
     → Target = dev (tracking branch) ✓
     → Task status → Done
     → Socket → Kanban moves task to Done
     → Progress bar increases
     → Team notified

DEPLOYMENT
──────────
dev merged into main
     → GitHub fires pull_request webhook (closed + merged)
     → Source = dev, Target = main ✓
     → projects.is_released = TRUE
     → Socket → project:released event
     → Dashboard card shows 🚀 Released badge
     → Entire team notified
```

---

## ✅ Implementation Checklist

### Backend
- [ ] Create GitHub OAuth App → copy credentials to `.env`
- [ ] Add new env vars to `server/.env`
- [ ] Run `ALTER TABLE` and `CREATE TABLE` SQL statements
- [ ] `npm install @octokit/rest passport passport-github2 express-session`
- [ ] Create `config/github.js`
- [ ] Create `services/github.service.js`
- [ ] Create `services/webhook.service.js`
- [ ] Create `middleware/verifyWebhook.js`
- [ ] Create `controllers/github.controller.js`
- [ ] Create `controllers/webhook.controller.js`
- [ ] Create `routes/github.routes.js`
- [ ] Create `routes/webhook.routes.js`
- [ ] Add session, passport, and new routes to `server.js`

### Frontend
- [ ] Add "Login with GitHub" button to Login page
- [ ] Create `src/pages/AuthCallback.tsx`
- [ ] Add `/auth/callback` route in `App.tsx`
- [ ] Add "Sync GitHub Repos" button to Dashboard (Admin only)
- [ ] Add Released badge to `ProjectCard`
- [ ] Add PR link to `TaskCard`
- [ ] Listen for `project:released` in `useProjects` hook

### Testing
- [ ] Run `ngrok http 5000` → set `BACKEND_URL` in `.env`
- [ ] Login as Admin with GitHub
- [ ] Click "Sync GitHub Repos" → confirm projects appear
- [ ] Create branch `task-1` → open PR → dev
- [ ] Confirm task moves to In Progress on Kanban
- [ ] Merge PR into dev → confirm task moves to Done
- [ ] Merge dev into main → confirm 🚀 Released badge
- [ ] Add contributor to repo on GitHub
- [ ] Confirm they appear in project members in DevSync
