# Change: Build Time Reporting System MVP and Features

## Why
To implement a complete time-tracking platform with dual frontend interfaces (User & Admin) and a shared Express.js backend. This proposal organizes the work by **full-stack features** so each developer owns a complete feature end-to-end.

## Team Assignment - Full-Stack Features

| Member | Feature Ownership | Backend Scope | Frontend Scope |
|--------|-------------------|---------------|----------------|
| **Member 1** | **Auth + User Management** | Auth API, User CRUD APIs | Login (both apps), User Management UI |
| **Member 2** | **Time Reporting** | Attendance API, Time Logs API, Project Selector | Daily Report, Month History, Project Selector |
| **Member 3** | **Entity Management** | Clients, Projects, Tasks, Assignments APIs | Entity Tables, Forms, Assignments UI |
| **Member 4** | **Advanced Features + Reporting Settings** | Timer API, File Upload | Timer UI, Dashboard, Absence Upload, Reporting Settings UI (admin) |

### Why Full-Stack Split?
- ✅ Each developer owns a complete feature end-to-end
- ✅ Less coordination needed between team members
- ✅ Faster debugging (same person knows both sides)
- ✅ Better ownership and accountability

## What Changes
- **MVP (Must Have)**: Auth, User Management, Time Reporting, Entity Management
- **Important (Should Have)**: Timer, File Upload, Dashboard
- **Nice to Have**: Password strength, Past month reports, Advanced filtering, UI polish

## Impact
- **Affected code**: Each member works on both backend and frontend for their feature
- **New dependencies needed**:
  - Backend: `bcrypt`, `jsonwebtoken` (password hashing, JWT)
  - Both frontends: `react-router-dom`, `@mantine/notifications` (routing, toast notifications)
- **Shared components**: Login UI, AuthContext, and related auth utilities will be shared in `shared/src/` to avoid code duplication

## Critical Path
```
Phase 0 (All Members) → TASK-M1-010 (Auth Backend) → TASK-M1-020 (Login UI) → All features parallel
```

**Blocking dependency**: Auth system must be complete before other features can test protected routes.

## Timeline Estimate (4 Members, 8 Weeks)

| Sprint | Focus | Goal |
|--------|-------|------|
| **Sprint 1** (Week 1-2) | Foundation + Auth | Login works in both apps |
| **Sprint 2** (Week 3-4) | Core Features | MVP complete |
| **Sprint 3** (Week 5-6) | Advanced + Integration | All features working |
| **Sprint 4** (Week 7-8) | Polish + Testing | Production-ready |

## Coordination Points

1. **Phase 0 (Day 1)**: All members fix Prisma schema together
2. **After Member 1 completes Auth**: All members can test protected routes
3. **Weekly sync**: Review API contracts, discuss blockers
4. **Integration testing**: All members test together before release

## Implementation Decisions (Member 1: Auth)

### Shared Login Component
- **Single shared Login component** (`shared/src/components/Login/LoginPage.tsx`) used by both apps
- Adapts content (images, welcome text) based on `appType: 'user' | 'admin'` prop
- Images via path alias: `@shared/image_components/`
  - Admin: `log_in_background.png`, `Login card.png`, `abraLogo.png`
  - User: `login_mobile.png`, `abraLogo.png`

### Password Validation
- **Frontend & Backend**: Minimum 8 characters, at least one uppercase, one lowercase, and one special character
- Frontend: Zod schema validation with `form.setFieldError()` for inline errors
- Backend: Zod schema validation in controllers

### Error Handling
- **Frontend**:
  - 400 validation errors: Use `form.setFieldError()` for inline red text on inputs
  - 401/409/500 operational errors: Use `notifications.show()` (Mantine) for toast messages
- **Backend**:
  - Global `errorHandler` middleware
  - `AppError` class for structured errors
  - Zod schemas for validation
  - Controllers throw `AppError` (no try/catch in controllers)

### Authentication & Routing
- **Shared AuthContext** (`shared/src/context/AuthContext.tsx`) - same database for users and admins
- **Admin verification**: Check `userType === 'admin'` in admin app's ProtectedRoute
- **User interface**: Accepts both admin and user types (no type check)
- **Redirects after login**:
  - User app: `/month-history`
  - Admin app: `/client-management`
- **Token storage**: JWT token and user info in `localStorage`

## Risks & Mitigations

| Risk | Owner | Mitigation |
|------|-------|------------|
| Auth blocks everyone | Member 1 | Prioritize auth first, others can mock until ready |
| Prisma schema changes | All | Coordinate changes, run migrations together |
| API contract changes | Each owner | Document in `doc/api/API.md`, notify affected members |
| Merge conflicts | Each owner | Clear file ownership (see File Ownership Map in tasks.md) |
