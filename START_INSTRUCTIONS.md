# How to Start the Storyboard Platform

## Prerequisites

1. **Docker Desktop** - Must be running for database and file storage
2. **Node.js 18+** - Already installed ✓
3. **Dependencies** - Already installed ✓

## Quick Start

### Step 1: Start Docker Desktop
- Open Docker Desktop application
- Wait until it shows "Docker Desktop is running"

### Step 2: Start Database Services
```powershell
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- MinIO (S3 storage) on ports 9000/9001

### Step 3: Initialize Database
```powershell
# Connect to PostgreSQL and run migrations
psql -U storyboard -d storyboard_db -h localhost -f backend/db/migrations/001_initial_schema.sql
```

Or use a PostgreSQL client like pgAdmin to run the migration file.

### Step 4: Start All Services

**Option A: Use the startup script**
```powershell
.\start-dev.ps1
```

**Option B: Start manually in separate terminals**

Terminal 1 - Backend:
```powershell
cd backend
npm run dev
```

Terminal 2 - AI Service:
```powershell
cd ai-service
npm run dev
```

Terminal 3 - Frontend:
```powershell
cd frontend
npm run dev
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **AI Service**: http://localhost:3002
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

## First Time Setup

1. **Create a user account**:
   - Use the register endpoint: `POST /api/v1/auth/register`
   - Or create directly in database

2. **Configure AI Service** (optional):
   - Edit `ai-service/.env`
   - Add your OpenAI API key: `OPENAI_API_KEY=your-key-here`

3. **Start using the app**:
   - Login at http://localhost:3000/login
   - Create a project
   - Import a script (Fountain format)
   - Start storyboarding!

## Troubleshooting

### Database Connection Errors
- Ensure Docker Desktop is running
- Check PostgreSQL is up: `docker ps`
- Verify DATABASE_URL in `backend/.env`

### Port Already in Use
- Stop other services using ports 3000, 3001, 3002
- Or change ports in respective `.env` files

### AI Service Not Working
- Check `ai-service/.env` has valid OPENAI_API_KEY
- AI features will show errors without API key (but app still works)

## Current Status

✅ All dependencies installed
✅ Services configured
⏳ Waiting for Docker Desktop to start
⏳ Database needs initialization

Once Docker is running, execute:
```powershell
docker-compose up -d
```

Then start the services!
