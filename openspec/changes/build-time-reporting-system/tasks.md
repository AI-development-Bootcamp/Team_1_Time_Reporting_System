# Tasks: Build Time Reporting System

## Team Assignment - Full-Stack Features

| Member | Feature Ownership | Backend Scope | Frontend Scope |
|--------|-------------------|---------------|----------------|
| **Member 1** | **Auth + User Management** | Auth API, User CRUD APIs | Login (both apps), User Management UI (admin) |
| **Member 2** | **Time Reporting** | Attendance API, Time Logs API, Project Selector | Daily Report, Month History, Project Selector (user app) |
| **Member 3** | **Entity Management** | Clients, Projects, Tasks, Assignments APIs | Entity Tables, Forms, Assignments UI (admin app) |
| **Member 4** | **Advanced Features** | Timer API, File Upload | Timer UI, Dashboard, Absence Upload |

### Why Full-Stack Split?
- ✅ Each developer owns a complete feature end-to-end
- ✅ Less coordination needed between team members
- ✅ Faster debugging (same person knows both sides)
- ✅ Better ownership and accountability

---

## Documentation References

All tasks must align with these documents:
- **API Specification**: `doc/api/API.md` - Endpoints, request/response formats, error codes
- **Data Models**: `doc/models/data-models.md` - TypeScript interfaces
- **Database Schema**: `doc/database/schema.md` - PostgreSQL table structure
- **Project Specification**: `doc/specs/specification.md` - Requirements, UI specs
- **Code Standards**: `.cursorrules` - Naming conventions, patterns

### Key Conventions (Per `.cursorrules`)
- **Soft delete**: Use `active` field (not `isActive`)
- **File naming**: PascalCase for all files (e.g., `Auth.ts`, `UsersTable.tsx`)
- **No inline styles**: Use Mantine components only
- **Date handling**: Always use Day.js, convert to Date/ISO for Prisma
- **State management**: TanStack Query only (no useEffect+axios)
- **Forms**: @mantine/form with getInputProps pattern
- **API response**: `{success, data}` or `{success, error}` envelope

---

## ⚠️ Critical Issues to Fix Before Starting

### 1. Prisma Schema Updates Needed
Current `backend/prisma/schema.prisma` issues:
- ✅ **Fixed**: `password String @db.Text` field in User model
- ✅ **Fixed**: `DailyAttendanceStatus` enum: `work`, `sickness`, `reserves`, `dayOff`, `halfDayOff`
- ✅ **Fixed**: `LocationStatus` enum: `office`, `client`, `home`
- ✅ **Fixed**: `document Bytes?` in DailyAttendance (binary file storage)
- ✅ **Fixed**: `location LocationStatus` in ProjectTimeLogs
- ✅ **Fixed**: Model name: `ProjectTimeLogs` (per API doc)

### 2. Missing Dependencies
- Backend: `bcrypt @types/bcrypt`
- Both frontends: `react-router-dom @types/react-router-dom`

---

## Phase 0: Shared Setup (All Members - Day 1)

#### TASK-000: Initial Setup (All Members Together)
- [x] 0.1 Prisma schema is now fixed:
  - [x] `password String @db.Text` in User model
  - [x] `DailyAttendanceStatus` enum: `work, sickness, reserves, dayOff, halfDayOff`
  - [x] `LocationStatus` enum: `office, client, home`
  - [x] `document Bytes?` in DailyAttendance
  - [x] `location LocationStatus` in ProjectTimeLogs
  - [x] Model name: `ProjectTimeLogs`
- [x] 0.2 Install missing dependencies:
  - [x] `npm install bcrypt @types/bcrypt -w backend`
  - [x] `npm install react-router-dom @types/react-router-dom -w frontend_user`
  - [x] `npm install react-router-dom @types/react-router-dom -w frontend_admin`
- [x] 0.3 Setup Docker Compose with PostgreSQL
- [x] 0.4 Create `.env.example` with DATABASE_URL, JWT_SECRET, PORT
- [ ] 0.5 Run initial migration: `npx prisma migrate dev --name init` (Ready - run when database is accessible)
- [x] 0.6 Create seed script (`backend/prisma/seed.ts`):
  - [x] Initial admin user (hashed password)
  - [x] Sample clients (2-3)
  - [x] Sample projects per client
  - [x] Sample tasks per project
  - [x] User-task assignments
- [x] 0.7 Setup shared backend utilities:
  - [x] `src/utils/Response.ts` - Standard response envelope per API doc
  - [x] `src/middleware/ErrorHandler.ts` - Global error handling
- [x] 0.8 Configure MantineProvider with RTL (`direction: 'rtl'`) in both frontends
- [x] 0.9 Setup TanStack Query provider in both frontends
- [x] 0.10 Create shared API client utility (`utils/ApiClient.ts`) in both frontends

**Validation**: `npm run dev:all` works, database has seed data, both frontends show RTL Mantine UI

---

## Phase 1: MVP Features (Parallel Work by Feature)

---

