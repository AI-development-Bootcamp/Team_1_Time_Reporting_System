# Tasks: Build Time Reporting System

## Team Assignment - Full-Stack Features

| Member | Feature Ownership | Backend Scope | Frontend Scope |
|--------|-------------------|---------------|----------------|
| **Member 1** | **Auth + User Management** | Auth API, User CRUD APIs | Login (both apps), User Management UI (admin) |
| **Member 2** | **Time Reporting** | Attendance API, Time Logs API, Project Selector | Daily Report Entry, Month History, Project Selector (user app) |
| **Member 3** | **Entity Management** | Clients, Projects, Tasks, Assignments APIs | Entity Tables, Forms, Assignments UI (admin app) |
| **Member 4** | **Advanced Features** | Timer API, Month Lock API, File Upload | Timer UI, Dashboard, Month Lock UI, Absence Upload |

### Why Full-Stack Split?
- ✅ Each developer owns a complete feature end-to-end
- ✅ Less coordination needed between team members
- ✅ Faster debugging (same person knows both sides)
- ✅ Better ownership and accountability

---

## Key Alignments with Documentation

**This proposal aligns with:**
- **API Specification**: `doc/api/API.md` - All endpoints, request/response formats, error codes
- **Data Models**: `doc/models/data-models.md` - TypeScript interfaces for all entities
- **Database Schema**: `doc/database/schema.md` - PostgreSQL table structure
- **Project Specification**: `doc/specs/specification.md` - Requirements, UI specs, implementation details
- **Code Standards**: `.cursorrules` - File naming (PascalCase), no inline styles, Day.js only, TanStack Query required

**Important Notes:**
- Soft delete field: Use `active` (not `isActive`) per schema and docs
- File naming: PascalCase for all files in folders per .cursorrules
- No inline styles: Use Mantine components only, no `style={{...}}`
- Date handling: Always use Day.js, convert to Date/ISO for Prisma
- State management: TanStack Query (useQuery/useMutation) only, no useEffect+axios
- Forms: @mantine/form with getInputProps pattern
- API response: Standard envelope `{success, data}` or `{success, error}`

---

## ⚠️ Critical Issues to Fix Before Starting

### 1. Prisma Schema Needs Updates (Shared Setup Task)
The current `backend/prisma/schema.prisma` has these issues:
- **Missing**: `password` field in User model
- **Missing**: `MonthLock` model
- **Wrong enum values**: `DailyAttendanceStatus` should be `work, sickness, reserves, dayOff, halfDayOff`
- **Model name**: `ProjectTimeLog` should be `ProjectTimeLogs` to match API docs

### 2. Missing Dependencies
- Backend: `bcrypt` (password hashing)
- Both frontends: `react-router-dom` (routing)

---

## Phase 0: Shared Setup (All Members Together - Day 1)

Before splitting into features, complete these together:

#### TASK-000: Initial Setup (All Members - 1 Day)
- [ ] 0.1 Fix Prisma schema (add password, MonthLock, fix enums)
- [ ] 0.2 Run initial migration (`npx prisma migrate dev --name init`)
- [ ] 0.3 Install missing dependencies:
  - [ ] `npm install bcrypt @types/bcrypt -w backend`
  - [ ] `npm install react-router-dom @types/react-router-dom -w frontend_user`
  - [ ] `npm install react-router-dom @types/react-router-dom -w frontend_admin`
- [ ] 0.4 Setup Docker Compose with PostgreSQL
- [ ] 0.5 Create .env.example with DATABASE_URL, JWT_SECRET, PORT
- [ ] 0.6 Create seed script with initial admin user
- [ ] 0.7 Setup shared utilities:
  - [ ] Backend: `src/utils/Response.ts` (standard response envelope)
  - [ ] Backend: `src/middleware/ErrorHandler.ts`
- [ ] 0.8 Configure MantineProvider with RTL in both frontends
- [ ] 0.9 Setup TanStack Query provider in both frontends
- [ ] 0.10 Create shared API client utility in both frontends

