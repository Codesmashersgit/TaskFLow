CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(80) NOT NULL,
  email VARCHAR(254) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar VARCHAR(500) NOT NULL DEFAULT '',
  role VARCHAR(20) NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(80) NOT NULL,
  description VARCHAR(1000) NOT NULL DEFAULT '',
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  priority VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  due_date TIMESTAMPTZ,
  color VARCHAR(20) NOT NULL DEFAULT 'violet' CHECK (color IN ('violet', 'blue', 'green', 'orange')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_members (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(120) NOT NULL,
  description VARCHAR(2000) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'Todo' CHECK (status IN ('Backlog', 'Todo', 'In Progress', 'In Review', 'Done')),
  priority VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  due_date TIMESTAMPTZ,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  labels TEXT[] NOT NULL DEFAULT '{}',
  checklist JSONB NOT NULL DEFAULT '[]',
  comments JSONB NOT NULL DEFAULT '[]',
  activity JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_owner ON tasks(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id, status, due_date);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  message VARCHAR(240) NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