### 👤 MEMBER 1: Auth + User Management

**Feature Owner**: Authentication and User CRUD (full-stack)

#### TASK-M1-010: Auth Backend (Per `doc/api/API.md` Section 1)
- [x] Create `backend/src/routes/Auth.ts`
- [x] Create `backend/src/middleware/Auth.ts` - JWT validation middleware
- [x] Create `backend/src/utils/Bcrypt.ts` - Password hashing
- [x] Create `backend/src/utils/AppError.ts` - Custom error class (exists in ErrorHandler.ts)
- [x] Create `backend/src/utils/validationSchemas.ts` - Zod schemas for auth
- [x] Implement `POST /api/auth/login`:
  - [x] Zod schema: `{ mail: string, password: string }`
  - [x] Validate credentials against database
  - [x] Compare password hash using bcrypt
  - [x] Generate JWT token (24h expiry)
  - [x] Return: `{ success: true, data: { token, expiresInHours: 24, user } }`
  - [x] Exclude password from user response
  - [x] Throw `AppError` instead of using try/catch
- [x] Error handling (via global `errorHandler` middleware):
  - [x] 400 `VALIDATION_ERROR` for missing/invalid fields (ZodError)
  - [x] 401 `UNAUTHORIZED` for wrong credentials
- **Validation**: Login returns JWT, invalid credentials return 401
- [x] **Tests**: Unit tests for Bcrypt, validationSchemas; Integration tests for auth flow

#### TASK-M1-011: User CRUD Backend (Per `doc/api/API.md` Section 2)
- [x] Create `backend/src/routes/admin/Users.ts`
- [x] Add admin role check middleware (`userType === 'admin'`)
- [x] Implement `GET /api/admin/users`:
  - [x] Query param: `active` (boolean, optional)
  - [x] Filter by active status, default to all
  - [x] Return user list (exclude passwords)
- [x] Implement `POST /api/admin/users`:
  - [x] Zod schema: `{ name, mail, password, userType }` with password validation (8 chars, 1 uppercase, 1 lowercase, 1 special char)
  - [x] Hash password before saving
  - [x] Return: `{ success: true, data: { id } }` (201 Created)
  - [x] 409 `CONFLICT` if mail already exists
  - [x] Throw `AppError` instead of using try/catch
- [x] Implement `PUT /api/admin/users/:id`:
  - [x] Zod schema: `{ name?, mail?, userType?, isActive? }` (password NOT allowed - use reset-password endpoint)
  - [x] Return: `{ success: true, data: { updated: true } }`
- [x] Implement `DELETE /api/admin/users/:id`:
  - [x] Soft delete: set `isActive = false`
  - [x] Return: `{ success: true, data: { deleted: true } }`
- [x] Implement `POST /api/admin/users/:id/reset-password`:
  - [x] Zod schema: `{ newPassword }` with password validation
  - [x] Hash and update password
  - [x] Return: `{ success: true, data: { updated: true } }`
- [x] **Validation**: All CRUD works, soft delete filters correctly (filtering on `isActive: true`)
- [x] **Tests**: Integration tests for all CRUD operations (`backend/tests/integration/users.test.ts`)