**Validation**: `npm run dev:all` works, database has seed data, both frontends show RTL Mantine UI

---

## Phase 1: MVP Features (Parallel Work)

---

### 👤 MEMBER 1: Auth + User Management (Full-Stack)

**Owns**: Authentication system and User CRUD (both backend and frontend)

#### TASK-M1-010: Auth Backend
- [ ] Create `backend/src/middleware/Auth.ts` - JWT validation middleware
- [ ] Create `backend/src/utils/Bcrypt.ts` - Password hashing utility
- [ ] Create `backend/src/routes/Auth.ts` - Auth routes
- [ ] Implement POST `/api/auth/login`:
  - [ ] Zod schema for login (mail, password)
  - [ ] Validate credentials against database
  - [ ] Generate JWT token (24h expiry)
  - [ ] Return token and user info (exclude password)
- **Validation**: Login returns JWT, invalid credentials return 401

#### TASK-M1-011: User CRUD Backend
- [ ] Create `backend/src/routes/admin/Users.ts`
- [ ] Implement GET `/api/admin/users` (with active filter)
- [ ] Implement POST `/api/admin/users` (hash password, create user)
- [ ] Implement PUT `/api/admin/users/:id` (update user fields)
- [ ] Implement DELETE `/api/admin/users/:id` (soft delete: active=false)
- [ ] Implement POST `/api/admin/users/:id/reset-password`
- [ ] Add admin role check middleware
- **Validation**: All CRUD operations work, soft delete filters correctly

#### TASK-M1-020: Login UI (Both Apps)
- [ ] Create `frontend_user/src/components/Login/LoginPage.tsx`
- [ ] Create `frontend_admin/src/components/Login/LoginPage.tsx`
- [ ] Implement login form with Mantine (mail, password fields)
- [ ] Create `context/AuthContext.tsx` in both apps:
  - [ ] Store JWT token in localStorage
  - [ ] Store user info
  - [ ] Provide login/logout functions
- [ ] Create `components/ProtectedRoute.tsx` in both apps
- [ ] Create `hooks/useAuth.ts` in both apps
- [ ] Setup routing with login/protected routes
- **Validation**: Users can login, token persists, protected routes work

#### TASK-M1-021: User Management UI (Admin App)
- [ ] Create `frontend_admin/src/components/Users/UsersTable.tsx`
- [ ] Create `frontend_admin/src/hooks/useUsers.ts` (TanStack Query)
- [ ] Create `frontend_admin/src/components/Users/UserForm.tsx` modal
- [ ] Implement user creation flow
- [ ] Implement user edit flow
- [ ] Implement soft delete with confirmation
- [ ] Add active/inactive filter toggle
- [ ] Create `ResetPasswordModal.tsx`
- **Validation**: Admin can CRUD users, soft delete works, password reset works

---

### 📊 MEMBER 2: Time Reporting (Full-Stack)

**Owns**: Time entry, attendance, month history, project selector

#### TASK-M2-010: Attendance Backend
- [ ] Create `backend/src/routes/Attendance.ts`
- [ ] Implement POST `/api/attendance`:
  - [ ] Zod validation (date, startTime, endTime, status)
  - [ ] Validate endTime > startTime
  - [ ] Create DailyAttendance record
- [ ] Implement GET `/api/attendance/month-history`:
  - [ ] Query params: month (1-12), userId (required)
  - [ ] Uses current year automatically
  - [ ] Return array of DailyAttendance objects
- [ ] Implement PUT `/api/attendance/:id`
- [ ] Implement DELETE `/api/attendance/:id`
- **Validation**: Attendance CRUD works, validation blocks invalid entries

#### TASK-M2-011: Time Logs Backend
- [ ] Create `backend/src/routes/TimeLogs.ts`
- [ ] Implement POST `/api/time-logs`:
  - [ ] Zod validation (dailyAttendanceId, taskId, duration, description?)
  - [ ] Create ProjectTimeLogs record
