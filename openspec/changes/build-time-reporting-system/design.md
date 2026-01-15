# Design: Time Reporting System Architecture

## Context
Building a monorepo time-tracking platform with 3 services (backend, frontend_user, frontend_admin) for 4 team members to work in parallel with minimal collisions.

## Goals
- Enable parallel development with clear separation of concerns
- Minimize merge conflicts and coordination overhead
- Deliver MVP first, then important features, then nice-to-have
- Maintain code quality with TypeScript, testing, and proper validation

## Non-Goals
- Real-time collaboration features
- Mobile native apps (web-first with mobile responsiveness)
- Complex reporting/analytics (basic month history only)

## Decisions

### Decision: Monorepo Structure
**What**: Single repository with 3 service directories
**Why**: Easier dependency management, shared types, unified tooling
**Alternatives**: Separate repos (rejected - harder to share code)

### Decision: Member Assignment Strategy
**What**: 
- Member 1: Backend Infrastructure + Auth + Admin APIs
- Member 2: Backend Time Reporting + Project Logic + File Upload
- Member 3: Frontend User App
- Member 4: Frontend Admin App

**Why**: Clear separation prevents collisions, each member owns a vertical slice
**Alternatives**: 
- Feature-based (rejected - too many collisions)
- Full-stack per feature (rejected - harder to maintain consistency)

### Decision: API-First Development
**What**: Backend APIs completed before frontend integration
**Why**: Enables parallel frontend work, clear contracts, easier testing
**Alternatives**: 
- Frontend-first (rejected - harder to mock, less type safety)
- TDD (considered but deferred for speed)

### Decision: Caching Strategy
**What**: In-memory cache with TTL for project selector (Redis for production)
**Why**: Performance requirement (<300ms), reduces DB load
**Alternatives**: 
- No cache (rejected - too slow)
- Database view (rejected - doesn't solve frequency sorting)

### Decision: File Storage
**What**: Store as Bytes in PostgreSQL or documentUrl (TEXT)
**Why**: Simpler than external storage for MVP, can migrate later
**Alternatives**: 
- S3/Cloud Storage (deferred - adds complexity)
- File system (rejected - deployment complexity)

## Risks / Trade-offs

### Risk: API Contract Changes
**Mitigation**: 
- Define API contracts early (Phase 2)
- Use TypeScript interfaces shared between frontend/backend
- Version API if breaking changes needed

### Risk: Database Schema Changes
**Mitigation**: 
- Finalize schema in Phase 1 (Member 2)
- Use Prisma migrations (version controlled)
- Coordinate schema changes with team

### Risk: Merge Conflicts in Shared Files
**Mitigation**: 
- Minimal shared files (only types, if any)
- Clear ownership of files
- Regular git pulls and communication

### Risk: Performance Not Meeting Targets
**Mitigation**: 
- Implement caching early (Phase 2)
- Monitor response times during development
- Load testing before release

## Migration Plan
N/A - Greenfield project

## Open Questions
- [ ] Should we use Redis from start or in-memory cache for MVP?
- [ ] File storage: Bytes in DB vs documentUrl - which is better for 5MB files?
- [ ] Should we implement API versioning from start?
