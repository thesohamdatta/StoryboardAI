# Quick Start Guide

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL 15+ (or use Docker)
- OpenAI API key (for AI features)

## Setup Steps

### 1. Install Dependencies

```bash
# Root dependencies
npm install

# Frontend
cd frontend && npm install && cd ..

# Backend
cd backend && npm install && cd ..

# AI Service
cd ai-service && npm install && cd ..
```

### 2. Start Infrastructure Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL database on port 5432
- MinIO (S3-compatible storage) on ports 9000/9001

### 3. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env and set:
# - DATABASE_URL
# - JWT_SECRET
# - AI_SERVICE_URL

# AI Service
cp ai-service/.env.example ai-service/.env
# Edit ai-service/.env and set:
# - OPENAI_API_KEY
```

### 4. Initialize Database

```bash
cd backend
# Run migrations
psql -U storyboard -d storyboard_db -f db/migrations/001_initial_schema.sql
# Or use your preferred migration tool
```

### 5. Start Development Servers

From the root directory:

```bash
npm run dev
```

Or start individually:

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: AI Service (optional, if not using mock)
cd ai-service && npm run dev
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- AI Service: http://localhost:3002
- MinIO Console: http://localhost:9001 (minioadmin/minioadmin)

## First Steps

1. **Register a user**:
   - Navigate to http://localhost:3000/login
   - Use the register endpoint or create a user directly in the database

2. **Create a project**:
   - After logging in, click "New Project"
   - Give it a name and description

3. **Import a script** (when implemented):
   - Upload a Fountain format script
   - Or manually create scenes

4. **Generate storyboard**:
   - Use AI suggestions to break down scenes into shots
   - Generate visual panels
   - Refine as needed

## Development Workflow

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Database Migrations

```bash
cd backend
npm run db:migrate
```

### Building for Production

```bash
npm run build
```

This builds both frontend and backend.

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running: `docker-compose ps`
- Check DATABASE_URL in backend/.env
- Verify database exists: `psql -U storyboard -d storyboard_db -c "SELECT 1;"`

### Port Conflicts

- Change ports in docker-compose.yml or .env files
- Frontend: vite.config.ts
- Backend: backend/.env PORT
- AI Service: ai-service/.env PORT

### AI Service Not Working

- Verify OPENAI_API_KEY is set
- Check AI_SERVICE_URL in backend/.env
- Review ai-service logs for errors

## Next Steps

- Read ARCHITECTURE.md for system design
- Review PROMPT_ENGINEERING.md for AI implementation
- Check CONTRIBUTING.md for development guidelines