- [ ] Implement GET `/api/time-logs?dailyAttendanceId=X`
- [ ] Implement PUT `/api/time-logs/:id`
- [ ] Implement DELETE `/api/time-logs/:id`
- [ ] Support multiple entries per DailyAttendance
- **Validation**: Time logs work, multiple entries per day work

#### TASK-M2-012: Project Selector Backend
- [ ] Create `backend/src/services/ProjectSelector.ts`
- [ ] Implement getProjectsForUser(userId):
  - [ ] Get user's assigned tasks via TaskWorker
  - [ ] Get projects and clients for those tasks
  - [ ] Group by Client → Project structure
- [ ] Implement usage frequency calculation (last 7 days)
- [ ] Create `backend/src/services/Cache.ts` (in-memory cache with TTL)
- [ ] Implement GET `/api/projects/selector` endpoint
- **Validation**: Returns grouped, sorted projects, response < 300ms

#### TASK-M2-020: Daily Report Entry UI (User App)
- [ ] Create `frontend_user/src/components/DailyReport/DailyReportEntry.tsx`
- [ ] Implement date selector (Day.js, defaults to today)
- [ ] Create `components/DailyReport/ProjectReport.tsx`:
  - [ ] Project selector integration
  - [ ] Time pickers (start/end)
  - [ ] Location of Work (Home/Office/In-Client)
  - [ ] Description textarea
  - [ ] Delete button
- [ ] Create `hooks/useCreateAttendance.ts` (TanStack Query mutation)
- [ ] Support multiple project entries per day
- [ ] Implement form validation (endTime > startTime)
- **Validation**: User can submit time entries, validation works

#### TASK-M2-021: Project Selector UI (User App)
- [ ] Create `frontend_user/src/components/ProjectSelector/SmartProjectSelector.tsx`
- [ ] Create `hooks/useProjectSelector.ts` (TanStack Query)
- [ ] Implement grouped display (Client → Project → Task)
- [ ] Implement cascading dropdowns
- [ ] Add loading/error states
- **Validation**: Selector shows grouped, sorted projects

#### TASK-M2-022: Month History UI (User App)
- [ ] Create `frontend_user/src/components/MonthHistory/MonthHistoryReport.tsx`
- [ ] Implement month selector (left/right arrows, current year)
- [ ] Create `hooks/useMonthHistory.ts` (TanStack Query)
- [ ] Implement accordion list (days descending)
- [ ] Implement status badges:
  - [ ] Red: Missing/no hours
  - [ ] Green: 9h (full quota)
  - [ ] Yellow: <9h (partial)
  - [ ] Blue: Sick/Weekend
- [ ] Create collapsed state (date, icon, badge)
- [ ] Create expanded state (entry cards with details)
- [ ] Add "Add Report" button per day
- **Validation**: Month history displays correctly, badges work

---

### 🏢 MEMBER 3: Entity Management (Full-Stack)

**Owns**: Clients, Projects, Tasks, Assignments CRUD

#### TASK-M3-010: Clients Backend
- [ ] Create `backend/src/routes/admin/Clients.ts`
- [ ] Implement GET `/api/admin/clients` (with active filter)
- [ ] Implement POST `/api/admin/clients`
- [ ] Implement PUT `/api/admin/clients/:id`
- [ ] Implement DELETE `/api/admin/clients/:id` (soft delete)
- **Validation**: Clients CRUD works

#### TASK-M3-011: Projects Backend
- [ ] Create `backend/src/routes/admin/Projects.ts`
- [ ] Implement GET `/api/admin/projects` (with clientId filter)
- [ ] Implement POST `/api/admin/projects`
- [ ] Implement PUT `/api/admin/projects/:id`
- [ ] Implement DELETE `/api/admin/projects/:id` (soft delete)
- **Validation**: Projects CRUD works, filtering by client works

