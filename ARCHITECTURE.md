# System Architecture

## Overview

This document defines the technical architecture for the AI-powered storyboarding platform. The system is designed for production use by professional filmmakers, storyboard artists, and animation studios.

## Core Principles

1. **API-First**: All functionality exposed via versioned REST APIs
2. **Stateless Services**: Backend services are stateless where possible
3. **Explicit State**: All state changes are logged and reversible
4. **AI Isolation**: AI operations are isolated and can be disabled
5. **Audit Trail**: All actions are logged for compliance and debugging

## System Layers

### 1. Presentation Layer (Frontend)

**Technology**: React + TypeScript

**Responsibilities**:
- User interface rendering
- Client-side state management
- Real-time collaboration UI
- File upload/download
- Canvas-based storyboard editing

**Key Components**:
- `ScriptEditor`: Script import and viewing
- `StoryboardCanvas`: Visual panel editing
- `ShotMetadataPanel`: Shot details editor
- `AIControls`: AI suggestion interface
- `TimelineView`: Shot ordering and navigation
- `CollaborationPanel`: Comments and approvals

**State Management**:
- Global state: Projects, user session, permissions
- Local state: UI interactions, temporary edits
- Server state: Synced via WebSocket for real-time updates

### 2. API Gateway Layer

**Technology**: Express.js / FastAPI

**Responsibilities**:
- Request routing
- Authentication/authorization
- Rate limiting
- Request validation
- Response formatting

**Endpoints Structure**:
```
/api/v1/
  ├── projects/
  │   ├── GET    /projects
  │   ├── POST   /projects
  │   ├── GET    /projects/:id
  │   ├── PUT    /projects/:id
  │   └── DELETE /projects/:id
  ├── scenes/
  │   ├── GET    /projects/:projectId/scenes
  │   ├── POST   /projects/:projectId/scenes
  │   └── PUT    /scenes/:id
  ├── shots/
  │   ├── GET    /scenes/:sceneId/shots
  │   ├── POST   /scenes/:sceneId/shots
  │   └── PUT    /shots/:id
  ├── panels/
  │   ├── GET    /shots/:shotId/panels
  │   ├── POST   /shots/:shotId/panels
  │   ├── PUT    /panels/:id
  │   └── POST   /panels/:id/regenerate
  ├── ai/
  │   ├── POST   /ai/suggest-shots
  │   ├── POST   /ai/generate-panel
  │   └── POST   /ai/refine-panel
  ├── exports/
  │   ├── POST   /exports/pdf
  │   ├── POST   /exports/csv
  │   └── POST   /exports/images
  └── auth/
      ├── POST   /auth/login
      ├── POST   /auth/logout
      └── GET    /auth/me
```

### 3. Business Logic Layer

**Technology**: Node.js / Python

**Responsibilities**:
- Domain logic enforcement
- Data validation
- Business rule application
- Transaction management
- Event emission

**Core Services**:
- `ProjectService`: Project lifecycle management
- `ScriptService`: Script parsing and import
- `StoryboardService`: Scene/shot/panel coordination
- `AIService`: AI operation orchestration
- `ExportService`: Format generation
- `CollaborationService`: Comments, approvals, history

### 4. AI Orchestration Layer

**Technology**: Python (preferred for AI libraries)

**Responsibilities**:
- Prompt engineering and management
- Context scoping (per-scene isolation)
- Style consistency enforcement
- Confidence scoring
- Regeneration without drift

**AI Operations**:
1. **Script Analysis**:
   - Parse script structure
   - Identify scenes and shots
   - Extract character/environment references
   - Suggest camera angles

2. **Panel Generation**:
   - Generate visual panels from shot descriptions
   - Maintain style consistency
   - Preserve character/environment continuity
   - Support iterative refinement

3. **Shot Suggestion**:
   - Suggest shot breakdown from scene text
   - Recommend camera angles and movements
   - Propose shot types (CU, MS, WS, etc.)

**Prompt Structure**:
```python
{
  "system_context": "You are a professional storyboard assistant...",
  "scene_context": {
    "scene_number": 1,
    "scene_text": "...",
    "previous_shots": [...],
    "style_constraints": {...}
  },
  "task": "generate_panel",
  "parameters": {
    "shot_description": "...",
    "style": "anime",
    "character_references": [...],
    "environment_references": [...]
  },
  "constraints": {
    "max_iterations": 3,
    "confidence_threshold": 0.7,
    "preserve_consistency": true
  }
}
```

