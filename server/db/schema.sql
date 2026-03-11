-- DevSync PostgreSQL Schema
-- Run: psql -U postgres -d devsync -f db/schema.sql

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) CHECK (role IN ('Admin', 'Manager', 'Developer', 'sadmin')) DEFAULT 'Developer',
  onboarded       BOOLEAN DEFAULT FALSE,
  onboarding_type VARCHAR(20),
  org_id          INTEGER,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  slug        VARCHAR(150) UNIQUE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Add foreign key to users
ALTER TABLE users ADD CONSTRAINT fk_user_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE SET NULL;

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  owner_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  org_id      INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Project members (junction table with role per project)
CREATE TABLE IF NOT EXISTS project_members (
  id          SERIAL PRIMARY KEY,
  project_id  INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role        VARCHAR(20) CHECK (role IN ('Manager', 'Developer', 'Viewer')) NOT NULL,
  joined_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL PRIMARY KEY,
  project_id  INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  title       VARCHAR(300) NOT NULL,
  description TEXT,
  status      VARCHAR(30) CHECK (status IN ('Todo', 'In Progress', 'Done')) DEFAULT 'Todo',
  priority    VARCHAR(20) CHECK (priority IN ('Low', 'Medium', 'High')) DEFAULT 'Medium',
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  due_date    DATE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  expires_at  TIMESTAMP NOT NULL
);

-- GitHub Integration Extensions
---------------------------------------------------------

-- Add GitHub fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id        VARCHAR(100) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_username  VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_token     TEXT;

-- Add GitHub fields to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_repo_id      VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_repo_name    VARCHAR(200);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_org_name     VARCHAR(200);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_repo_url     TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tracking_branch     VARCHAR(100) DEFAULT 'dev';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deployment_branch   VARCHAR(100) DEFAULT 'main';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_released         BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS released_at         TIMESTAMP;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS released_at         TIMESTAMP;
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS dashboard_visible    BOOLEAN DEFAULT TRUE;

-- Add GitHub fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS github_pr_number  INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS github_branch     VARCHAR(200);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS github_pr_url     TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source            VARCHAR(50) DEFAULT NULL;

-- New table: webhook event audit log
CREATE TABLE IF NOT EXISTS github_events (
  id          SERIAL PRIMARY KEY,
  event_type  VARCHAR(100) NOT NULL,
  repo_name   VARCHAR(200),
  payload     JSONB NOT NULL,
  processed   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- New table: project invitations
CREATE TABLE IF NOT EXISTS invitations (
  id            SERIAL PRIMARY KEY,
  project_id    INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  email         VARCHAR(150) NOT NULL,
  token         VARCHAR(255) UNIQUE NOT NULL,
  role          VARCHAR(20) NOT NULL,
  invited_by    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMP DEFAULT NOW(),
  expires_at    TIMESTAMP NOT NULL,
  accepted_at   TIMESTAMP,
  UNIQUE(project_id, email)
);

-- Organization invitations
CREATE TABLE IF NOT EXISTS org_invitations (
  id            SERIAL PRIMARY KEY,
  org_id        INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  email         VARCHAR(150) NOT NULL,
  token         VARCHAR(255) UNIQUE NOT NULL,
  role          VARCHAR(20) NOT NULL,
  invited_by    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMP DEFAULT NOW(),
  expires_at    TIMESTAMP NOT NULL,
  accepted_at   TIMESTAMP,
  UNIQUE(org_id, email)
);
