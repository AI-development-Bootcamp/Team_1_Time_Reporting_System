# Design: Time Reporting System Architecture

## Context
Building a monorepo time-tracking platform with 3 services (backend, frontend_user, frontend_admin) for 4 team members to work in parallel with minimal collisions. Each member owns a **full-stack feature** (both backend API and frontend UI).

## Goals
- Enable parallel development with **full-stack feature ownership**
- Minimize merge conflicts and coordination overhead
- Deliver MVP first, then important features, then nice-to-have
- Maintain code quality with TypeScript, testing, and proper validation

## Non-Goals
- Real-time collaboration features
- Mobile native apps (web-first with mobile responsiveness)
- Complex reporting/analytics (basic month history only)

## Team Assignment Strategy

### Decision: Full-Stack Feature Ownership
**What**: Each developer owns a complete feature end-to-end (both backend and frontend)

| Member | Feature | Backend Scope | Frontend Scope |
|--------|---------|---------------|----------------|
| **Member 1** | Auth + User Management | Auth API, User CRUD | Login (both apps), User Management UI |
| **Member 2** | Time Reporting | Attendance API, Time Logs API, Project Selector | Daily Report, Month History, Selector |
| **Member 3** | Entity Management | Clients, Projects, Tasks, Assignments APIs | Entity Tables, Forms, Assignments UI |
| **Member 4** | Advanced Features | Timer API, File Upload | Timer UI, Dashboard, Absence Upload |

**Why**: 
- ✅ Each developer owns a complete feature end-to-end
- ✅ Less coordination needed between team members
- ✅ Faster debugging (same person knows both API and UI)
- ✅ Better ownership and accountability

**Alternatives Considered**:
- Backend/Frontend split (rejected - requires more coordination, slower debugging)
- Feature-based without full-stack (rejected - too many handoffs)

## Technical Decisions

### Decision: Monorepo Structure
**What**: Single repository with 3 service directories
**Why**: Easier dependency management, shared types, unified tooling
**Alternatives**: Separate repos (rejected - harder to share code)

### Decision: API-First Development
**What**: Each member builds their backend API first, then frontend
**Why**: Clear contracts, easier testing, can mock while waiting
**Alternatives**: Frontend-first (rejected - harder to mock)

### Decision: Data Models (Per `doc/models/data-models.md`)
**What**: Use TypeScript interfaces matching the API spec
- `User`: id, name, mail, userType, active, createdAt, updatedAt
- `Client`: id, name, description?, active, createdAt, updatedAt
- `Project`: id, name, clientId, projectManagerId, startDate, endDate?, description?, active
- `Task`: id, name, projectId, startDate?, endDate?, description?, status
- `TaskWorker`: taskId, userId (join table, composite key)
- `DailyAttendance`: id, userId, date, startTime, endTime, status, document? (Bytes)
- `ProjectTimeLogs`: id, dailyAttendanceId, taskId, duration, location, description?

### Decision: API Response Envelope (Per `doc/api/API.md`)
**What**: Standard response format
- Success: `{ "success": true, "data": {} }`
- Error: `{ "success": false, "error": { "code": "...", "message": "...", "details": {} } }`

### Decision: Caching Strategy
**What**: In-memory cache with TTL for project selector (Redis for production)
**Why**: Performance requirement (<300ms), reduces DB load
**Owner**: Member 2 (Time Reporting feature)

### Decision: File Storage
**What**: Store as Bytes (BYTEA) in PostgreSQL
**Why**: Simpler than external storage for MVP, keeps everything in DB
**Owner**: Member 4 (Advanced Features)

## Database Schema (Per `doc/database/schema.md`)

### Enums
- `UserType`: worker, admin
- `TaskStatus`: open, closed
- `DailyAttendanceStatus`: work, sickness, reserves, dayOff, halfDayOff
- `LocationStatus`: office, client, home

### Tables
- `users`: id, name, mail, password, user_type, active, created_at, updated_at
- `clients`: id, name, description, active, created_at, updated_at
- `projects`: id, name, client_id, project_manager_id, start_date, end_date, description, active
- `tasks`: id, name, project_id, start_date, end_date, description, status
- `task_worker`: task_id, user_id (join table, composite key)
- `daily_attendance`: id, user_id, date, start_time, end_time, status, document (BYTEA)
- `project_time_logs`: id, daily_attendance_id, task_id, duration_min, location, description

## Risks / Trade-offs

### Risk: Auth Blocks Everyone
**Owner**: Member 1
**Mitigation**: 
- Prioritize auth first (Sprint 1)
- Other members can mock auth until ready
- Share JWT secret early for testing

### Risk: Database Schema Changes
**Owner**: All (coordinate together)
**Mitigation**: 
- Finalize schema in Phase 0 (Day 1)
- Use Prisma migrations (version controlled)
- Coordinate schema changes with team

### Risk: API Contract Changes
**Owner**: Each feature owner
**Mitigation**: 
- Follow `doc/api/API.md` strictly
- Notify affected members before changes
- Version API if breaking changes needed

### Risk: Merge Conflicts
**Owner**: Each feature owner
**Mitigation**: 
- Clear file ownership (see File Ownership Map in tasks.md)
- Minimal shared files
- Regular git pulls

## Performance Requirements (Per `doc/specs/specification.md`)

| Operation | Target | Owner |
|-----------|--------|-------|
| Login | < 1 second | Member 1 |
| Time entry submission | < 500ms | Member 2 |
| Project selector | < 300ms (cached) | Member 2 |
| Month history load | < 2 seconds | Member 2 |
| Timer start/stop | < 200ms | Member 4 |
| File upload (5MB) | < 3 seconds | Member 4 |
| Admin CRUD | < 1 second | Member 1, 3 |

## Resolved Questions
- [x] Full-stack vs Backend/Frontend split? → **Full-stack feature ownership**
- [x] Redis from start or in-memory cache for MVP? → **In-memory for MVP**
- [x] File storage: Bytes in DB vs documentUrl? → **Bytes in DB**
- [x] DailyAttendance deletion? → **No deletion, editing only**
- [x] Timer state persistence? → **Memory only**
- [x] Timer auto-stop status? → **Uses 'work' status**
- [x] MonthLock model? → **Removed for now, will add later**
- [x] Location of Work field? → **Added to ProjectTimeLogs (office/client/home)**
- [x] Locked month UI behavior? → **Edit button disabled**