### 5. Data Layer

**Technology**: PostgreSQL

**Schema Design**:

```sql
-- Core Entities
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  settings JSONB DEFAULT '{}'
);

CREATE TABLE scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_number INTEGER NOT NULL,
  title VARCHAR(255),
  script_text TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, scene_number)
);

CREATE TABLE shots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  shot_number INTEGER NOT NULL,
  shot_type VARCHAR(50), -- CU, MS, WS, etc.
  camera_angle VARCHAR(50),
  camera_movement VARCHAR(50),
  lens VARCHAR(50),
  duration_seconds DECIMAL(5,2),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(scene_id, shot_number)
);

CREATE TABLE panels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shot_id UUID NOT NULL REFERENCES shots(id) ON DELETE CASCADE,
  image_url TEXT,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  ai_confidence DECIMAL(3,2),
  style_reference_id UUID REFERENCES panels(id),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Collaboration
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- director, editor, viewer
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_members (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- owner, editor, viewer
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  panel_id UUID REFERENCES panels(id) ON DELETE CASCADE,
  shot_id UUID REFERENCES shots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  panel_id UUID NOT NULL REFERENCES panels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) NOT NULL, -- draft, review, approved, locked
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(panel_id, user_id)
);

-- Audit Trail
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  entity_type VARCHAR(50) NOT NULL, -- project, scene, shot, panel
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- create, update, delete, approve
  changes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Metadata
CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  panel_id UUID NOT NULL REFERENCES panels(id) ON DELETE CASCADE,
  prompt_used TEXT NOT NULL,
  model_used VARCHAR(100),
  confidence_score DECIMAL(3,2),
  generation_params JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 6. File Storage Layer

**Technology**: S3-compatible storage (AWS S3, MinIO, etc.)

**Storage Structure**:
```
projects/
  {project_id}/
    scripts/
      original.{ext}
      parsed.json
    panels/
      {panel_id}/
        v1.{ext}
        v2.{ext}
        latest.{ext}
    exports/
      {export_id}.pdf
      {export_id}.zip
```

## Security Architecture

### Authentication
- JWT-based authentication
- Refresh token rotation
- Session management

### Authorization
- Role-based access control (RBAC)
- Project-level permissions
- Resource-level checks

### Data Protection
- Encryption at rest (database)
- Encryption in transit (TLS)
- Secure file uploads (virus scanning, size limits)
- PII handling compliance

## Performance Considerations

### Caching Strategy
- Redis for session data
- CDN for static assets and generated images
- Database query result caching

### Optimization
- Lazy loading for large storyboards
- Image compression and thumbnails
- Pagination for lists
- Database indexing on foreign keys and search fields

### Scalability
- Horizontal scaling for API servers
- Database read replicas
- Async processing for AI operations
- Queue system for export generation

## Monitoring & Observability

### Logging
- Structured logging (JSON)
- Log levels: ERROR, WARN, INFO, DEBUG
- Request/response logging
- AI operation logging

### Metrics
- API response times
- AI generation latency
- Error rates
- User activity metrics

### Alerting
- Error rate thresholds
- AI service failures
- Database connection issues
- Storage quota warnings

## Deployment Architecture

### Development
- Local development with Docker Compose
- Hot reload for frontend
- Database migrations on startup

### Staging
- Mirrors production environment
- Test data seeding
- Integration testing

### Production
- Containerized services (Docker/Kubernetes)
- Load balancing
- Auto-scaling
- Blue-green deployments
- Database backups

## Technology Decisions

### Why PostgreSQL?
- ACID compliance for data integrity
- JSONB support for flexible metadata
- Strong relational capabilities
- Proven in production environments

### Why React?
- Component reusability
- Strong ecosystem
- Performance optimization options
- Industry standard

### Why Separate AI Layer?
- Isolation of AI operations
- Independent scaling
- Easier model swapping
- Clear separation of concerns

## Future Considerations

- Multi-tenant support
- Offline mode with sync
- Mobile companion app
- Advanced animation preview
- Integration with production tools (Shotgun, Frame.io)