#### TASK-M1-020: Login UI (Both Apps - Shared Components)
- [x] Install `@mantine/notifications` in both frontends
- [x] Update `main.tsx` in both apps to include `NotificationsProvider` wrapper
- [x] Create **shared** `shared/src/types/User.ts` - User type definitions (matches API response)
- [x] Create **shared** `shared/src/context/AuthContext.tsx`:
  - [x] Store JWT token in localStorage (Bearer token approach)
  - [x] Decode user info from token on mount (user is decoded from token, not stored separately)
  - [x] Provide `login()`, `logout()`, `isAuthenticated`, `user` functions
  - [x] Load user from token on mount
  - [x] Verify `userType === 'admin'` for admin routes (in admin app's ProtectedRoute)
- [x] Create **shared** `shared/src/hooks/useLogin.ts`:
  - [x] Uses `useMutation` from TanStack Query
  - [x] Calls `POST /api/auth/login` via `apiClient`
  - [x] 3-layer error handling:
    - 400 validation errors: Use `form.setFieldError()` for inline red text on inputs
    - 401/409/500 operational errors: Use `notifications.show()` for toast messages
  - [x] On success: Call `login()` from AuthContext, redirect to appropriate page
- [x] Create **shared** `shared/src/components/Login/LoginPage.tsx`:
  - [x] Accept `appType: 'user' | 'admin'` prop
  - [x] Adapt images based on appType:
    - Admin: `@shared/image_components/log_in_backround.png`, `abraLogo.png`
    - User: `@shared/image_components/login_mobile.png`, `log_in_backround.png` background
  - [x] Same welcome text for both (Hebrew, styled appropriately)
  - [x] Replace "התחברות באמצעות azure" with "התחברות" on login button/text
  - [x] Implement login form with Mantine:
    - [x] TextInput for mail (required)
    - [x] PasswordInput for password (required)
    - [x] Button for submit
    - [x] Use `@mantine/form` with `getInputProps` pattern
    - [x] Basic validation: mail and password required (no password strength check for login)
- [x] Create **shared** `shared/src/components/ProtectedRoute/ProtectedRoute.tsx`:
  - [x] Accept `children`, `requireAdmin?: boolean` props
  - [x] Redirect to `/login` if not authenticated
  - [x] If `requireAdmin=true`: also check `userType === 'admin'`, redirect to `/login` if not admin
- [x] Create **shared** `shared/src/hooks/useAuth.ts` for easy access to auth context
- [x] Update `App.tsx` in both apps:
  - [x] Wrap with `AuthContextProvider` from shared
  - [x] Setup React Router v7 routes:
    - [x] `/login` - public route (uses shared LoginPage with appType prop)
    - [x] User app: `/month-history` - protected route (placeholder page for now)
    - [x] Admin app: `/client-management` - protected route with `requireAdmin=true` (placeholder page for now)
  - [x] Redirect `/` to appropriate default page (`/login` if not auth, `/month-history` or `/client-management` if auth)
- [x] **Note**: `ApiClient.ts` includes `Authorization: Bearer <token>` header (shared) - token stored in localStorage
- **Validation**: Users can login, token persists on refresh, protected routes work, redirects to correct pages after login
- [x] **Tests**: Unit tests for AuthContext, ProtectedRoute, ApiClient logic

#### TASK-M1-021: User Management UI (Admin App)
- [ ] Create `frontend_admin/src/components/Users/UsersTable.tsx`:
  - [ ] Mantine Table component
  - [ ] Columns: name, mail, userType, active, actions
  - [ ] Actions: Edit, Delete, Reset Password buttons
- [ ] Create `frontend_admin/src/hooks/useUsers.ts`:
  - [ ] `useQuery` for GET /api/admin/users
  - [ ] `useMutation` for create, update, delete
  - [ ] Invalidate queries after mutations
- [ ] Create `components/Users/UserForm.tsx` modal:
  - [ ] Create mode: name, mail, password, userType fields
  - [ ] Edit mode: name, mail, userType, active fields (password optional)
  - [ ] Use `@mantine/form` with validation
- [ ] Create `components/Users/ResetPasswordModal.tsx`:
  - [ ] New password input
  - [ ] Confirm password input
- [ ] Implement active/inactive filter toggle
- **Validation**: Admin can CRUD users, soft delete works, password reset works

---

### 📊 MEMBER 2: Time Reporting

**Feature Owner**: Attendance, Time Logs, Project Selector (full-stack)

#### TASK-M2-010: Attendance Backend (Per `doc/api/API.md` Section 7)
- [ ] Create `backend/src/routes/Attendance.ts`
- [ ] Implement `POST /api/attendance`:
  - [ ] Zod schema: `{ date, startTime, endTime, status }`
  - [ ] Validate: `endTime > startTime` (return 400 if not)
  - [ ] Create DailyAttendance record
  - [ ] Return: `{ success: true, data: { id } }`
- [ ] Implement `GET /api/attendance/month-history`:
  - [ ] Query params: `month` (1-12, required), `userId` (required)
  - [ ] Use current year automatically
  - [ ] Return array of DailyAttendance objects
  - [ ] Response: `{ success: true, data: [DailyAttendance, ...] }`
- [ ] Implement `PUT /api/attendance/:id`:
  - [ ] Update DailyAttendance record
- [ ] **Note**: No DELETE endpoint - records are edited, not deleted
- **Validation**: Attendance CRUD works, time validation blocks invalid entries

#### TASK-M2-011: Time Logs Backend (Per `doc/api/API.md` Section 8)
- [ ] Create `backend/src/routes/TimeLogs.ts`
- [ ] Implement `POST /api/time-logs`:
  - [ ] Zod schema: `{ dailyAttendanceId, taskId, duration, location, description? }`
  - [ ] Note: `duration` is in minutes (map to `durationMin` in DB)
  - [ ] Note: `location` is required (office/client/home)
  - [ ] Create ProjectTimeLogs record
  - [ ] Return: `{ success: true, data: { id } }`
- [ ] Implement `GET /api/time-logs?dailyAttendanceId=X`:
  - [ ] Filter by dailyAttendanceId
  - [ ] Return array of ProjectTimeLogs (include location)
- [ ] Implement `PUT /api/time-logs/:id`:
  - [ ] Update record
- [ ] Implement `DELETE /api/time-logs/:id`:
  - [ ] Delete ProjectTimeLogs record
- **Validation**: Time logs work, multiple entries per day allowed, location required

#### TASK-M2-012: Project Selector Backend
- [ ] Create `backend/src/services/ProjectSelector.ts`
- [ ] Implement `getProjectsForUser(userId)`:
  - [ ] Get user's assigned tasks via TaskWorker join table
  - [ ] Get projects and clients for those tasks
  - [ ] Group by Client → Project → Task structure
- [ ] Implement usage frequency calculation:
  - [ ] Query ProjectTimeLogs for last 7 days per user
  - [ ] Count usage per project
  - [ ] Sort by frequency (highest first)
- [ ] Create `backend/src/services/Cache.ts`:
  - [ ] In-memory cache with TTL (5 minutes)
  - [ ] Cache key: userId
  - [ ] Cache value: grouped, sorted project list
- [ ] Implement `GET /api/projects/selector`:
  - [ ] Check cache first
  - [ ] If miss, calculate and cache
  - [ ] Return grouped, sorted project list
- [ ] Implement cache refresh triggers:
  - [ ] On POST /api/admin/assignments
  - [ ] On POST /api/attendance
- **Validation**: Returns grouped, sorted projects, response < 300ms

#### TASK-M2-020: Daily Report Entry UI (User App)
- [ ] Create `frontend_user/src/components/DailyReport/DailyReportEntry.tsx`
- [ ] Implement date selector:
  - [ ] Mantine DatePicker
  - [ ] Default to today (use Day.js)
- [ ] Create `components/DailyReport/ProjectReport.tsx`:
  - [ ] Project selector integration (cascading: Client → Project → Task)
  - [ ] Time pickers (startTime, endTime)
  - [ ] Location of Work: Radio/Select (office, client, home) - **REQUIRED**
  - [ ] Description textarea (optional)
  - [ ] Edit button (no delete - records are edited only)
- [ ] Create `hooks/useCreateAttendance.ts`:
  - [ ] `useMutation` for POST /api/attendance
  - [ ] `useMutation` for POST /api/time-logs
  - [ ] Invalidate queries after success
- [ ] Support multiple project entries per day:
  - [ ] "Add Project" button
  - [ ] List of ProjectReport components
- [ ] Implement validation:
  - [ ] endTime > startTime (per spec)
  - [ ] Required fields
- **Validation**: User can submit time entries, validation works

#### TASK-M2-021: Project Selector UI (User App)
- [ ] Create `frontend_user/src/components/ProjectSelector/SmartProjectSelector.tsx`
- [ ] Create `hooks/useProjectSelector.ts`:
  - [ ] `useQuery` for GET /api/projects/selector
- [ ] Implement grouped display:
  - [ ] Client headers
  - [ ] Projects under each client
  - [ ] Tasks under each project
  - [ ] Sorted by frequency
- [ ] Implement cascading dropdowns:
  - [ ] Client selection → filter projects
  - [ ] Project selection → filter tasks
  - [ ] Only show tasks assigned to user
- [ ] Add loading/error states
- **Validation**: Selector shows grouped, sorted projects

#### TASK-M2-022: Month History UI (User App)
- [ ] Create `frontend_user/src/components/MonthHistory/MonthHistoryReport.tsx`
- [ ] Implement month selector:
  - [ ] Left/right navigation arrows
  - [ ] Display: "October 2026"
  - [ ] Uses current year only
- [ ] Create `hooks/useMonthHistory.ts`:
  - [ ] `useQuery` for GET /api/attendance/month-history
- [ ] Implement accordion list (Mantine Accordion):
  - [ ] Days in descending order (newest first)
- [ ] Implement status badges (per UI spec):
  - [ ] 🔴 Red: Missing/no hours
  - [ ] 🟢 Green: 9h (full quota)
  - [ ] 🟡 Yellow: <9h (partial)
  - [ ] 🔵 Blue: Sick/Weekend
- [ ] Collapsed state:
  - [ ] Date (e.g., "16/01/26, Thu")
  - [ ] Icon (briefcase for work, calendar for absence)
  - [ ] Status badge
- [ ] Expanded state:
  - [ ] List of time entries
  - [ ] Entry details: time range, client, project, duration
  - [ ] Edit button (pencil icon)
- [ ] "Add Report" button per day
- **Validation**: Month history displays correctly, badges work

---

### 🏢 MEMBER 3: Entity Management

**Feature Owner**: Clients, Projects, Tasks, Assignments CRUD (full-stack)

#### TASK-M3-010: Clients Backend (Per `doc/api/API.md` Section 3)
- [x] Create `backend/src/routes/admin/Clients.ts`
- [x] Implement `GET /api/admin/clients`:
  - [x] Return all clients (filter active by default)
- [x] Implement `POST /api/admin/clients`:
  - [x] Zod schema: `{ name, description? }`
  - [x] Return: `{ success: true, data: { id } }`
- [x] Implement `PUT /api/admin/clients/:id`:
  - [x] Zod schema: `{ name?, description?, active? }`
- [x] Implement `DELETE /api/admin/clients/:id`:
  - [x] Soft delete: set `active = false`
- **Validation**: Clients CRUD works

#### TASK-M3-011: Projects Backend (Per `doc/api/API.md` Section 4)
- [x] Create `backend/src/routes/admin/Projects.ts`
- [x] Implement `GET /api/admin/projects`:
  - [x] Query param: `clientId` (optional filter)
- [x] Implement `POST /api/admin/projects`:
  - [x] Zod schema: `{ name, clientId, projectManagerId, startDate, endDate?, description? }`
- [x] Implement `PUT /api/admin/projects/:id`
- [x] Implement `DELETE /api/admin/projects/:id`:
  - [x] Soft delete
- **Validation**: Projects CRUD works, filtering by client works

#### TASK-M3-012: Tasks Backend (Per `doc/api/API.md` Section 5)
- [x] Create `backend/src/routes/admin/Tasks.ts`
- [x] Implement `GET /api/admin/tasks`:
  - [x] Query param: `projectId` (optional filter)
- [x] Implement `POST /api/admin/tasks`:
  - [x] Zod schema: `{ name, projectId, startDate?, endDate?, description?, status }`
- [x] Implement `PUT /api/admin/tasks/:id`
- [x] Implement `DELETE /api/admin/tasks/:id`:
  - [x] Soft delete (hide inactive by default)
- **Validation**: Tasks CRUD works, filtering by project works

#### TASK-M3-013: Assignments Backend (Per `doc/api/API.md` Section 6)
- [x] Create `backend/src/routes/admin/Assignments.ts`
- [x] Implement `POST /api/admin/assignments`:
  - [x] Zod schema: `{ userId, taskId }`
  - [x] Create TaskWorker record
  - [x] Return: `{ success: true, data: { id, taskId, userId } }`
  - [x] Trigger cache refresh for project selector
- [x] Implement `GET /api/admin/assignments`:
  - [x] Return all assignments
- [x] Implement `DELETE /api/admin/assignments/:id`:
  - [x] Delete TaskWorker record
- **Validation**: Assignments CRUD works

#### TASK-M3-020: Clients UI (Admin App)
- [ ] Create `frontend_admin/src/components/Clients/ClientsTable.tsx`
- [ ] Create `frontend_admin/src/hooks/useClients.ts`
- [ ] Create `components/Clients/ClientForm.tsx` modal:
  - [ ] Fields: name, description
- [ ] Implement CRUD with TanStack Query mutations
- **Validation**: Admin can manage clients

#### TASK-M3-021: Projects UI (Admin App)
- [ ] Create `frontend_admin/src/components/Projects/ProjectsTable.tsx`
- [ ] Create `frontend_admin/src/hooks/useProjects.ts`
- [ ] Create `components/Projects/ProjectForm.tsx` modal:
  - [ ] Fields: name, client (dropdown), projectManager (dropdown), startDate, endDate, description
- [ ] Add filtering by client
- **Validation**: Admin can manage projects

#### TASK-M3-022: Tasks UI (Admin App)
- [ ] Create `frontend_admin/src/components/Tasks/TasksTable.tsx`
- [ ] Create `frontend_admin/src/hooks/useTasks.ts`
- [ ] Create `components/Tasks/TaskForm.tsx` modal:
  - [ ] Fields: name, project (dropdown), startDate, endDate, description, status
- [ ] Add filtering by project
- **Validation**: Admin can manage tasks

#### TASK-M3-023: Assignments UI (Admin App)
- [ ] Create `frontend_admin/src/components/Assignments/AssignmentsTable.tsx`
- [ ] Create `frontend_admin/src/hooks/useAssignments.ts`
- [ ] Create `components/Assignments/AssignmentForm.tsx` modal:
  - [ ] User dropdown
  - [ ] Task dropdown (show project name for context)
- [ ] Display assignments with user name and task name (joined data)
- **Validation**: Admin can assign users to tasks

---

### ⚡ MEMBER 4: Advanced Features

**Feature Owner**: Timer, Month Locking, File Upload (full-stack)

#### TASK-M4-010: Timer Backend
- [ ] Create `backend/src/services/Timer.ts`:
  - [ ] In-memory Map: `userId → { startTime, taskId }`
  - [ ] `startTimer(userId, taskId)` function
  - [ ] `stopTimer(userId)` function → returns duration
- [ ] Create `backend/src/routes/Timer.ts`:
  - [ ] `POST /api/timer/start`: Start timer for taskId
  - [ ] `POST /api/timer/stop`: Stop timer, create DailyAttendance
  - [ ] `GET /api/timer/status`: Get current timer status
- [ ] Create `backend/src/jobs/TimerAutoStop.ts`:
  - [ ] Cron job at 23:59 daily (use node-cron)
  - [ ] Find all running timers
  - [ ] Auto-stop and save with appropriate status
- **Validation**: Timer start/stop works, auto-stop at midnight works

#### TASK-M4-011: (DEFERRED) Month Lock Backend
> **Note**: Month Lock feature is deferred for later implementation. Will be added in a future sprint.

#### TASK-M4-012: File Upload Backend
- [ ] Create `backend/src/middleware/FileUpload.ts`:
  - [ ] Configure Multer
  - [ ] File size limit: 5MB
  - [ ] File types: .pdf, .jpg, .png only
  - [ ] Return 413 `FILE_TOO_LARGE` if > 5MB
  - [ ] Return 415 `UNSUPPORTED_FILE_TYPE` if wrong format
- [ ] Implement `POST /api/attendance/:id/upload`:
  - [ ] Accept multipart/form-data
  - [ ] Convert file to Buffer
  - [ ] Store as Bytes in DailyAttendance.document field
- [ ] Implement `GET /api/attendance/:id/document`:
  - [ ] Return file from Bytes field
  - [ ] Set correct Content-Type header
- **Validation**: File upload works, validations block invalid files

#### TASK-M4-020: Timer UI (User App)
- [ ] Create `frontend_user/src/components/Timer/TimerComponent.tsx`:
  - [ ] Start/Stop button
  - [ ] Timer display (HH:MM:SS format)
  - [ ] Task selection dropdown
- [ ] Create `hooks/useTimer.ts`:
  - [ ] `useMutation` for start/stop
  - [ ] `useQuery` for status
- [ ] Implement timer display:
  - [ ] Calculate elapsed time with Day.js
  - [ ] Update every second with setInterval
  - [ ] Format as HH:MM:SS
- [ ] Handle auto-stop notification
- [ ] Persist timer state in localStorage (optional)
- **Validation**: Timer works, display updates

#### TASK-M4-021: Dashboard UI (User App)
- [ ] Create `frontend_user/src/components/Dashboard/ProgressBar.tsx`:
  - [ ] Mantine Progress component
  - [ ] Calculate: current hours / 9 hours
  - [ ] Color: <9h yellow, 9h green, >9h red
- [ ] Calculate total hours for current day:
  - [ ] Query today's ProjectTimeLogs
  - [ ] Sum duration in minutes
  - [ ] Convert to hours
- [ ] Add alerts (Mantine Notification):
  - [ ] Warning for <9h
  - [ ] Warning for >9h
- **Validation**: Progress bar shows correct progress

#### TASK-M4-022: (DEFERRED) Month Lock UI (Admin App)
> **Note**: Month Lock UI is deferred for later implementation. Will be added in a future sprint.

#### TASK-M4-023: Absence Upload UI (User App)
- [ ] Create `frontend_user/src/components/Absence/AbsenceUpload.tsx`:
  - [ ] Status selection: sickness, reserves, dayOff, halfDayOff
  - [ ] File upload component (Mantine FileInput)
  - [ ] File preview
  - [ ] File type/size validation on frontend
- [ ] Integrate with DailyAttendance creation
- **Validation**: Absence with document upload works

#### TASK-M4-030: Reporting Settings UI - "הגדרת דיווחי שעות" (Admin App)

> **Dependency**: Member 3 must add `reportingType` field to Project model and implement `PATCH /api/admin/projects/:id` endpoint first.  
> **Coordination Doc**: See `COORDINATION_MEMBER_3.md`

**Purpose**: Allow admins to configure how workers report time per project - either via Start/End times (כניסה/יציאה) or Total Duration (סכום שעות).

##### Frontend Types & Utilities
- [x] 30.1 Update/Create shared types in `frontend_admin/src/types/Project.ts`:
  - [x] Add `ReportingType` type: `'duration' | 'startEnd'`
  - [x] Update `Project` interface to include `reportingType` field
- [x] 30.2 Extend API client in `frontend_admin/src/utils/ApiClient.ts`:
  - [x] Add `patchProjectReportingType(projectId: number, reportingType: ReportingType)` method

##### Page & Layout
- [x] 30.3 Create `frontend_admin/src/pages/ReportingSettingsPage.tsx`:
  - [x] Page container with RTL layout
  - [x] Page title: "הגדרת דיווחי שעות"
  - [x] Page subtitle: "כאן תוכל להגדיר את סוג דיווחי השעות של העובדים בפרויקטים השונים"
  - [x] Integrate search bar component (placeholder - will be implemented in 30.8)
  - [x] Integrate settings table component (placeholder - will be implemented in 30.6)
  - [x] Integrate pagination component (placeholder - will be implemented in 30.10)
- [x] 30.4 Add route `/settings/reporting` in React Router config

##### Data Fetching Hook
- [x] 30.5 Create `frontend_admin/src/hooks/useReportingSettings.ts`:
  - [x] `useQuery` for `GET /api/admin/projects` (with Client data joined)
  - [x] `useMutation` for `PATCH /api/admin/projects/:id` (reportingType update)
  - [x] Optimistic update: update local state immediately on radio change
  - [x] Rollback on error
  - [x] Invalidate queries on success

##### Table Component
- [x] 30.6 Create `frontend_admin/src/components/ReportingSettings/ReportingSettingsTable.tsx`:
  - [x] Mantine Table component with RTL support
  - [x] Columns:
    - [x] שם לקוח (Client Name)
    - [x] שם פרויקט (Project Name)
    - [x] סוג הדיווח (Reporting Type) - Radio buttons
  - [x] Display Client name by joining Project → Client data
  - [x] Row styling per design

##### Radio Button Toggle Component
- [x] 30.7 Create `frontend_admin/src/components/ReportingSettings/ReportingTypeToggle.tsx`:
  - [x] Mantine Radio.Group component
  - [x] Two options:
    - [x] "סכום שעות" (duration) - Total Hours
    - [x] "כניסה / יציאה" (startEnd) - Start/End Times (Default)
  - [x] `onChange` handler triggers immediate API call
  - [x] Visual indicator for selected state (filled vs empty circle per UI)
  - [x] Disabled state while saving

##### Search & Filter
- [x] 30.8 Create `frontend_admin/src/components/ReportingSettings/ReportingSettingsSearch.tsx`:
  - [x] Mantine TextInput with search icon
  - [x] Placeholder: "חיפוש לפי שם לקוח/פרויקט"
  - [x] Debounced input (300ms)
- [x] 30.9 Implement filter logic in page component:
  - [x] Filter by Client name OR Project name (case-insensitive)
  - [x] Use `useMemo` for filtered results

##### Pagination
image.png- [x] 30.10 Create `frontend_admin/src/components/ReportingSettings/ReportingSettingsPagination.tsx`:
  - [x] Mantine Pagination component
  - [x] Items per page: 10 (configurable)
  - [x] Display: page numbers with arrows
  - [x] RTL layout (arrows direction)
- [x] 30.11 Implement pagination logic:
  - [x] Calculate total pages from filtered results
  - [x] Slice data for current page

##### Loading & Error States
- [x] 30.12 Add loading skeleton while fetching projects
- [x] 30.13 Add error state with retry button
- [x] 30.14 Add toast notification on successful save
- [x] 30.15 Add toast notification on save error

##### Navigation Integration
- [x] 30.16 Add sidebar menu item "הגדרת דיווחי שעות" in Admin app navigation
- [x] 30.17 Add icon for the menu item (clock/settings icon)

##### UI Polish & Backend Integration
- [x] 30.18 UI Polish and Refinement:
  - [x] Styled sidebar with #141e3e background, proper dimensions (280px width)
  - [x] Added abraLogo_inverted.png to sidebar header
  - [x] Styled table with correct row heights (header: 36px, data rows: 48px)
  - [x] Added column borders for visual separation
  - [x] Implemented search bar with correct dimensions (350px width, 40px height)
  - [x] Added empty state with web_empty_list.png image
  - [x] Applied SimplerPro font family throughout all components
  - [x] Added hover effects for navigation buttons (#4a6fa5)
  - [x] Added admin profile section with bottom_logo.png and dynamic name from localStorage
  - [x] Verified RTL layout works correctly in all states
  - [x] Ensured page fits within 1080px height without vertical scrolling
  - [x] Removed hover effect from table rows
  - [x] Configured toast notifications to auto-close after 3 seconds

- [x] 30.19 Remove Mock Data and Connect Real Backend:
  - [x] **Prerequisite**: Member 3 completes `GET /api/admin/projects` endpoint (Task M3-011)
  - [x] **Prerequisite**: Member 3 completes `PATCH /api/admin/projects/:id` endpoint
  - [x] **Prerequisite**: Member 3 completes `GET /api/admin/clients` endpoint
  - [x] Created `frontend_admin/src/types/Client.ts` with Client interface
  - [x] In `frontend_admin/src/hooks/useReportingSettings.ts`:
    - [x] Removed mock data array from queryFn
    - [x] Implemented real API calls to fetch both projects and clients in parallel
    - [x] Joined projects with clients on frontend using clientId
    - [x] Backend returns only active projects (no frontend filtering needed)
    - [x] Removed mock mutation function
    - [x] Implemented real API call: `apiClient.patchProjectReportingType(projectId, reportingType)`
    - [x] Uncommented imports for apiClient and sharedApiClient
    - [x] Uncommented `queryClient.invalidateQueries({ queryKey })` in onSuccess
    - [x] Removed console.log statements from mock code
  - [ ] Test end-to-end with real backend:
    - [ ] Verify projects load from database
    - [ ] Verify reporting type updates persist to database
    - [ ] Verify optimistic updates still work correctly
    - [ ] Verify error handling works with real API errors

- **Validation**:
  - Admin can view all projects with their current reporting type
  - Admin can search by client or project name
  - Clicking radio button immediately saves to database
  - Pagination works correctly
  - Error handling shows appropriate messages

---

## Phase 2: Integration & Testing

#### TASK-INT-001: API Integration Testing (All Members)
- [ ] Test all endpoints with Postman/Insomnia
- [ ] Verify response formats match `doc/api/API.md`
- [ ] Test error cases (401, 403, 404, 409, 413, 415)

#### TASK-INT-002: Frontend Integration (All Members)
- [ ] Connect all UIs to backend APIs
- [ ] Test full user flows end-to-end
- [ ] Fix RTL layout issues

#### TASK-INT-003: Unit Tests (All Members - 60% Coverage Target)
- [ ] Member 1: Test auth endpoints, user CRUD
- [ ] Member 2: Test attendance, time logs, project selector
- [ ] Member 3: Test entity CRUD endpoints
- [ ] Member 4: Test timer, month lock, file upload

---

## Phase 3: Nice to Have (If Time Permits)

| Member | Feature | Tasks |
|--------|---------|-------|
| Member 1 | Password Strength | Add Zod validation, confirmation field |
| Member 2 | Past Month Reports | Add year selector, support 1 year back |
| Member 3 | Advanced Filtering | Add search, pagination to tables |
| Member 4 | UI Polish | Hebrew translations, loading skeletons |

---

## Task Dependencies Graph

```
Phase 0 (Shared Setup) - ALL MEMBERS
    │
    ├──→ TASK-M1-010 (Auth Backend) ─────────────────────────────────┐
    │         │                                                       │
    │         └──→ TASK-M1-020 (Login UI) ←─── REQUIRED BY ALL       │
    │                                                                 │
    ├──→ TASK-M2-010 (Attendance Backend) ──→ TASK-M2-020 (Report UI)│
    │         │                                                       │
    │         └──→ TASK-M2-012 (Selector Backend) ──→ TASK-M2-021    │
    │                                                                 │
    ├──→ TASK-M3-010/011/012/013 (Entity Backend) ──→ TASK-M3-020+   │
    │                                                                 │
    └──→ TASK-M4-010/011/012 (Advanced Backend) ──→ TASK-M4-020+     │
```

**Critical Path**: Phase 0 → M1 Auth Backend → M1 Login UI → All features parallel

---

## File Ownership Map (Avoid Merge Conflicts)

### Member 1: Auth + User Management
```
backend/src/
├── routes/Auth.ts
├── routes/admin/Users.ts
├── middleware/Auth.ts
├── utils/Bcrypt.ts
├── utils/AppError.ts
└── utils/validationSchemas.ts

shared/src/
├── types/User.ts
├── context/AuthContext.tsx
├── hooks/useAuth.ts
├── hooks/useLogin.ts
├── components/Login/LoginPage.tsx
└── components/ProtectedRoute/ProtectedRoute.tsx

frontend_user/src/
├── App.tsx (routing setup)
└── main.tsx (NotificationsProvider setup)

frontend_admin/src/
├── components/Users/UsersTable.tsx
├── components/Users/UserForm.tsx
├── components/Users/ResetPasswordModal.tsx
├── hooks/useUsers.ts
├── App.tsx (routing setup)
└── main.tsx (NotificationsProvider setup)
```

### Member 2: Time Reporting
```
backend/src/
├── routes/Attendance.ts
├── routes/TimeLogs.ts
├── routes/Projects.ts (selector endpoint)
├── services/ProjectSelector.ts
└── services/Cache.ts

frontend_user/src/
├── components/DailyReport/DailyReportEntry.tsx
├── components/DailyReport/ProjectReport.tsx
├── components/MonthHistory/MonthHistoryReport.tsx
├── components/ProjectSelector/SmartProjectSelector.tsx
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
├── components/Clients/ClientsTable.tsx
├── components/Clients/ClientForm.tsx
├── components/Projects/ProjectsTable.tsx
├── components/Projects/ProjectForm.tsx
├── components/Tasks/TasksTable.tsx
├── components/Tasks/TaskForm.tsx
├── components/Assignments/AssignmentsTable.tsx
├── components/Assignments/AssignmentForm.tsx
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
├── middleware/FileUpload.ts
└── jobs/TimerAutoStop.ts

frontend_user/src/
├── components/Timer/TimerComponent.tsx
├── components/Dashboard/ProgressBar.tsx
├── components/Absence/AbsenceUpload.tsx
└── hooks/useTimer.ts
```

---

## Sprint Plan (8 Weeks)

### Sprint 1 (Week 1-2): Foundation + Auth
| Member | Focus | Deliverable |
|--------|-------|-------------|
| All | Phase 0 | Database ready, apps configured |
| Member 1 | Auth Backend + Login UI | Login works in both apps |
| Member 2 | Attendance Backend | Basic API ready |
| Member 3 | Clients Backend | Clients API ready |
| Member 4 | Timer + File Upload Backend | Timer API, File Upload ready |

### Sprint 2 (Week 3-4): Core Features
| Member | Focus | Deliverable |
|--------|-------|-------------|
| Member 1 | User Management (full-stack) | Admin can manage users |
| Member 2 | Time Reporting (full-stack) | Users can report time |
| Member 3 | Entity Management (full-stack) | Admin can manage entities |
| Member 4 | Timer + Dashboard | Timer works |

### Sprint 3 (Week 5-6): Advanced + Integration
| Member | Focus | Deliverable |
|--------|-------|-------------|
| Member 1 | Integration testing | Auth fully tested |
| Member 2 | Month History UI | Full reporting flow |
| Member 3 | Assignments UI | Full entity management |
| Member 4 | Dashboard + Absence UI | All advanced features |

### Sprint 4 (Week 7-8): Polish + Testing
| Member | Focus | Deliverable |
|--------|-------|-------------|
| All | Unit tests, bug fixes, polish | Production-ready app |
