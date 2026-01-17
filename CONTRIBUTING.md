# Contributing to Storyboard Platform

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (for local services)

### Initial Setup

1. **Clone and install dependencies**:
```bash
npm install
cd frontend && npm install
cd ../backend && npm install
cd ../ai-service && npm install
```

2. **Start local services**:
```bash
docker-compose up -d
```

3. **Set up environment variables**:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration
```

4. **Run database migrations**:
```bash
cd backend
npm run db:migrate
```

5. **Start development servers**:
```bash
# From root directory
npm run dev
```

This will start:
- Frontend on http://localhost:3000
- Backend API on http://localhost:3001
- AI Service on http://localhost:3002

## Code Standards

### TypeScript
- Strict mode enabled
- No `any` types without justification
- Proper error handling
- Type-safe API responses

### Backend
- Service layer pattern
- Route handlers are thin
- Business logic in services
- Database queries use parameterized statements
- All errors properly typed and handled

### Frontend
- Component-based architecture
- State management with Zustand
- Type-safe API calls
- Professional, minimal UI
- Keyboard-friendly interactions

### AI Service
- Structured prompts only
- Confidence scoring required
- Context isolation per scene
- All operations reversible
- Comprehensive logging

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Git Workflow

1. Create feature branch from `main`
2. Make changes with clear commits
3. Ensure tests pass
4. Submit pull request with description

## Code Review Guidelines

- All PRs require review
- Tests must pass
- No breaking changes without migration plan
- Documentation updated as needed

## Architecture Decisions

Major architectural changes should be:
1. Documented in ARCHITECTURE.md
2. Discussed in issue/PR
3. Approved before implementation

## Questions?

Open an issue for discussion.
