-- DevSync PostgreSQL Schema
-- Run: psql -U postgres -d devsync -f db/schema.sql

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) CHECK (role IN ('Admin', 'Manager', 'Developer', 'Viewer')) DEFAULT 'Developer',
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  owner_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
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

-- Add GitHub fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS github_pr_number  INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS github_branch     VARCHAR(200);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS github_pr_url     TEXT;

-- New table: webhook event audit log
CREATE TABLE IF NOT EXISTS github_events (
  id          SERIAL PRIMARY KEY,
  event_type  VARCHAR(100) NOT NULL,
  repo_name   VARCHAR(200),
  payload     JSONB NOT NULL,
  processed   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);