#### TASK-M3-012: Tasks Backend
- [ ] Create `backend/src/routes/admin/Tasks.ts`
- [ ] Implement GET `/api/admin/tasks` (with projectId filter)
- [ ] Implement POST `/api/admin/tasks`
- [ ] Implement PUT `/api/admin/tasks/:id`
- [ ] Implement DELETE `/api/admin/tasks/:id` (soft delete)
- **Validation**: Tasks CRUD works, filtering by project works

#### TASK-M3-013: Assignments Backend
- [ ] Create `backend/src/routes/admin/Assignments.ts`
- [ ] Implement POST `/api/admin/assignments` (userId, taskId)
- [ ] Implement GET `/api/admin/assignments`
- [ ] Implement DELETE `/api/admin/assignments/:id`
- **Validation**: Assignments CRUD works

#### TASK-M3-020: Clients UI (Admin App)
- [ ] Create `frontend_admin/src/components/Clients/ClientsTable.tsx`
- [ ] Create `frontend_admin/src/hooks/useClients.ts`
- [ ] Create `components/Clients/ClientForm.tsx` modal
- [ ] Implement CRUD operations with TanStack Query mutations
- **Validation**: Admin can manage clients

#### TASK-M3-021: Projects UI (Admin App)
- [ ] Create `frontend_admin/src/components/Projects/ProjectsTable.tsx`
- [ ] Create `frontend_admin/src/hooks/useProjects.ts`
- [ ] Create `components/Projects/ProjectForm.tsx` modal (with client selection)
- [ ] Add filtering by client
- **Validation**: Admin can manage projects

#### TASK-M3-022: Tasks UI (Admin App)
- [ ] Create `frontend_admin/src/components/Tasks/TasksTable.tsx`
- [ ] Create `frontend_admin/src/hooks/useTasks.ts`
- [ ] Create `components/Tasks/TaskForm.tsx` modal (with project selection)
- [ ] Add filtering by project
- **Validation**: Admin can manage tasks

#### TASK-M3-023: Assignments UI (Admin App)
- [ ] Create `frontend_admin/src/components/Assignments/AssignmentsTable.tsx`
- [ ] Create `frontend_admin/src/hooks/useAssignments.ts`
- [ ] Create `components/Assignments/AssignmentForm.tsx` modal
- [ ] Display assignments with user and task names
- **Validation**: Admin can assign users to tasks

---

### ⚡ MEMBER 4: Advanced Features (Full-Stack)

**Owns**: Timer, Month Locking, File Upload, Dashboard

#### TASK-M4-010: Timer Backend
- [ ] Create `backend/src/services/Timer.ts`:
  - [ ] Store running timers in memory (Map<userId, {startTime, taskId}>)
  - [ ] Start/stop timer functions
- [ ] Create `backend/src/routes/Timer.ts`:
  - [ ] POST `/api/timer/start` (taskId)
  - [ ] POST `/api/timer/stop` (creates DailyAttendance)
  - [ ] GET `/api/timer/status`
- [ ] Create `backend/src/jobs/TimerAutoStop.ts`:
  - [ ] Cron job at 23:59 daily
  - [ ] Auto-stop all running timers
  - [ ] Save as "incomplete" status
- **Validation**: Timer start/stop works, auto-stop at midnight works

#### TASK-M4-011: Month Lock Backend
- [ ] Create `backend/src/services/MonthLock.ts`:
  - [ ] checkMonthLock(year, month) function
  - [ ] lockMonth/unlockMonth functions
- [ ] Create `backend/src/middleware/MonthLockCheck.ts`
- [ ] Implement PUT `/api/admin/month-lock` (year, month, isLocked)
- [ ] Implement GET `/api/admin/month-lock?year=X&month=Y`
- [ ] Apply month lock check to attendance endpoints
- **Validation**: Month locking prevents edits, returns 409 MONTH_LOCKED

#### TASK-M4-012: File Upload Backend
- [ ] Create `backend/src/middleware/FileUpload.ts` (Multer config):
  - [ ] File size limit: 5MB
  - [ ] File types: .pdf, .jpg, .png
