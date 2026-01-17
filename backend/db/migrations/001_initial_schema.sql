-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Project members (collaboration)
CREATE TABLE project_members (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- Scenes table
CREATE TABLE scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_number INTEGER NOT NULL,
  title VARCHAR(255),
  script_text TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, scene_number)
);

-- Shots table
CREATE TABLE shots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  shot_number INTEGER NOT NULL,
  shot_type VARCHAR(50),
  camera_angle VARCHAR(50),
  camera_movement VARCHAR(50),
  lens VARCHAR(50),
  duration_seconds DECIMAL(5,2),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(scene_id, shot_number)
);

-- Panels table
CREATE TABLE panels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shot_id UUID NOT NULL REFERENCES shots(id) ON DELETE CASCADE,
  image_url TEXT,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  ai_confidence DECIMAL(3,2),
  style_reference_id UUID REFERENCES panels(id),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  panel_id UUID REFERENCES panels(id) ON DELETE CASCADE,
  shot_id UUID REFERENCES shots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Approvals table
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  panel_id UUID NOT NULL REFERENCES panels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(panel_id, user_id)
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  changes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI generations metadata
CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  panel_id UUID NOT NULL REFERENCES panels(id) ON DELETE CASCADE,
  prompt_used TEXT NOT NULL,
  model_used VARCHAR(100),
  confidence_score DECIMAL(3,2),
  generation_params JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_scenes_project ON scenes(project_id);
CREATE INDEX idx_shots_scene ON shots(scene_id);
CREATE INDEX idx_panels_shot ON panels(shot_id);
CREATE INDEX idx_comments_panel ON comments(panel_id);
CREATE INDEX idx_comments_shot ON comments(shot_id);
CREATE INDEX idx_approvals_panel ON approvals(panel_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_ai_generations_panel ON ai_generations(panel_id);