- [ ] Implement POST `/api/attendance/:id/upload`
- [ ] Store file as Bytes in DB or save path in documentUrl
- [ ] Implement GET `/api/attendance/:id/document` (download)
- **Validation**: File upload works, validations block invalid files

#### TASK-M4-020: Timer UI (User App)
- [ ] Create `frontend_user/src/components/Timer/TimerComponent.tsx`:
  - [ ] Start/Stop buttons
  - [ ] Timer display (HH:MM:SS)
  - [ ] Task selection dropdown
- [ ] Create `hooks/useTimer.ts` (TanStack Query)
- [ ] Implement timer display with setInterval
- [ ] Handle auto-stop notification
- [ ] Integrate into daily report view
- **Validation**: Timer works, display updates, auto-stop handled

#### TASK-M4-021: Dashboard UI (User App)
- [ ] Create `frontend_user/src/components/Dashboard/ProgressBar.tsx`:
  - [ ] Mantine Progress component
  - [ ] Calculate progress (current hours / 9 hours)
  - [ ] Color coding (<9h yellow, 9h green, >9h red)
- [ ] Calculate total hours for current day
- [ ] Add alerts for <9h or >9h
- **Validation**: Progress bar shows correct progress

#### TASK-M4-022: Month Lock UI (Admin App)
- [ ] Create `frontend_admin/src/components/MonthLock/MonthLockManager.tsx`:
  - [ ] Month/year selector
  - [ ] Lock/unlock toggle
- [ ] Create `hooks/useMonthLock.ts`
- [ ] Add visual indicator for locked months
- [ ] Disable edit buttons when month is locked
- [ ] Handle 409 MONTH_LOCKED error
- **Validation**: Month locking UI works, editing disabled when locked

#### TASK-M4-023: Absence Upload UI (User App)
- [ ] Create `frontend_user/src/components/Absence/AbsenceUpload.tsx`:
  - [ ] Status selection (sickness, reserves, dayOff, halfDayOff)
  - [ ] File upload component
  - [ ] File preview
- [ ] Integrate with DailyAttendance creation
- **Validation**: Absence with document upload works

---

## Phase 2: Integration & Testing

#### TASK-INT-001: API Integration Testing (All Members)
- [ ] Test all endpoints with Postman/Insomnia
- [ ] Verify response formats match API doc
- [ ] Test error cases and edge cases

#### TASK-INT-002: Frontend Integration (All Members)
- [ ] Connect all UIs to backend APIs
- [ ] Test full user flows
- [ ] Fix RTL layout issues

#### TASK-INT-003: Unit Tests (All Members)
- [ ] Backend unit tests (Vitest) - 60% coverage
- [ ] Test auth endpoints (Member 1)
- [ ] Test time reporting endpoints (Member 2)
- [ ] Test entity CRUD endpoints (Member 3)
- [ ] Test advanced feature endpoints (Member 4)

---

## Phase 3: Nice to Have (If Time Permits)

#### Member 1: Password Strength Validation
- [ ] Add password strength validation (Zod schema)
- [ ] Add password confirmation field

#### Member 2: Past Month Reports
- [ ] Add year selector to month history
- [ ] Support viewing reports up to one year back

#### Member 3: Advanced Filtering
- [ ] Add search/filter to all tables
- [ ] Add pagination

#### Member 4: UI Polish
- [ ] Add Hebrew translations
- [ ] Polish RTL layout
- [ ] Add loading skeletons

---

## Task Dependencies Graph

```
Phase 0 (Shared Setup) - ALL MEMBERS
    │
    ├──→ TASK-M1-010 (Auth Backend) ─────────────────────────────────┐
    │         │                                                       │
    │         └──→ TASK-M1-020 (Login UI) ←─── Required by ALL       │
    │                                                                 │
    ├──→ TASK-M2-010 (Attendance Backend) ──→ TASK-M2-020 (Report UI)│
    │         │                                                       │
    │         └──→ TASK-M2-012 (Selector Backend) ──→ TASK-M2-021    │
    │                                                                 │
    ├──→ TASK-M3-010/011/012/013 (Entity Backend) ──→ TASK-M3-020+   │
    │                                                                 │
    └──→ TASK-M4-010/011/012 (Advanced Backend) ──→ TASK-M4-020+     │
```

**Critical Path**: 
1. Phase 0 (All) → 
2. TASK-M1-010 (Auth Backend) → 
3. TASK-M1-020 (Login UI) → 
4. All other features can proceed in parallel

---

## File Ownership Map

### Member 1: Auth + User Management
```
backend/src/
├── middleware/Auth.ts
├── routes/Auth.ts
├── routes/admin/Users.ts
└── utils/Bcrypt.ts

frontend_user/src/
├── components/Login/
├── context/AuthContext.tsx
├── hooks/useAuth.ts
└── components/ProtectedRoute.tsx

frontend_admin/src/
├── components/Login/
├── components/Users/
├── context/AuthContext.tsx
├── hooks/useAuth.ts
├── hooks/useUsers.ts
└── components/ProtectedRoute.tsx
```

### Member 2: Time Reporting
```
backend/src/
├── routes/Attendance.ts
├── routes/TimeLogs.ts
├── routes/Projects.ts (selector endpoint only)
├── services/ProjectSelector.ts
└── services/Cache.ts

frontend_user/src/
├── components/DailyReport/
├── components/MonthHistory/
├── components/ProjectSelector/
├── hooks/useCreateAttendance.ts
├── hooks/useMonthHistory.ts
└── hooks/useProjectSelector.ts
```

### Member 3: Entity Management
```
backend/src/
├── routes/admin/Clients.ts
├── routes/admin/Projects.ts
├── routes/admin/Tasks.ts
└── routes/admin/Assignments.ts

frontend_admin/src/
├── components/Clients/
├── components/Projects/
├── components/Tasks/
├── components/Assignments/
├── hooks/useClients.ts
├── hooks/useProjects.ts
├── hooks/useTasks.ts
└── hooks/useAssignments.ts
```

### Member 4: Advanced Features
```
backend/src/
├── routes/Timer.ts
├── services/Timer.ts
├── services/MonthLock.ts
├── middleware/MonthLockCheck.ts
├── middleware/FileUpload.ts
└── jobs/TimerAutoStop.ts

frontend_user/src/
├── components/Timer/
├── components/Dashboard/
├── components/Absence/
└── hooks/useTimer.ts

frontend_admin/src/
├── components/MonthLock/
└── hooks/useMonthLock.ts
```

---

## Recommended Sprint Plan

### Sprint 1 (Week 1-2): Foundation + Auth
| Member | Focus | Deliverable |
|--------|-------|-------------|
| All | Phase 0 Setup | Database ready, apps configured |
| Member 1 | Auth Backend + Login UI | Login works in both apps |
| Member 2 | Start Attendance Backend | Basic API ready |
| Member 3 | Start Entity Backend | Clients API ready |
| Member 4 | Start Timer Backend | Timer API ready |

### Sprint 2 (Week 3-4): Core Features
| Member | Focus | Deliverable |
|--------|-------|-------------|
| Member 1 | User Management (full-stack) | Admin can manage users |
| Member 2 | Time Reporting (full-stack) | Users can report time |
| Member 3 | Entity Management (full-stack) | Admin can manage entities |
| Member 4 | Timer + Dashboard (full-stack) | Timer works with dashboard |

### Sprint 3 (Week 5-6): Advanced + Integration
| Member | Focus | Deliverable |
|--------|-------|-------------|
| Member 1 | Integration testing | Auth fully tested |
| Member 2 | Month History UI | Full reporting flow |
| Member 3 | Assignments UI | Full entity management |
| Member 4 | Month Lock + File Upload | All advanced features |

### Sprint 4 (Week 7-8): Polish + Testing
| Member | Focus | Deliverable |
|--------|-------|-------------|
| All | Unit tests, bug fixes, polish | Production-ready app |
