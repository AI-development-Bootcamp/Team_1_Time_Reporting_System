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
- [ ] Create `backend/src/routes/Auth.ts`
- [ ] Create `backend/src/middleware/Auth.ts` - JWT validation middleware
- [ ] Create `backend/src/utils/Bcrypt.ts` - Password hashing
- [ ] Implement `POST /api/auth/login`:
  - [ ] Zod schema: `{ mail: string, password: string }`
  - [ ] Validate credentials against database
  - [ ] Compare password hash using bcrypt
  - [ ] Generate JWT token (24h expiry)
  - [ ] Return: `{ success: true, data: { token, expiresInHours: 24, user } }`
  - [ ] Exclude password from user response
- [ ] Error handling:
  - [ ] 400 `VALIDATION_ERROR` for missing/invalid fields
  - [ ] 401 `UNAUTHORIZED` for wrong credentials
- **Validation**: Login returns JWT, invalid credentials return 401

#### TASK-M1-011: User CRUD Backend (Per `doc/api/API.md` Section 2)
- [ ] Create `backend/src/routes/admin/Users.ts`
- [ ] Add admin role check middleware (`userType === 'admin'`)
- [ ] Implement `GET /api/admin/users`:
  - [ ] Query param: `active` (boolean, optional)
  - [ ] Filter by active status, default to all
  - [ ] Return user list (exclude passwords)
- [ ] Implement `POST /api/admin/users`:
  - [ ] Zod schema: `{ name, mail, password, userType }`
  - [ ] Hash password before saving
  - [ ] Return: `{ success: true, data: { id } }`
  - [ ] 409 `CONFLICT` if mail already exists
- [ ] Implement `PUT /api/admin/users/:id`:
  - [ ] Zod schema: `{ name?, mail?, password?, userType?, active? }`
  - [ ] Hash password if provided
  - [ ] Return: `{ success: true, data: { updated: true } }`
- [ ] Implement `DELETE /api/admin/users/:id`:
  - [ ] Soft delete: set `active = false`
  - [ ] Return: `{ success: true, data: { deleted: true } }`
- [ ] Implement `POST /api/admin/users/:id/reset-password`:
  - [ ] Zod schema: `{ newPassword }`
  - [ ] Hash and update password
  - [ ] Return: `{ success: true, data: { updated: true } }`
- **Validation**: All CRUD works, soft delete filters correctly

#### TASK-M1-020: Login UI (Both Apps)
- [ ] Create `frontend_user/src/components/Login/LoginPage.tsx`
- [ ] Create `frontend_admin/src/components/Login/LoginPage.tsx`
- [ ] Implement login form with Mantine:
  - [ ] TextInput for mail
  - [ ] PasswordInput for password
  - [ ] Button for submit
  - [ ] Use `@mantine/form` with `getInputProps`
- [ ] Create `context/AuthContext.tsx` in both apps:
  - [ ] Store JWT token in localStorage
  - [ ] Store user info in state
  - [ ] Provide `login()`, `logout()`, `isAuthenticated` functions
- [ ] Create `components/ProtectedRoute.tsx`:
  - [ ] Redirect to login if not authenticated
  - [ ] Admin app: also check `userType === 'admin'`
- [ ] Create `hooks/useAuth.ts` for easy access to auth context
- [ ] Update `utils/ApiClient.ts` to include `Authorization: Bearer <token>` header
- [ ] Setup routing with React Router:
  - [ ] `/login` - public
  - [ ] `/` - protected (redirects to login if not auth)
- **Validation**: Users can login, token persists on refresh, protected routes work

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

---

#### 🔐 AUTH REQUIREMENTS FOR ALL MEMBER 2 ENDPOINTS

**IMPORTANT**: All Member 2 endpoints MUST only allow valid, authenticated users.

| Endpoint | Auth Required | Ownership Check |
|----------|---------------|-----------------|
| `POST /api/attendance` | ✅ Yes | User can only create for themselves |
| `POST /api/attendance/combined` | ✅ Yes | User can only create for themselves |
| `GET /api/attendance/month-history` | ✅ Yes | User can only view their own data |
| `PUT /api/attendance/:id` | ✅ Yes | User can only update their own attendance |
| `POST /api/time-logs` | ✅ Yes | Attendance must belong to user |
| `GET /api/time-logs` | ✅ Yes | Attendance must belong to user |
| `PUT /api/time-logs/:id` | ✅ Yes | Time log must belong to user's attendance |
| `DELETE /api/time-logs/:id` | ✅ Yes | Time log must belong to user's attendance |
| `GET /api/projects/selector` | ✅ Yes | Returns only user's assigned projects |

**Implementation Requirements:**
1. Apply `authMiddleware` to all routes (after Member 1 completes TASK-M1-010)
2. Use `req.user.id` instead of `userId` from request body/query
3. Validate that the user exists in the `users` table
4. Enforce ownership: users can only access/modify their own data
5. Return `401 Unauthorized` if no valid token
6. Return `403 Forbidden` if trying to access another user's data

**Current State**: Endpoints work without auth for development/testing. Auth integration is pending Member 1's TASK-M1-010.

---

#### TASK-M2-010: Attendance Backend (Per `doc/api/API.md` Section 7)
- [x] Create `backend/src/routes/Attendance.ts`
- [x] Wire Attendance routes in `backend/src/index.ts`
- [x] Add Zod schemas for create/update/query:
  - [x] Body: `{ date, startTime (HH:mm), endTime (HH:mm), status, userId }`
  - [x] Query: `{ month, userId }`
- [x] Implement `POST /api/attendance` basics:
  - [x] Validate: `endTime > startTime` when both provided
  - [x] Create DailyAttendance record
  - [x] Return: `{ success: true, data: { id } }`
- [x] Enforce frontend validations on backend (create):
  - [x] Required fields present (date, status, times for work)
  - [x] No overlap with existing attendance ranges on same date
  - [x] Return `VALIDATION_ERROR` on failure
- [x] Add no-overlap validation on create:
  - [x] Block if attendance time range overlaps another record on same date
- [x] Implement `GET /api/attendance/month-history`:
  - [x] Query params: `month` (1-12, required), `userId` (required)
  - [x] Use current year automatically
  - [x] Return array of DailyAttendance objects with nested projectTimeLogs
- [x] Implement `PUT /api/attendance/:id` basics:
  - [x] Update DailyAttendance record
  - [x] Re-run no-overlap validation (exclude current record)
- [x] Enforce frontend validations on backend (update):
  - [x] `endTime > startTime` when both provided
  - [x] Total ProjectTimeLogs minutes >= attendance duration
  - [x] Return `VALIDATION_ERROR` on failure
- [x] Add duration-vs-logs validation helper:
  - [x] When attendance has start/end, ensure total ProjectTimeLogs minutes >= attendance duration
  - [x] Use on attendance update when time range changes
- [x] Add backend save workflow rules:
  - [x] Expose a helper to validate overlap + duration before writes
  - [x] Exported helpers for TimeLogs route to use
- [x] **Note**: No DELETE endpoint - records are edited, not deleted
- [x] Tests (backend):
  - [x] Unit: overlap validation, duration calculation, query parsing (`backend/src/routes/Attendance.test.ts`)
  - [x] Integration: create/update attendance with valid/invalid times (`backend/tests/integration/attendance.test.ts`)
  - [x] Integration: overlap rejection on same date
  - [x] Integration: duration-vs-logs rejection on update
- [ ] **Auth integration (after TASK-M1-010):**
  - [ ] Apply auth middleware to Attendance routes
  - [ ] Use `req.user.id` instead of `userId` from request body/query
  - [ ] Enforce ownership on GET (month-history only returns authenticated user data)
  - [ ] Enforce ownership on update (attendance belongs to authenticated user)
  - [ ] Update tests to include auth (token or mocked user context)
- **Coverage Achieved**: 99% statements, 93% branches for Attendance route (exceeds 60% target)
- **Validation**: Attendance CRUD works, overlap blocked, duration-vs-logs enforced

#### TASK-M2-011: Time Logs Backend (Per `doc/api/API.md` Section 8)
- [x] Create `backend/src/routes/TimeLogs.ts`
- [x] Wire TimeLogs routes in `backend/src/index.ts` (via `app.ts`)
- [x] Add Zod schemas for create/update/query:
  - [x] Body: `{ dailyAttendanceId, taskId, duration, location, description? }`
  - [x] Query: `{ dailyAttendanceId }`
- [x] Implement `POST /api/time-logs` basics:
  - [x] Map `duration` (minutes) → `durationMin`
  - [x] Enforce required `location` (office/client/home)
  - [x] Create ProjectTimeLogs record
  - [x] Return: `{ success: true, data: { id } }`
- [x] Enforce frontend validations on backend:
  - [x] `duration` is positive integer minutes
  - [x] Required fields present (dailyAttendanceId, taskId, location)
  - [x] Return `VALIDATION_ERROR` on failure
- [x] Validate attendance exists before creating time log
- [x] Validate task exists before creating time log
- [x] Allow overlapping time logs (per API spec)
- [x] Implement `GET /api/time-logs?dailyAttendanceId=X`
  - [x] Return flat list (no nested task/project/client)
- [x] Implement `PUT /api/time-logs/:id`
- [x] Implement `DELETE /api/time-logs/:id`
- [x] Re-check attendance duration rule after log create/update/delete:
  - [x] Block if total logs would become < attendance duration
- [x] Return `NOT_FOUND` when attendance or task does not exist
- [ ] Return `MONTH_LOCKED` when attendance date is locked (pending month-locking feature)
- [x] Add backend guard to prevent partial saves in combined flow:
  - [x] If a log mutation fails, return error without leaving inconsistent totals
- [ ] **Auth integration (after TASK-M1-010):**
  - [ ] Apply auth middleware to Time Logs routes
  - [ ] Enforce ownership on POST (dailyAttendance belongs to authenticated user)
  - [ ] Enforce ownership on GET (only return logs for user attendance)
  - [ ] Enforce ownership on update/delete (log belongs to authenticated user)
  - [ ] Update tests to include auth (token or mocked user context)
- [x] Tests (backend):
  - [x] Unit: duration mapping and validation, location validation (`backend/src/routes/TimeLogs.test.ts`)
  - [x] Integration: create/update/delete time logs (`backend/tests/integration/timeLogs.test.ts`)
  - [x] Integration: duration-vs-logs rejection on delete/update
- **Coverage Achieved**: 97% statements, 93% branches for TimeLogs route (exceeds 60% target)
- **Validation**: Time logs work, multiple entries allowed, location required

#### TASK-M2-011A: Combined Attendance + Time Logs Save (Atomic Flow) ✅ COMPLETED

**Purpose**: Create atomic endpoint for saving work attendance + time logs together (no partial saves)

**Status**: ✅ COMPLETED - All 167 tests passing (14 new tests for combined save)

**API Endpoint**: `POST /api/attendance/combined`

- [x] Define request schema for combined save:
  ```typescript
  {
    userId: number;           // (Will be from auth token later)
    date: string;             // "YYYY-MM-DD"
    startTime: string;        // "HH:mm"
    endTime: string;          // "HH:mm"
    status: "work";           // Only work status uses combined endpoint
    timeLogs: Array<{
      taskId: number;
      duration: number;       // minutes (for duration-based projects)
      startTime?: string;     // "HH:mm" (for startEnd-based projects)
      endTime?: string;       // "HH:mm" (for startEnd-based projects)
      location: "office" | "client" | "home";
      description?: string;
    }>;
  }
  ```
- [x] Define response schema:
  ```typescript
  { success: true, data: { attendanceId: string, timeLogIds: string[] } }
  ```
- [x] Create `backend/src/services/CombinedAttendanceService.ts` service:
  - [x] Use Prisma `$transaction` for atomic operations
  - [x] Validation Step 1: Check no exclusive status exists on date (dayOff/sickness/reserves)
  - [x] Validation Step 2: Validate time range (`endTime > startTime`)
  - [x] Validation Step 3: Validate no midnight crossing (`endTime <= 23:59`)
  - [x] Validation Step 4: Check no overlap with existing work/halfDayOff attendances
  - [x] Validation Step 5: Calculate attendance duration in minutes
  - [x] Validation Step 6: Validate each time log (duration > 0, task exists, location valid)
  - [x] Validation Step 7: Calculate total logs duration based on project reportingType
  - [x] Validation Step 8: Validate `sumOfTimeLogs >= attendanceDuration`
  - [x] Create Step 1: Create DailyAttendance record
  - [x] Create Step 2: Create all ProjectTimeLogs records with returned attendanceId
  - [x] Return IDs on success, rollback entire transaction on any failure
- [x] Add route handler in `backend/src/routes/attendance.routes.ts`:
  - [x] `POST /api/attendance/combined` calls CombinedAttendance service
  - [x] Returns standard response envelope
- [x] Keep `POST /api/attendance` for non-work statuses (halfDayOff/dayOff/sickness/reserves)
- [x] Tests (backend):
  - [x] Integration: success path creates attendance + logs atomically
  - [x] Integration: failure in time log validation rejects entire operation
  - [x] Integration: duration-vs-logs failure rolls back all inserts
  - [x] Integration: exclusive status blocks creation
  - [x] Integration: overlap with existing work attendance blocks creation
  - [x] Integration: time range validation (endTime > startTime)
- **Coverage Target**: ≥60% for combined save service + route ✅
- **Validation**: "Save" only succeeds when all validations pass and logs sum >= attendance duration ✅
- [ ] **Auth integration (after TASK-M1-010):**
  - [ ] Apply auth middleware to combined endpoint
  - [ ] Use `req.user.id` instead of `userId` from request body
  - [ ] Validate user exists in database before creating records
  - [ ] Update tests to include auth (token or mocked user context)

---

#### TASK-M2-011B: Schema Changes for Time Logs (startTime/endTime columns) ✅ COMPLETED

**Purpose**: Add startTime/endTime columns to ProjectTimeLogs for projects with reportingType=startEnd

**Status**: ✅ COMPLETED - All 153 tests passing (10 new tests for reporting types)

- [x] Update Prisma schema - add to `ProjectTimeLogs` model:
  ```prisma
  model ProjectTimeLogs {
    // ... existing fields ...
    durationMin   Int               // Always stored (required, calculated or entered)
    startTime     DateTime? @db.Time  // NULL if project reportingType=duration
    endTime       DateTime? @db.Time  // NULL if project reportingType=duration
    // ... rest of fields ...
  }
  ```
- [x] Create migration: `npx prisma migrate dev --name add_timelog_start_end`
- [x] Update `POST /api/time-logs` to handle both reportingTypes:
  - [x] Get task's project to check `reportingType`
  - [x] If `reportingType = startEnd`:
    - [x] Require startTime and endTime in request
    - [x] Validate `endTime > startTime`
    - [x] Validate no midnight crossing (`endTime <= 23:59`)
    - [x] Calculate `durationMin` from endTime - startTime
    - [x] Store all three: startTime, endTime, durationMin
  - [x] If `reportingType = duration`:
    - [x] Require duration in request
    - [x] Store durationMin, set startTime/endTime to NULL
- [x] Update `PUT /api/time-logs/:id` to handle reportingType:
  - [x] Check project's current reportingType (may have changed since creation)
  - [x] If `reportingType = startEnd`: require startTime/endTime, recalculate duration
  - [x] If `reportingType = duration`: accept duration, set startTime/endTime to NULL
- [x] Update Zod schemas (already had optional startTime/endTime):
  ```typescript
  const createTimeLogSchema = z.object({
    dailyAttendanceId: z.bigint(),
    taskId: z.bigint(),
    duration: z.number().int().positive().optional(),  // For duration-based
    startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),  // For startEnd-based
    endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),    // For startEnd-based
    location: z.enum(['office', 'client', 'home']),
    description: z.string().optional(),
  });
  ```
- [x] Tests (backend):
  - [x] Unit: duration calculation from startTime/endTime
  - [x] Integration: create time log for startEnd project stores all 3 fields
  - [x] Integration: create time log for duration project stores only durationMin
  - [x] Integration: update time log when project type changed (duration→startEnd)
  - [x] Integration: midnight crossing validation for startEnd projects
- **Coverage Target**: ≥60% for updated time log endpoints ✅
- **Validation**: Time logs correctly handle both project reporting types ✅

---

#### TASK-M2-011C: Non-Work Status Handling (halfDayOff/dayOff/sickness/reserves) ✅ COMPLETED

**Purpose**: Handle attendance creation/update for non-work statuses with proper validation

**Status**: ✅ COMPLETED - All 181 tests passing (14 new tests for status handling)

**Status Rules**:
| Status | Exclusive? | Requires Times? | Requires Time Logs? | Requires Document? |
|--------|------------|-----------------|---------------------|-------------------|
| `work` | No | Yes | Yes (sum >= duration) | No |
| `halfDayOff` | No | No (NULL) | No | No |
| `dayOff` | Yes | No (NULL) | No | No |
| `sickness` | Yes | No (NULL) | No | Soft (badge=missing if null) |
| `reserves` | Yes | No (NULL) | No | Soft (badge=missing if null) |

- [x] Update `POST /api/attendance` for non-work statuses:
  - [x] Accept: `{ userId, date, status, document? }` (no startTime/endTime)
  - [x] For `halfDayOff`:
    - [x] Check no exclusive status exists on date (dayOff/sickness/reserves)
    - [x] Allow coexistence with work attendances
    - [x] Store with startTime=NULL, endTime=NULL
  - [x] For exclusive statuses (`dayOff`, `sickness`, `reserves`):
    - [x] Check NO other attendance exists on this date (any status)
    - [x] Store with startTime=NULL, endTime=NULL
    - [x] For sickness/reserves: document is optional (can be NULL, frontend shows "missing" badge)
- [x] Update `PUT /api/attendance/:id` for status changes:
  - [x] **Work → Non-work**: Block if time logs exist (require delete logs first)
  - [x] **Non-work → Work**: Require startTime/endTime in request
  - [x] **Work → Work**: Validate times, overlap, and logs sum
  - [x] **Exclusive → Any**: Check new status rules allow the change
  - [x] **Any → Exclusive**: Check no other records exist on date
  - [x] **halfDayOff ↔ Work**: Validate coexistence rules
- [x] Update validation helpers:
  - [x] `checkExclusiveStatusExists(userId, date, excludeId?)` - returns status if dayOff/sickness/reserves exists
  - [x] `checkAnyAttendanceExists(userId, date, excludeId?)` - returns true if any attendance exists
  - [x] `getTimeLogsCount(attendanceId)` - returns count of time logs
- [x] Error messages:
  - [x] `"Cannot add work attendance - exclusive status (dayOff/sickness/reserves) already exists on this date"`
  - [x] `"Cannot add {status} - other attendance already exists on this date"`
  - [x] `"Cannot change to {status} status while time logs exist ({count} logs). Delete time logs first."`
- [x] Tests (backend):
  - [x] Integration: create halfDayOff alongside work attendance (allowed)
  - [x] Integration: create dayOff when work exists (blocked)
  - [x] Integration: create work when dayOff exists (blocked)
  - [x] Integration: change work→halfDayOff with time logs (blocked)
  - [x] Integration: change work→halfDayOff after deleting time logs (allowed)
  - [x] Integration: sickness without document saves successfully (frontend handles badge)
- **Coverage Target**: ≥60% for status handling logic ✅
- **Validation**: All status rules enforced correctly ✅

---

#### TASK-M2-011D: Enhanced Time Validation Rules ✅ COMPLETED

**Purpose**: Ensure all time validations are consistently applied

**Status**: ✅ COMPLETED - TimeValidation.ts created with 38 unit tests passing

**Validation Rules**:
1. `endTime > startTime` (both attendance and time logs)
2. No midnight crossing: `endTime <= 23:59` (max time is 23:59)
3. No overlap between work attendances on same date
4. For work status: `sumOfTimeLogs >= (endTime - startTime)`

- [x] Create `backend/src/utils/TimeValidation.ts`:
  ```typescript
  // Validate time range and no midnight crossing
  function validateTimeRange(startTime: string, endTime: string): void;
  
  // Check if endTime exceeds 23:59
  function validateNoMidnightCrossing(startTime: string, endTime: string): void;
  
  // Check overlap between two time ranges
  function timeRangesOverlap(s1: string, e1: string, s2: string, e2: string): boolean;
  
  // Calculate duration in minutes
  function calculateDurationMinutes(startTime: string, endTime: string): number;
  ```
- [x] Apply validations consistently across (will be used in subsequent tasks):
  - [x] `POST /api/attendance/combined` - entrance/exit times (TASK-M2-011A)
  - [x] `PUT /api/attendance/:id` - when updating times (TASK-M2-011E)
  - [x] `POST /api/time-logs` - when project is startEnd type (TASK-M2-011B)
  - [x] `PUT /api/time-logs/:id` - when project is startEnd type (TASK-M2-011B)
- [x] Update overlap validation to only check against (TASK-M2-011C):
  - [x] Other `work` attendances on same date
  - [x] Other `halfDayOff` attendances (if they had times, but they don't)
  - [x] Skip overlap check for exclusive statuses (they have no times)
- [x] Tests (backend):
  - [x] Unit: validateTimeRange rejects end <= start
  - [x] Unit: validateNoMidnightCrossing rejects endTime > 23:59 (via TIME_REGEX)
  - [x] Unit: timeRangesOverlap correctly detects overlaps
  - [x] Integration: attendance with endTime "24:00" rejected (TASK-M2-011E)
  - [x] Integration: time log with endTime "00:30" (next day) rejected (TASK-M2-011B)
- **Coverage Target**: ≥60% for time validation utilities ✅ (38 tests)
- **Validation**: No times past 23:59 allowed anywhere ✅

---

#### TASK-M2-011E: Update Existing Endpoints for New Rules ✅ COMPLETED

**Purpose**: Update PUT /api/attendance/:id and time log endpoints with new validation logic

**Status**: ✅ COMPLETED - All 186 tests passing (5 new tests for edge cases)

- [x] Update `PUT /api/attendance/:id`:
  - [x] If status is/becomes `work`:
    - [x] Validate times provided
    - [x] Validate time range and no midnight crossing (`validateTimeRange`, `validateNoMidnightCrossing`)
    - [x] Check overlap with other attendances (exclude self)
    - [x] Validate `sumOfTimeLogs >= attendanceDuration`
  - [x] If increasing attendance duration (earlier start or later end):
    - [x] Validate `existingTimeLogs >= newDuration`
    - [x] Block if logs would become insufficient
  - [x] If decreasing attendance duration:
    - [x] Allow (logs can exceed attendance duration)
  - [x] If status is/becomes non-work:
    - [x] Apply status change rules from TASK-M2-011C
    - [x] Set startTime/endTime to NULL
- [x] Update `DELETE /api/time-logs/:id`:
  - [x] Calculate remaining logs total after deletion
  - [x] Check attendance duration
  - [x] Block if `remainingTotal < attendanceDuration`
  - [x] Error: `"Total time logs cannot be less than attendance duration"`
- [x] Update `PUT /api/time-logs/:id`:
  - [x] If reducing duration:
    - [x] Calculate new total after change
    - [x] Block if `newTotal < attendanceDuration`
  - [x] Apply project reportingType validation (from TASK-M2-011B)
- [x] Tests (backend):
  - [x] Integration: extend attendance time blocked when logs insufficient
  - [x] Integration: reduce attendance time allowed when logs still sufficient
  - [x] Integration: delete time log blocked when would violate sum rule
  - [x] Integration: reduce time log duration blocked when would violate sum rule
  - [x] Integration: invalid time format (24:00) rejected
  - [x] Integration: max valid time (23:59) accepted
- **Coverage Target**: ≥60% for updated endpoints ✅
- **Validation**: All validation rules consistently enforced ✅

---

#### TASK-M2-011F: Existing Code Analysis & Implementation Guide

**Purpose**: Document existing code to reuse and what needs modification for the new backend features

##### ✅ Existing Code to REUSE (Already in `Attendance.ts`)

The following helper functions already exist in `backend/src/routes/Attendance.ts` and should be **moved** to `backend/src/utils/TimeValidation.ts`:

| Function | Lines | Purpose | Action |
|----------|-------|---------|--------|
| `TIME_REGEX` | 23 | HH:mm format validation | Move to TimeValidation.ts |
| `timeStringToDate()` | 29-37 | Convert "HH:mm" to Date (1970-01-01 UTC) | Move to TimeValidation.ts |
| `dateToTimeString()` | 42-46 | Convert Date to "HH:mm" | Move to TimeValidation.ts |
| `calculateDurationMinutes()` | 51-59 | Calculate minutes between two times | Move to TimeValidation.ts |
| `timeRangesOverlap()` | 65-78 | Check if two time ranges overlap | Move to TimeValidation.ts |
| `checkOverlap()` | 92-125 | Check DB for overlapping attendances | Keep in Attendance.ts, modify |
| `checkDurationVsLogs()` | 131-152 | Validate sum(logs) >= attendance duration | Keep in Attendance.ts |
| `validateAttendance()` | 158-183 | Combined validation (exported) | Keep in Attendance.ts, expand |

##### ✅ Existing Code to REUSE (Already in `TimeLogs.ts`)

The following helpers already exist in `backend/src/routes/TimeLogs.ts`:

| Function | Lines | Purpose | Action |
|----------|-------|---------|--------|
| `calculateAttendanceDuration()` | 17-23 | Duration from Date objects | Keep, use internally |
| `getTotalLogsDuration()` | 29-42 | Sum all logs for attendance (exported) | Keep, no changes |
| `getAttendanceOrThrow()` | 47-57 | Get attendance or 404 | Keep, no changes |
| `validateTaskExists()` | 62-70 | Check task exists | Keep, no changes |
| `validateDuration()` | 75-79 | Positive integer validation (exported) | Keep, no changes |
| `validateLocation()` | 84-89 | office/client/home validation (exported) | Keep, no changes |
| `checkDurationVsLogsRule()` | 96-121 | Block if logs < attendance | Keep, no changes |

##### ✅ Existing Infrastructure to REUSE

| File | Purpose | Status |
|------|---------|--------|
| `backend/src/utils/Response.ts` | `ApiResponse.success()` and `ApiResponse.error()` | ✅ Ready |
| `backend/src/middleware/ErrorHandler.ts` | `AppError` class + global handler | ✅ Ready |
| `backend/src/utils/AuditLog.ts` | `logAudit()` for tracking changes | ✅ Ready |
| Zod validation pattern | Schema-based request validation | ✅ Ready |
| Prisma `$transaction` | Atomic operations | ✅ Available |

---

##### 🔧 Code That NEEDS MODIFICATION

###### 1. Prisma Schema (`backend/prisma/schema.prisma`)

**Current State**: Missing `reportingType` on Project and `startTime`/`endTime` on ProjectTimeLogs

**Required Changes**:
```prisma
// Add new enum (if not already added by teammate)
enum ReportingType {
  duration
  startEnd
}

// Add to Project model (if not already added by teammate)
model Project {
  // ... existing fields ...
  reportingType  ReportingType  @default(startEnd) @map("reporting_type")
}

// Add to ProjectTimeLogs model
model ProjectTimeLogs {
  // ... existing fields ...
  startTime      DateTime?      @map("start_time") @db.Time   // NEW
  endTime        DateTime?      @map("end_time") @db.Time     // NEW
  // durationMin remains required (always calculated/stored)
}
```

**Migration**: `npx prisma migrate dev --name add_timelog_start_end_and_project_reporting_type`

---

###### 2. `POST /api/attendance` (Attendance.ts lines 222-259)

**Current Behavior**: Creates any attendance with optional times

**Required Changes**:
- [x] For `work` status: Redirect user to use combined endpoint OR block with error
- [x] For `halfDayOff`: Check no exclusive status exists, allow creation with NULL times
- [x] For exclusive statuses (`dayOff`, `sickness`, `reserves`):
  - [x] Check NO other attendance exists on this date
  - [x] Create with startTime=NULL, endTime=NULL
- [x] Add new validation helpers:
  ```typescript
  async function checkExclusiveStatusExists(userId: bigint, date: Date, excludeId?: bigint): Promise<boolean>
  async function checkAnyAttendanceExists(userId: bigint, date: Date, excludeId?: bigint): Promise<boolean>
  ```

---

###### 3. `PUT /api/attendance/:id` (Attendance.ts lines 347-424)

**Current Behavior**: Updates attendance, checks overlap and duration-vs-logs

**Required Changes**:
- [x] Add status change validation:
  ```typescript
  // Block work → non-work if time logs exist
  if (existingStatus === 'work' && newStatus !== 'work') {
    const logsCount = await checkTimeLogsExist(id);
    if (logsCount > 0) {
      throw new AppError('VALIDATION_ERROR', 
        'Cannot change to non-work status while time logs exist. Delete time logs first.', 400);
    }
  }
  ```
- [x] Handle `non-work` → `work` (require times in request)
- [x] Check exclusive status rules when changing TO exclusive status
- [x] Set times to NULL when changing to non-work status
- [x] Add `validateNoMidnightCrossing()` check

---

###### 4. `validateAttendance()` (Attendance.ts lines 158-183)

**Current Code**:
```typescript
export async function validateAttendance(
  userId: bigint, date: Date, startTime: string | null, endTime: string | null, 
  status: string, excludeId?: bigint
): Promise<void> {
  // Only checks: work requires times, endTime > startTime, overlap
}
```

**Required Additions**:
- [x] Add midnight crossing check: `if (endTime && endTime > '23:59') throw ...`
- [x] For `work`/`halfDayOff`: Check no exclusive status exists
- [x] For exclusive statuses: Check no other attendance exists
- [x] Skip overlap check for non-work statuses (they have no times)

---

###### 5. `POST /api/time-logs` (TimeLogs.ts lines 154-185)

**Current Behavior**: Creates time log with duration only

**Required Changes**:
- [x] Get task's project to check `reportingType`:
  ```typescript
  const task = await prisma.task.findUnique({
    where: { id: body.taskId },
    include: { project: { select: { reportingType: true } } }
  });
  ```
- [x] If `reportingType = startEnd`:
  - [x] Require startTime and endTime in request
  - [x] Validate `endTime > startTime`
  - [x] Validate no midnight crossing
  - [x] Calculate `durationMin = calculateDurationMinutes(startTime, endTime)`
  - [x] Store all three fields
- [x] If `reportingType = duration`:
  - [x] Require duration in request
  - [x] Store durationMin, set startTime/endTime to NULL

---

###### 6. `PUT /api/time-logs/:id` (TimeLogs.ts lines 229-275)

**Current Behavior**: Updates duration only

**Required Changes**:
- [x] Check project's current `reportingType` (may have changed)
- [x] Handle both reporting types appropriately
- [x] Update startTime/endTime or set to NULL based on type
- [x] Keep all existing duration-vs-logs validation

---

##### 📁 New Files to CREATE

| File | Purpose | Based On |
|------|---------|----------|
| `backend/src/services/CombinedAttendance.ts` | Atomic attendance + logs creation | New service |
| `backend/src/utils/TimeValidation.ts` | Consolidated time helpers | Move from Attendance.ts |

##### 📄 `backend/src/utils/TimeValidation.ts` Structure

```typescript
// Move these from Attendance.ts:
export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
export function timeStringToDate(time: string): Date;
export function dateToTimeString(date: Date): string;
export function calculateDurationMinutes(startTime: string, endTime: string): number;
export function timeRangesOverlap(s1: string, e1: string, s2: string, e2: string): boolean;

// Add these new helpers:
export function validateTimeRange(startTime: string, endTime: string): void;
export function validateNoMidnightCrossing(endTime: string): void;
```

##### 📄 `backend/src/services/CombinedAttendance.ts` Structure

```typescript
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/ErrorHandler';
import { timeStringToDate, calculateDurationMinutes, validateTimeRange, validateNoMidnightCrossing } from '../utils/TimeValidation';

interface CombinedAttendanceInput {
  userId: bigint;
  date: Date;
  startTime: string;
  endTime: string;
  timeLogs: Array<{
    taskId: bigint;
    duration?: number;
    startTime?: string;
    endTime?: string;
    location: 'office' | 'client' | 'home';
    description?: string;
  }>;
}

interface CombinedAttendanceResult {
  attendanceId: bigint;
  timeLogIds: bigint[];
}

export async function createCombinedAttendance(
  prisma: PrismaClient,
  input: CombinedAttendanceInput
): Promise<CombinedAttendanceResult> {
  return prisma.$transaction(async (tx) => {
    // 1. Validate no exclusive status exists
    // 2. Validate time range and no midnight crossing
    // 3. Check no overlap with existing attendances
    // 4. Calculate attendance duration
    // 5. Validate each time log
    // 6. Validate sum(logs) >= attendance duration
    // 7. Create attendance
    // 8. Create all time logs
    // 9. Return IDs
  });
}
```

---

##### 🔄 Import Updates Required

After moving helpers to `TimeValidation.ts`, update imports in:

1. **`backend/src/routes/Attendance.ts`**:
   ```typescript
   import { 
     timeStringToDate, dateToTimeString, calculateDurationMinutes, 
     timeRangesOverlap, validateTimeRange, validateNoMidnightCrossing,
     TIME_REGEX 
   } from '../utils/TimeValidation';
   ```

2. **`backend/src/routes/TimeLogs.ts`**:
   ```typescript
   import { 
     timeStringToDate, dateToTimeString, calculateDurationMinutes,
     validateNoMidnightCrossing 
   } from '../utils/TimeValidation';
   ```

3. **`backend/src/services/CombinedAttendance.ts`**:
   ```typescript
   import { 
     timeStringToDate, calculateDurationMinutes, 
     validateTimeRange, validateNoMidnightCrossing 
   } from '../utils/TimeValidation';
   ```

---

##### ✅ Implementation Checklist Summary

| Step | Task | Files |
|------|------|-------|
| 1 | Create `TimeValidation.ts` with moved + new helpers | `utils/TimeValidation.ts` |
| 2 | Update imports in existing files | `Attendance.ts`, `TimeLogs.ts` |
| 3 | Update Prisma schema (if needed) | `schema.prisma` |
| 4 | Run migration | - |
| 5 | Create `CombinedAttendance.ts` service | `services/CombinedAttendance.ts` |
| 6 | Add combined endpoint route | `Attendance.ts` |
| 7 | Update `POST /api/attendance` for non-work | `Attendance.ts` |
| 8 | Update `PUT /api/attendance/:id` | `Attendance.ts` |
| 9 | Update `POST /api/time-logs` for reportingType | `TimeLogs.ts` |
| 10 | Update `PUT /api/time-logs/:id` for reportingType | `TimeLogs.ts` |
| 11 | Add tests for all new functionality | `*.test.ts` files |

---

#### TASK-M2-011G: Backend Architecture Refactoring (Per `doc/ARCHITECTURE.md`) ✅ COMPLETED

**Purpose**: Refactor Member 2's backend code to follow the three-layer architecture pattern

**Status**: ✅ COMPLETED - All 105 tests passing

**Previous State**: All code was mixed in route files (`Attendance.ts`, `TimeLogs.ts`)

**Target Architecture**:
```
backend/src/
├── controllers/                    # NEW - Route handlers
│   ├── AttendanceController.ts
│   └── TimeLogsController.ts
├── services/                       # NEW - Business logic
│   ├── AttendanceService.ts
│   ├── TimeLogsService.ts
│   └── CombinedAttendanceService.ts
├── routes/                         # MODIFY - Route definitions only
│   ├── attendance.routes.ts
│   └── timeLogs.routes.ts
├── validators/                     # NEW - Zod schemas
│   ├── attendance.schema.ts
│   └── timeLogs.schema.ts
├── middleware/
│   └── ErrorHandler.ts             # EXISTS
└── utils/
    ├── Response.ts                 # EXISTS
    ├── AuditLog.ts                 # EXISTS
    └── TimeValidation.ts           # NEW (from TASK-M2-011D)
```

##### Step 1: Create Validators (`validators/`) ✅

- [x] Create `backend/src/validators/attendance.schema.ts`:
  ```typescript
  import { z } from 'zod';
  
  export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const timeSchema = z.string().regex(TIME_REGEX, 'Time must be in HH:mm format');

  export const createAttendanceSchema = z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format. Expected YYYY-MM-DD',
    }),
    startTime: timeSchema.optional().nullable(),
    endTime: timeSchema.optional().nullable(),
    status: z.enum(['work', 'sickness', 'reserves', 'dayOff', 'halfDayOff']),
    userId: z.union([z.string(), z.number()]).transform((val) => BigInt(val)),
  });

  export const updateAttendanceSchema = z.object({
    startTime: timeSchema.optional().nullable(),
    endTime: timeSchema.optional().nullable(),
    status: z.enum(['work', 'sickness', 'reserves', 'dayOff', 'halfDayOff']).optional(),
  });

  export const monthHistoryQuerySchema = z.object({
    month: z.string().transform((val) => parseInt(val, 10)).refine((val) => val >= 1 && val <= 12),
    userId: z.string().transform((val) => BigInt(val)),
  });

  export const combinedAttendanceSchema = z.object({
    userId: z.union([z.string(), z.number()]).transform((val) => BigInt(val)),
    date: z.string(),
    startTime: timeSchema,
    endTime: timeSchema,
    status: z.literal('work'),
    timeLogs: z.array(z.object({
      taskId: z.union([z.string(), z.number()]).transform((val) => BigInt(val)),
      duration: z.number().int().positive().optional(),
      startTime: timeSchema.optional(),
      endTime: timeSchema.optional(),
      location: z.enum(['office', 'client', 'home']),
      description: z.string().optional(),
    })).min(1, 'At least one time log is required'),
  });
  ```

- [x] Create `backend/src/validators/timeLogs.schema.ts`:
  ```typescript
  import { z } from 'zod';
  
  const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const timeSchema = z.string().regex(TIME_REGEX, 'Time must be in HH:mm format');

  export const createTimeLogSchema = z.object({
    dailyAttendanceId: z.union([z.string(), z.number()]).transform((val) => BigInt(val)),
    taskId: z.union([z.string(), z.number()]).transform((val) => BigInt(val)),
    duration: z.number().int().positive().optional(),
    startTime: timeSchema.optional(),
    endTime: timeSchema.optional(),
    location: z.enum(['office', 'client', 'home']),
    description: z.string().optional(),
  });

  export const updateTimeLogSchema = z.object({
    taskId: z.union([z.string(), z.number()]).transform((val) => BigInt(val)).optional(),
    duration: z.number().int().positive().optional(),
    startTime: timeSchema.optional().nullable(),
    endTime: timeSchema.optional().nullable(),
    location: z.enum(['office', 'client', 'home']).optional(),
    description: z.string().optional().nullable(),
  });

  export const queryTimeLogsSchema = z.object({
    dailyAttendanceId: z.string().transform((val) => BigInt(val)),
  });
  ```

##### Step 2: Create Services (`services/`) ✅

- [x] Create `backend/src/services/AttendanceService.ts`:
  - [x] Move all Prisma operations from `Attendance.ts`
  - [x] Move validation logic (checkOverlap, checkDurationVsLogs, etc.)
  - [x] Move exclusive status helpers (checkExclusiveStatusExists, etc.)
  - [x] Export static methods for each operation:
    ```typescript
    export class AttendanceService {
      static async createAttendance(data: CreateAttendanceInput): Promise<bigint>;
      static async getMonthHistory(userId: bigint, month: number): Promise<AttendanceWithLogs[]>;
      static async updateAttendance(id: bigint, data: UpdateAttendanceInput): Promise<void>;
      static async checkOverlap(userId: bigint, date: Date, startTime: string | null, endTime: string | null, excludeId?: bigint): Promise<void>;
      static async checkExclusiveStatusExists(userId: bigint, date: Date, excludeId?: bigint): Promise<boolean>;
      static async checkAnyAttendanceExists(userId: bigint, date: Date, excludeId?: bigint): Promise<boolean>;
      static async checkTimeLogsExist(attendanceId: bigint): Promise<number>;
    }
    ```

- [x] Create `backend/src/services/TimeLogsService.ts`:
  - [x] Move all Prisma operations from `TimeLogs.ts`
  - [x] Move validation helpers
  - [x] Export static methods:
    ```typescript
    export class TimeLogsService {
      static async createTimeLog(data: CreateTimeLogInput): Promise<bigint>;
      static async getTimeLogsByAttendance(attendanceId: bigint): Promise<TimeLog[]>;
      static async updateTimeLog(id: bigint, data: UpdateTimeLogInput): Promise<void>;
      static async deleteTimeLog(id: bigint): Promise<void>;
      static async getTotalLogsDuration(attendanceId: bigint, excludeLogId?: bigint): Promise<number>;
      static async getTaskWithProject(taskId: bigint): Promise<TaskWithProject>;
    }
    ```

- [x] Create `backend/src/services/CombinedAttendanceService.ts` (deferred to TASK-M2-011A):
  - [x] Export as class with static methods:
    ```typescript
    export class CombinedAttendanceService {
      static async createCombinedAttendance(input: CombinedAttendanceInput): Promise<CombinedAttendanceResult>;
    }
    ```

##### Step 3: Create Controllers (`controllers/`)

- [x] Create `backend/src/controllers/AttendanceController.ts`:
  ```typescript
  import { Request, Response, NextFunction } from 'express';
  import { AttendanceService } from '../services/AttendanceService';
  import { CombinedAttendanceService } from '../services/CombinedAttendanceService';
  import { ApiResponse } from '../utils/Response';
  import { createAttendanceSchema, updateAttendanceSchema, monthHistoryQuerySchema, combinedAttendanceSchema } from '../validators/attendance.schema';
  import { logAudit } from '../utils/AuditLog';

  export class AttendanceController {
    static async create(req: Request, res: Response, next: NextFunction) {
      try {
        const body = createAttendanceSchema.parse(req.body);
        const id = await AttendanceService.createAttendance(body);
        logAudit({ action: 'CREATE_ATTENDANCE', userId: body.userId, entity: 'DailyAttendance', entityId: id, payload: body, req });
        ApiResponse.success(res, { id: id.toString() }, 201);
      } catch (error) {
        next(error);
      }
    }

    static async getMonthHistory(req: Request, res: Response, next: NextFunction) {
      try {
        const query = monthHistoryQuerySchema.parse(req.query);
        const attendances = await AttendanceService.getMonthHistory(query.userId, query.month);
        ApiResponse.success(res, attendances);
      } catch (error) {
        next(error);
      }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
      try {
        const id = BigInt(req.params.id);
        const body = updateAttendanceSchema.parse(req.body);
        await AttendanceService.updateAttendance(id, body);
        ApiResponse.success(res, { updated: true });
      } catch (error) {
        next(error);
      }
    }

    static async createCombined(req: Request, res: Response, next: NextFunction) {
      try {
        const body = combinedAttendanceSchema.parse(req.body);
        const result = await CombinedAttendanceService.createCombinedAttendance(body);
        ApiResponse.success(res, { 
          attendanceId: result.attendanceId.toString(), 
          timeLogIds: result.timeLogIds.map(id => id.toString()) 
        }, 201);
      } catch (error) {
        next(error);
      }
    }
  }
  ```

- [x] Create `backend/src/controllers/TimeLogsController.ts`:
  ```typescript
  import { Request, Response, NextFunction } from 'express';
  import { TimeLogsService } from '../services/TimeLogsService';
  import { ApiResponse } from '../utils/Response';
  import { createTimeLogSchema, updateTimeLogSchema, queryTimeLogsSchema } from '../validators/timeLogs.schema';

  export class TimeLogsController {
    static async create(req: Request, res: Response, next: NextFunction) {
      try {
        const body = createTimeLogSchema.parse(req.body);
        const id = await TimeLogsService.createTimeLog(body);
        ApiResponse.success(res, { id: id.toString() }, 201);
      } catch (error) {
        next(error);
      }
    }

    static async getByAttendance(req: Request, res: Response, next: NextFunction) {
      try {
        const query = queryTimeLogsSchema.parse(req.query);
        const logs = await TimeLogsService.getTimeLogsByAttendance(query.dailyAttendanceId);
        ApiResponse.success(res, logs);
      } catch (error) {
        next(error);
      }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
      try {
        const id = BigInt(req.params.id);
        const body = updateTimeLogSchema.parse(req.body);
        await TimeLogsService.updateTimeLog(id, body);
        ApiResponse.success(res, { updated: true });
      } catch (error) {
        next(error);
      }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
      try {
        const id = BigInt(req.params.id);
        await TimeLogsService.deleteTimeLog(id);
        ApiResponse.success(res, { deleted: true });
      } catch (error) {
        next(error);
      }
    }
  }
  ```

##### Step 4: Refactor Routes (`routes/`)

- [x] Rename `backend/src/routes/Attendance.ts` → `backend/src/routes/attendance.routes.ts`:
  ```typescript
  import { Router } from 'express';
  import { AttendanceController } from '../controllers/AttendanceController';
  // import { authMiddleware } from '../middleware/AuthMiddleware'; // Uncomment when auth ready

  const router = Router();

  // router.use(authMiddleware); // Uncomment when auth ready

  router.post('/', AttendanceController.create);
  router.post('/combined', AttendanceController.createCombined);
  router.get('/month-history', AttendanceController.getMonthHistory);
  router.put('/:id', AttendanceController.update);

  export default router;
  ```

- [x] Rename `backend/src/routes/TimeLogs.ts` → `backend/src/routes/timeLogs.routes.ts`:
  ```typescript
  import { Router } from 'express';
  import { TimeLogsController } from '../controllers/TimeLogsController';
  // import { authMiddleware } from '../middleware/AuthMiddleware'; // Uncomment when auth ready

  const router = Router();

  // router.use(authMiddleware); // Uncomment when auth ready

  router.post('/', TimeLogsController.create);
  router.get('/', TimeLogsController.getByAttendance);
  router.put('/:id', TimeLogsController.update);
  router.delete('/:id', TimeLogsController.delete);

  export default router;
  ```

##### Step 5: Update App Entry Point

- [x] Update `backend/src/app.ts` to use new route files:
  ```typescript
  import attendanceRoutes from './routes/attendance.routes';
  import timeLogsRoutes from './routes/timeLogs.routes';

  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/time-logs', timeLogsRoutes);
  ```

##### Step 6: Auth Integration Preparation ✅

- [x] Add commented auth middleware imports in route files (ready to uncomment when Member 1 completes auth)
- [x] Add `// TODO: Replace with req.user.id when auth ready` comments where userId is used
- [x] Prepare ownership validation helpers in services:
  ```typescript
  // In AttendanceService
  static async validateOwnership(attendanceId: bigint, userId: bigint): Promise<void> {
    const attendance = await prisma.dailyAttendance.findUnique({ where: { id: attendanceId } });
    if (!attendance || attendance.userId !== userId) {
      throw new AppError('FORBIDDEN', 'Access denied', 403);
    }
  }
  ```

##### Step 7: Update Tests

- [x] Update test imports to use new paths
- [x] Keep existing test logic (no behavior changes)
- [x] Add unit tests for services in `backend/src/services/*.test.ts`

---

##### File Ownership Map Update (Member 2)

```
backend/src/
├── controllers/
│   ├── AttendanceController.ts
│   └── TimeLogsController.ts
├── services/
│   ├── AttendanceService.ts
│   ├── TimeLogsService.ts
│   └── CombinedAttendanceService.ts
├── routes/
│   ├── attendance.routes.ts
│   └── timeLogs.routes.ts
├── validators/
│   ├── attendance.schema.ts
│   └── timeLogs.schema.ts
└── utils/
    └── TimeValidation.ts
```

---

##### Implementation Order

| Priority | Task | Reason |
|----------|------|--------|
| 1 | Create `validators/` | No dependencies, extracts existing code |
| 2 | Create `utils/TimeValidation.ts` | Required by services |
| 3 | Create `services/` | Extracts business logic from routes |
| 4 | Create `controllers/` | Thin layer that calls services |
| 5 | Refactor `routes/` | Now just defines paths |
| 6 | Update tests | Ensure nothing broke |

---

- **Coverage Target**: Maintain existing ≥60% coverage after refactoring ✅
- **Validation**: All existing API contracts remain unchanged, tests pass ✅
- **Status**: ✅ COMPLETED - 105 tests passing, architecture refactored

---

#### TASK-M2-012: Project Selector Backend
- [x] Create `backend/src/services/ProjectSelectorService.ts`
- [x] Define grouped response shape (Client → Project → Task) with ids/names
- [x] Implement `getProjectsForUser(userId)`:
  - [x] Get assigned tasks via TaskWorker table
  - [x] Join projects + clients
  - [x] **Filter by active status**:
    - [x] Only include tasks with `status = 'open'`
    - [x] Only include projects with `active = true`
    - [x] Only include clients with `active = true`
  - [x] Group by Client → Project → Task
- [x] Implement usage frequency:
  - [x] Query all-time ProjectTimeLogs per user
  - [x] Count by task (number of reports), roll up to project/client
  - [x] Sort Client → Project → Task by count desc; tie-breaker A→Z (alphabetical)
- [x] Create `backend/src/routes/projects.routes.ts` for selector endpoint
- [x] Wire Projects routes in `backend/src/app.ts`
- [x] Implement `GET /api/projects/selector`:
  - [x] Always fetch latest data from TaskWorker (no cache)
  - [x] Build client/project/task grouping from assigned tasks
  - [x] Count task report frequency and sort by usage
- [ ] **Auth integration (after TASK-M1-010):**
  - [ ] Apply auth middleware to Project Selector routes
  - [ ] Use `req.user.id` to get assignments for authenticated user only
  - [ ] Validate user exists in database
  - [ ] Return only projects/tasks the authenticated user is assigned to
  - [ ] Update tests to include auth (token or mocked user context)
- [x] Tests (backend):
  - [x] Unit: grouping by client/project/task
  - [x] Unit: frequency ordering from all-time counts
  - [x] Unit: filtering excludes inactive tasks/projects/clients
  - [x] Integration: selector response shape and ordering
- **Coverage Target**: ≥60% for ProjectSelectorService
- **Validation**: Grouped, sorted projects return quickly (<300ms)
- **Status**: ✅ Core implementation COMPLETED - 242 tests passing. Auth integration pending TASK-M1-010. Cache removed to always return newest data.

#### TASK-M2-020: Daily Report Entry UI (User App)

**Backend Prerequisites (Already Complete):**
- [x] POST /api/attendance/combined endpoint (CombinedAttendanceService)
- [x] PUT /api/attendance/:id endpoint (update attendance)
- [x] Validators: combinedAttendanceSchema, updateAttendanceSchema
- [x] Transaction handling for atomic attendance + time logs creation
- [x] Time validation utils (TimeValidation.ts)

**Backend - Document Upload (NEW):**
- [x] TASK-M2-020-BE-001: Add document upload endpoints
  - [x] POST /api/attendance/:id/document (multipart/form-data)
  - [x] DELETE /api/attendance/:id/document
  - [x] Validate file type (JPG/PNG/PDF only) and size (max 5MB)
  - [x] Store binary data in DailyAttendance.document field
  - [x] Add tests for upload/delete endpoints

**Frontend - Types & Utilities:**
- [ ] TASK-M2-020-FE-001: Create daily report types
  - [ ] Create `types/dailyReport.ts`:
    - [ ] `DailyReportFormData` (date, entranceTime, exitTime, projectReports[])
    - [ ] `ProjectReportItem` (project, task, location, duration/startEnd, description)
    - [ ] `AbsenceReportFormData` (date, absenceType, document, dateRange)
    - [ ] `ValidationErrors` (field-level error messages)
  - [ ] Export from `types/index.ts`

- [ ] TASK-M2-020-FE-002: Create validation utilities
  - [ ] Create `utils/validation.ts`:
    - [ ] `validateTimeRange(start, end)` - ensure end > start
    - [ ] `validateDuration(hhMM)` - max 23:59, valid format
    - [ ] `validateRequiredFields(projectReport)` - check project/task/location
    - [ ] `calculateTotalDuration(projectReports[])` - sum durations in minutes
    - [ ] `validateTrackerComplete(total, target)` - check total >= target
  - [ ] Add unit tests (≥80% coverage)

- [ ] TASK-M2-020-FE-003: Create time formatting utilities
  - [ ] Create `utils/timeUtils.ts`:
    - [ ] `formatDurationInput(minutes)` - convert to hh:mm display
    - [ ] `parseDurationInput(hhMM)` - convert to minutes
    - [ ] `formatTimeForPicker(time)` - format HH:mm for time picker
    - [ ] `parseTimeFromPicker(time)` - parse picker value
  - [ ] Add unit tests (≥80% coverage)

**Frontend - API Services:**
- [ ] TASK-M2-020-FE-004: Extend attendance API service
  - [ ] Update `services/attendanceApi.ts`:
    - [ ] `createCombinedAttendance(data)` - POST /api/attendance/combined
    - [ ] `updateAttendance(id, data)` - PUT /api/attendance/:id
    - [ ] `uploadDocument(attendanceId, file)` - POST /api/attendance/:id/document
    - [ ] `deleteDocument(attendanceId)` - DELETE /api/attendance/:id/document
  - [ ] Add proper TypeScript types and error handling

- [ ] TASK-M2-020-FE-005: Create project selector API service
  - [ ] Create `services/projectSelectorApi.ts`:
    - [ ] `getProjectSelector(userId)` - GET /api/projects/selector
    - [ ] `buildTaskLookupMap(data)` - flatten hierarchy for quick lookup
    - [ ] Use existing ProjectSelectorResponse type
  - [ ] Export from `services/index.ts`

**Frontend - Custom Hooks:**
- [ ] TASK-M2-020-FE-006: Create useProjectSelector hook
  - [ ] Create `hooks/useProjectSelector.ts`:
    - [ ] Use TanStack Query `useQuery` for project selector data
    - [ ] Cache key: QUERY_KEYS.projectSelector
    - [ ] Stale time: 5 minutes
    - [ ] Memoize task lookup map for performance
    - [ ] Return: `{ data, clients, taskLookup, isLoading, error }`
  - [ ] Add tests (≥70% coverage)

- [ ] TASK-M2-020-FE-007: Create useCreateDailyReport hook
  - [ ] Create `hooks/useCreateDailyReport.ts`:
    - [ ] Use `useMutation` for combined attendance creation
    - [ ] Invalidate `monthHistory` query on success
    - [ ] Show green success toast: "דיווח שעות הושלם"
    - [ ] Show red error toast on failure
    - [ ] Return: `{ mutate, mutateAsync, isLoading, error }`
  - [ ] Add tests (≥70% coverage)

- [ ] TASK-M2-020-FE-008: Create useUpdateDailyReport hook
  - [ ] Create `hooks/useUpdateDailyReport.ts`:
    - [ ] Use `useMutation` for updating attendance
    - [ ] Separate mutations for time logs (create/update/delete via API)
    - [ ] Invalidate queries on success
    - [ ] Handle success/error notifications
  - [ ] Add tests (≥70% coverage)

- [ ] TASK-M2-020-FE-009: Create useDailyReportForm hook
  - [ ] Create `hooks/useDailyReportForm.ts`:
    - [ ] Manage form state: date, entranceTime, exitTime, projectReports[]
    - [ ] `addProjectReport()` - append new empty project report
    - [ ] `updateProjectReport(index, data)` - update existing report at index
    - [ ] `removeProjectReport(index)` - delete report (with confirmation)
    - [ ] `calculateProgress()` - sum durations vs (exit - entrance)
    - [ ] `validateForm()` - run all validation rules, return errors
    - [ ] Return: `{ formData, handlers, progress, errors, isValid }`
  - [ ] Add tests (≥70% coverage)

**Frontend - Modal Structure:**
- [ ] TASK-M2-020-FE-010: Create DailyReportModal component
  - [ ] Create `components/DailyReport/DailyReportModal.tsx`:
    - [ ] Full-screen modal (mobile-first, RTL)
    - [ ] Header: "דיווח ידני" + close button (X)
    - [ ] Two tabs: "דיווח עבודה" (default) / "דיווח היעדרות"
    - [ ] Tab content: render WorkReportTab or AbsenceReportTab
    - [ ] Props: `isOpen`, `onClose`, `mode: 'create' | 'edit'`, `existingAttendanceId?`, `defaultDate?`
  - [ ] Create `DailyReportModal.module.css` (mobile styling, RTL support)

**Frontend - Work Report Tab:**
- [ ] TASK-M2-020-FE-011: Create WorkReportTab component
  - [ ] Create `components/DailyReport/WorkReportTab.tsx`:
    - [ ] Date selector (default: today, opens DatePickerModal)
    - [ ] Entrance time input (opens TimePickerModal)
    - [ ] Exit time input (opens TimePickerModal)
    - [ ] ProjectReportsList component
    - [ ] ProgressTracker component (shows X/Y hours + visual bar)
    - [ ] Save button (enabled when valid, shows loading state)
    - [ ] Use `useDailyReportForm` hook for state management
    - [ ] Handle validation errors and show appropriate toasts/modals
  - [ ] Create `WorkReportTab.module.css`

- [ ] TASK-M2-020-FE-012: Create TimePickerModal component
  - [ ] Create `components/DailyReport/TimePickerModal.tsx`:
    - [ ] Scrollable time picker (hours 00-23, minutes 00-59 in 5min increments)
    - [ ] Current selection highlighted
    - [ ] "שמירה" (save) and "נקה" (clear) buttons
    - [ ] Props: `isOpen`, `onClose`, `value`, `onChange`, `label`
  - [ ] Create `TimePickerModal.module.css`

- [ ] TASK-M2-020-FE-013: Create DatePickerModal component
  - [ ] Create `components/DailyReport/DatePickerModal.tsx`:
    - [ ] Calendar view (month/year navigation with arrows)
    - [ ] Hebrew day names from constants
    - [ ] Highlight selected date (blue circle)
    - [ ] Disable future dates (can't report future work)
    - [ ] "שמירה" and "נקה" buttons
    - [ ] Props: `isOpen`, `onClose`, `value`, `onChange`
  - [ ] Create `DatePickerModal.module.css`

- [ ] TASK-M2-020-FE-014: Create ProjectReportsList component
  - [ ] Create `components/DailyReport/ProjectReportsList.tsx`:
    - [ ] Section title: "דיווח פרויקטים"
    - [ ] Render list of ProjectReportCard components
    - [ ] "הוספת פרויקט" button (blue link with + icon)
    - [ ] Empty state: show only "הוספת פרויקט" button
    - [ ] Props: `reports[]`, `onAdd`, `onEdit`, `onDelete`
  - [ ] Create `ProjectReportsList.module.css`

- [ ] TASK-M2-020-FE-015: Create ProjectReportCard component
  - [ ] Create `components/DailyReport/ProjectReportCard.tsx`:
    - [ ] **Collapsed view**: Project name + duration (e.g., "Globaly 05:30 ש'")
    - [ ] **Expanded view**: Show all fields:
      - [ ] פרויקט* (required) - opens ProjectSelectorModal
      - [ ] משימה* (required) - opens TaskListStep
      - [ ] מיקום* (required) - opens LocationListStep
      - [ ] Time entry based on project reportingType:
        - [ ] Duration: Single input hh:mm (max 23:59)
        - [ ] StartEnd: Start time + End time inputs
      - [ ] Description (optional, multiline text)
    - [ ] "מחיקת פרויקט" link (red) - opens DeleteProjectConfirmModal
    - [ ] Expandable accordion behavior (click to toggle)
    - [ ] Props: `report`, `index`, `onUpdate`, `onDelete`, `taskLookup`
  - [ ] Create `ProjectReportCard.module.css`

- [ ] TASK-M2-020-FE-016: Create ProgressTracker component
  - [ ] Create `components/DailyReport/ProgressTracker.tsx`:
    - [ ] Display current/target: "X מתוך Y שעות"
    - [ ] Display missing: "חסרות Z שעות לדיווח" (if incomplete)
    - [ ] Visual progress bar (fills orange, 100% when complete)
    - [ ] Props: `current` (minutes), `target` (minutes)
  - [ ] Create `ProgressTracker.module.css`

**Frontend - Absence Report Tab:**
- [ ] TASK-M2-020-FE-017: Create AbsenceReportTab component
  - [ ] Create `components/DailyReport/AbsenceReportTab.tsx`:
    - [ ] Date selector (same as WorkReportTab)
    - [ ] Absence type dropdown (default: מחלה):
      - [ ] Options: חופשה - חצי יום, חופשה - יום מלא, מחלה 😷, מילואים 🪖
    - [ ] FileUpload component (for sickness/reserves documentation)
    - [ ] "לדווח על היעדרות יותר מיום אחד" button → DateRangePickerModal
    - [ ] Save button (always enabled, no validation required)
    - [ ] Use `useMutation` for POST /api/attendance (non-work status)
  - [ ] Create `AbsenceReportTab.module.css`

- [ ] TASK-M2-020-FE-018: Create FileUpload component
  - [ ] Create `components/DailyReport/FileUpload.tsx`:
    - [ ] Drag & drop zone with blue folder icon
    - [ ] "לחץ כאן להעלאת הקובץ" link
    - [ ] Show accepted formats: JPG / PNG / PDF
    - [ ] Validate file size (max 5MB) and type before upload
    - [ ] After upload: show file name + badge (PDF/JPG/PNG) + delete icon
    - [ ] Props: `file`, `onUpload`, `onDelete`
  - [ ] Create `FileUpload.module.css`

- [ ] TASK-M2-020-FE-019: Create DateRangePickerModal component
  - [ ] Create `components/DailyReport/DateRangePickerModal.tsx`:
    - [ ] Title: "דיווח היעדרות לפי טווח"
    - [ ] Two date fields: "תאריך התחלה" + "תאריך סיום" (each opens calendar)
    - [ ] Calculate and show: "סה"כ ימי דיווח: X ימים" (in blue)
    - [ ] Validate: endDate >= startDate
    - [ ] "שמירה" and "נקה" buttons
    - [ ] Props: `isOpen`, `onClose`, `onSave`
  - [ ] Create `DateRangePickerModal.module.css`

**Frontend - Project Selector (3-Step Modal):**
- [ ] TASK-M2-020-FE-020: Create ProjectSelectorModal component
  - [ ] Create `components/ProjectSelector/ProjectSelectorModal.tsx`:
    - [ ] **Three-step wizard flow**:
      1. Project selection (grouped by client)
      2. Task selection (filtered by selected project)
      3. Location selection (משרד / בית / בית לקוח)
    - [ ] Dynamic title: "בחר פרויקט" / "בחר משימה" / "בחר מיקום"
    - [ ] Back button (visible after step 1, returns to previous step)
    - [ ] Bottom button text changes: "המשך ובחר משימה" / "המשך ובחר מיקום" / "המשך"
    - [ ] Props: `isOpen`, `onClose`, `onSelect`, `userId`, `initialSelection?`
  - [ ] Create `ProjectSelectorModal.module.css`

- [ ] TASK-M2-020-FE-021: Create ProjectListStep component
  - [ ] Create `components/ProjectSelector/ProjectListStep.tsx`:
    - [ ] Grouped list by client (client names as section headers)
    - [ ] Project names as clickable list items
    - [ ] Selected project shows blue checkmark icon
    - [ ] Loading skeleton while fetching
    - [ ] Use data from `useProjectSelector` hook
    - [ ] Props: `projects[]`, `selectedId`, `onSelect`
  - [ ] Create `ProjectListStep.module.css`

- [ ] TASK-M2-020-FE-022: Create TaskListStep component
  - [ ] Create `components/ProjectSelector/TaskListStep.tsx`:
    - [ ] Context subtitle: "בחר משימה - מצב: עריכה" (or other context)
    - [ ] Filtered task list for selected project
    - [ ] Selected task shows blue checkmark
    - [ ] Props: `tasks[]`, `selectedId`, `onSelect`, `projectName`
  - [ ] Create `TaskListStep.module.css`

- [ ] TASK-M2-020-FE-023: Create LocationListStep component
  - [ ] Create `components/ProjectSelector/LocationListStep.tsx`:
    - [ ] Three options with icons:
      - [ ] משרד (office)
      - [ ] בית (home)
      - [ ] בית לקוח (client site)
    - [ ] Selected location shows blue checkmark
    - [ ] Props: `selectedLocation`, `onSelect`
  - [ ] Create `LocationListStep.module.css`

- [ ] TASK-M2-020-FE-024: Create SelectorErrorState component
  - [ ] Create `components/ProjectSelector/SelectorErrorState.tsx`:
    - [ ] Robot image (broken robot from shared/image_components)
    - [ ] "אופססס... 😅"
    - [ ] "אין מידע זמין כרגע, נסה שוב מאוחר יותר"
    - [ ] "או פנה למנהל ישיר"
    - [ ] "חזור למסך ראשי" link
    - [ ] "המשך ובחר מיקום" button (disabled/greyed)
  - [ ] Create `SelectorErrorState.module.css`

**Frontend - Confirmation Modals & Toasts:**
- [ ] TASK-M2-020-FE-025: Configure toast notifications
  - [ ] Use Mantine notifications (already installed)
  - [ ] Configure RTL and Hebrew support
  - [ ] **Blue info toast**: Hierarchy validation errors
    - [ ] Message: "בחר {field} קודם" (e.g., "בחר פרויקט קודם")
    - [ ] Trigger: When clicking Task before Project, etc.
  - [ ] **Red error toast**: Missing required fields
    - [ ] Message: "חסר לנו פרטים אה ענינים"
    - [ ] Trigger: Save clicked with incomplete project reports
  - [ ] **Green success toast**: Successful save
    - [ ] Title: "דיווח שעות הושלם"
    - [ ] Message: "דיווח השעות שלך נשמרו בהצלחה בסיבכת 🙂"

- [ ] TASK-M2-020-FE-026: Create IncompleteHoursModal component
  - [ ] Create `components/DailyReport/IncompleteHoursModal.tsx`:
    - [ ] Yellow warning icon (⚠️)
    - [ ] Title: "יום העבודה שלך טרם הושלם"
    - [ ] Message: "חסרות {X} שעות לדיווח. האם אתה בטוח שהרצת להמשיך?"
    - [ ] Two buttons:
      - [ ] "מעדיף שלא למחוק" (cancel, light grey)
      - [ ] "צא בכל זאת" (confirm save partial, navy blue)
    - [ ] Props: `isOpen`, `onClose`, `onConfirm`, `missingHours`
  - [ ] Create `IncompleteHoursModal.module.css`

- [ ] TASK-M2-020-FE-027: Create DeleteProjectConfirmModal component
  - [ ] Create `components/DailyReport/DeleteProjectConfirmModal.tsx`:
    - [ ] Yellow warning icon
    - [ ] Title: "למחוק את פרויקט זה מהדוווח?"
    - [ ] Message: "הפעולה תסיר את כל השיוכים של הפרויקט מזה תדווח השעות. האם אתה בטוח שהרצת להמשיך?"
    - [ ] Two buttons:
      - [ ] "מעדיף שלא למחוק" (cancel)
      - [ ] "מחק את הפרויקט" (confirm delete, navy blue)
    - [ ] Props: `isOpen`, `onClose`, `onConfirm`, `projectName`
  - [ ] Create `DeleteProjectConfirmModal.module.css`

**Frontend - Integration:**
- [ ] TASK-M2-020-FE-028: Integrate modal with MonthHistory
  - [ ] Update `components/MonthHistory/MonthHistoryPage.tsx`:
    - [ ] Add state: `isDailyReportModalOpen`, `modalMode`, `editAttendanceId`
    - [ ] Open modal on "דיווח ידני" button click (create mode)
    - [ ] Open modal on "הוספת דיווח" click (create mode, pre-fill date from card)
    - [ ] Open modal on edit icon click (edit mode, fetch and pre-fill existing data)
    - [ ] Refresh month history after successful save
  - [ ] Update `components/BottomBar/BottomBar.tsx`:
    - [ ] Remove ComingSoonModal trigger
    - [ ] Call `onManualReportClick` prop to open DailyReportModal

- [ ] TASK-M2-020-FE-029: Implement form validation flow
  - [ ] In `WorkReportTab.tsx`, on save click:
    - [ ] Run `validateForm()` from useDailyReportForm
    - [ ] Show blue toast if hierarchy errors (selecting out of order)
    - [ ] Show red toast if required fields missing
    - [ ] Show IncompleteHoursModal if tracker < 100%
    - [ ] If all validations pass:
      - [ ] Call `createCombinedAttendance` mutation
      - [ ] Show loading state on save button
      - [ ] On success: close modal, show green toast, refresh data
      - [ ] On error: show red toast with error message

- [ ] TASK-M2-020-FE-030: Implement edit mode data pre-filling
  - [ ] In `DailyReportModal.tsx`, when `mode === 'edit'`:
    - [ ] Fetch existing attendance by ID (use getAttendanceById API)
    - [ ] Pre-fill date (read-only in edit mode)
    - [ ] Pre-fill entranceTime, exitTime
    - [ ] Pre-fill status → determine which tab to show
    - [ ] Pre-fill projectReports[] from projectTimeLogs
    - [ ] Handle project type changes:
      - [ ] If task's project changed from duration → startEnd, show 00:00 for times
    - [ ] Show loading skeleton while fetching

**Testing:**
- [ ] TASK-M2-020-TEST-001: Unit tests for utils
  - [ ] Test `validation.ts` functions (all edge cases)
  - [ ] Test `timeUtils.ts` functions (parsing, formatting)
  - [ ] Coverage target: ≥80%

- [ ] TASK-M2-020-TEST-002: Unit tests for hooks
  - [ ] Test `useDailyReportForm` state management
  - [ ] Test `useCreateDailyReport` mutation behavior
  - [ ] Test `useUpdateDailyReport` mutation behavior
  - [ ] Test `useProjectSelector` data fetching and transformation
  - [ ] Coverage target: ≥70%

- [ ] TASK-M2-020-TEST-003: Component tests
  - [ ] Test `WorkReportTab` renders correctly
  - [ ] Test project report add/edit/delete flows
  - [ ] Test validation error displays (toasts, modals)
  - [ ] Test save button enable/disable logic
  - [ ] Test time picker, date picker modals
  - [ ] Coverage target: ≥60%

- [ ] TASK-M2-020-TEST-004: Integration tests
  - [ ] Test full create flow (open modal → fill form → save → close)
  - [ ] Test full edit flow (open → update data → save)
  - [ ] Test validation scenarios (missing fields, incomplete hours, hierarchy errors)
  - [ ] Test project selector 3-step flow
  - [ ] Test absence report flow with file upload
  - [ ] Coverage target: ≥60%

**Final Validation:**
- [ ] TASK-M2-020-FINAL: Design & UX validation
  - [ ] All components match Figma mobile design
  - [ ] RTL layout correct for all Hebrew text
  - [ ] Colors match specification (BADGE_COLORS from constants)
  - [ ] Loading states visible during async operations
  - [ ] Error states display correctly with proper messaging
  - [ ] Success flow: toast → modal close → month history refresh
  - [ ] Animations smooth (accordion expand, modal open/close)
  - [ ] Accessibility: keyboard navigation, screen reader support
  - [ ] Overall test coverage: ≥60%

**Coverage Target**: ≥60% for DailyReport components + hooks  
**Validation**: User can create/edit daily reports with multiple project time logs

#### TASK-M2-022: Month History UI (User App)

**General Settings:**
- Mobile-only design, RTL (Hebrew)
- Scroll starts at top (most recent dates first)
- Images from `shared/image_components/` via `@images` Vite alias

**Color Palette (Badge Colors):**
- Green (work ≥9h): Dark `#106103`, Light `#E3F9CA`
- Orange (work <9h): Dark `#945312`, Light `#FEF5CC`
- Blue (absences): Dark `#0C3058`, Light `#F0F4FA`
- Red (missing): Dark `#AC2632`, Light `#FCE3D6`

**Month Navigation:**
- Arrows navigate within current year only
- Left arrow disabled on January, right arrow disabled on December

**Date Range Logic:**
- Current month: 1st → today (inclusive)
- Previous months: full month
- Future months: empty state ("לא הגענו לחודש הזה 😊")

**Badge Rules:**
- Weekend (Fri/Sat auto-detected): `סופ"ש` (Blue)
- No attendance (Sun-Thu workday): `חסר` (Red)
- Sickness/Reserves without document: `חסר` (Red)
- Sickness with document: `מחלה` (Blue)
- Reserves with document: `מילואים` (Blue)
- Day off: `יום חופש` (Blue)
- Half day off: `חצי יום חופש` (Blue)
- Work ≥9h: `X ש'` (Green)
- Work <9h: `X ש'` (Orange)
- Half day + Work same date: `חצי חופש/X ש'` (combined)

**Hours Calculation:**
- Sum of `(endTime - startTime)` for all DailyAttendance records on date
- Multiple DailyAttendance records per date supported

**Date Format:** `DD/MM/YY, יום X'` (e.g., `25/10/15, יום ד'`)

**Page States:**
- Loading: centered spinner
- Error: robot image (`Oops! 404 Error...png`) + "אופססס..." + retry button
- Future month: `next_month_background.png` + "לא הגענו לחודש הזה 😊"
- Current month empty: `empty_list.png` + "עוד לא דיווח כלום החודש 😅"
- Has data: date accordion list

**Time Logs:**
- Lazy load on accordion expand
- Show project name (grey) via taskId mapping from project selector

**Bottom Bar (fixed):**
- Left: `[▶ play.png] הפעלת שעון` (visible, non-functional for now)
- Right: `דיווח ידני [+]` (opens "Coming soon" modal)

**Modals:**
- "Coming soon" modal (Hebrew): Title "בקרוב", Message "העמוד בבנייה", Button "סגור"
- Edit button and "הוספת דיווח" also open this modal

**Icons (from `shared/image_components/`):**
- `LeftArrowIcon.png`, `RightArrowIcon.png` (month nav)
- `UpArrowIcon.png`, `DownArrowIcon.png` (accordion)
- `EditIcon.png` (edit button)
- `WorkDayIcon.png`, `CalendarNotWorkIcon.png` (calendar icons - decorative, not clickable)

**Files to Create:**
- [x] Config: Update `vite.config.ts` with `@images` alias → `../shared/image_components`
- [x] Types: `frontend_user/src/types/attendance.ts`, `timeLog.ts`, `projectSelector.ts`
- [x] Utils: `frontend_user/src/utils/dateUtils.ts` (Day.js helpers, Hebrew day names)
- [x] Utils: `frontend_user/src/utils/constants.ts` (colors, Hebrew strings)
- [x] Services: `frontend_user/src/services/attendanceApi.ts`
- [x] Services: `frontend_user/src/services/timeLogsApi.ts`
- [x] Services: `frontend_user/src/services/projectSelectorApi.ts` (SKIPPED - using embedded data from month history)
- [x] Hooks: `frontend_user/src/hooks/useMonthHistory.ts` (TanStack Query)
- [x] Hooks: `frontend_user/src/hooks/useTimeLogs.ts` (lazy load on expand)
- [x] Hooks: `frontend_user/src/hooks/useProjectSelector.ts` (SKIPPED - using embedded data from month history)
- [x] Component: `frontend_user/src/components/MonthHistory/MonthHistoryPage.tsx` (main page)
- [x] Component: `frontend_user/src/components/MonthHistory/MonthHistoryPage.module.css`
- [x] Component: `frontend_user/src/components/MonthHistory/MonthHeader.tsx`
- [x] Component: `frontend_user/src/components/MonthHistory/MonthAccordion.tsx`
- [x] Component: `frontend_user/src/components/MonthHistory/DayAccordionItem.tsx`
- [x] Component: `frontend_user/src/components/MonthHistory/DailyAttendanceCard.tsx`
- [x] Component: `frontend_user/src/components/MonthHistory/TimeLogRow.tsx`
- [x] Component: `frontend_user/src/components/MonthHistory/StatusBadge.tsx`
- [x] Component: `frontend_user/src/components/MonthHistory/StatusBadge.module.css`
- [x] Component: `frontend_user/src/components/MonthHistory/EmptyState.tsx`
- [x] Component: `frontend_user/src/components/MonthHistory/ErrorState.tsx`
- [x] Component: `frontend_user/src/components/MonthHistory/index.ts`
- [x] Component: `frontend_user/src/components/BottomBar/BottomBar.tsx`
- [x] Component: `frontend_user/src/components/BottomBar/BottomBar.module.css`
- [x] Component: `frontend_user/src/components/ComingSoonModal/ComingSoonModal.tsx`
- [x] Update: `frontend_user/src/App.tsx` to render MonthHistoryPage

**Tests (frontend):**
- [x] Component: renders multiple attendances per date
- [x] Component: status badges by total hours/status
- [x] Component: expand/collapse and edit/add actions
- [x] Component: loading/error/empty states
- [x] Hook: useMonthHistory fetches correct data
- [x] Hook: useTimeLogs lazy loads on expand
- [x] Utils: dateUtils Hebrew day names and formatting

- **Coverage Target**: ≥60% for MonthHistory components + hooks
- **Validation**: Month history matches Figma mobile layout and expanded card behavior

#### TASK-M2-090: Testing (Per `TESTING_GUIDE.md`)
- [ ] Add unit tests colocated with new backend utilities/services
  - [ ] Name tests as `[filename].test.ts`
- [ ] Add unit tests for new frontend hooks/components
  - [ ] Name tests as `[filename].test.tsx`
- [ ] Add integration tests for Member 2 backend flows:
  - [ ] Attendance create/update validations
  - [ ] Time logs create/update/delete validations
  - [ ] Project selector response shape and ordering
- [ ] Place integration tests under `backend/tests/integration/`
- **Validation**: Tests follow the naming/placement format in `TESTING_GUIDE.md`

---

### 🏢 MEMBER 3: Entity Management

**Feature Owner**: Clients, Projects, Tasks, Assignments CRUD (full-stack)

#### TASK-M3-010: Clients Backend (Per `doc/api/API.md` Section 3)
- [ ] Create `backend/src/routes/admin/Clients.ts`
- [ ] Implement `GET /api/admin/clients`:
  - [ ] Return all clients (filter active by default)
- [ ] Implement `POST /api/admin/clients`:
  - [ ] Zod schema: `{ name, description? }`
  - [ ] Return: `{ success: true, data: { id } }`
- [ ] Implement `PUT /api/admin/clients/:id`:
  - [ ] Zod schema: `{ name?, description?, active? }`
- [ ] Implement `DELETE /api/admin/clients/:id`:
  - [ ] Soft delete: set `active = false`
- **Validation**: Clients CRUD works

#### TASK-M3-011: Projects Backend (Per `doc/api/API.md` Section 4)
- [ ] Create `backend/src/routes/admin/Projects.ts`
- [ ] Implement `GET /api/admin/projects`:
  - [ ] Query param: `clientId` (optional filter)
- [ ] Implement `POST /api/admin/projects`:
  - [ ] Zod schema: `{ name, clientId, projectManagerId, startDate, endDate?, description? }`
- [ ] Implement `PUT /api/admin/projects/:id`
- [ ] Implement `DELETE /api/admin/projects/:id`:
  - [ ] Soft delete
- **Validation**: Projects CRUD works, filtering by client works

#### TASK-M3-012: Tasks Backend (Per `doc/api/API.md` Section 5)
- [ ] Create `backend/src/routes/admin/Tasks.ts`
- [ ] Implement `GET /api/admin/tasks`:
  - [ ] Query param: `projectId` (optional filter)
- [ ] Implement `POST /api/admin/tasks`:
  - [ ] Zod schema: `{ name, projectId, startDate?, endDate?, description?, status }`
- [ ] Implement `PUT /api/admin/tasks/:id`
- [ ] Implement `DELETE /api/admin/tasks/:id`:
  - [ ] Soft delete (hide inactive by default)
- **Validation**: Tasks CRUD works, filtering by project works

#### TASK-M3-013: Assignments Backend (Per `doc/api/API.md` Section 6)
- [ ] Create `backend/src/routes/admin/Assignments.ts`
- [ ] Implement `POST /api/admin/assignments`:
  - [ ] Zod schema: `{ userId, taskId }`
  - [ ] Create TaskWorker record
  - [ ] Return: `{ success: true, data: { id, taskId, userId } }`
  - [ ] Trigger cache refresh for project selector
- [ ] Implement `GET /api/admin/assignments`:
  - [ ] Return all assignments
- [ ] Implement `DELETE /api/admin/assignments/:id`:
  - [ ] Delete TaskWorker record
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
└── utils/Bcrypt.ts

frontend_user/src/
├── components/Login/LoginPage.tsx
├── context/AuthContext.tsx
├── hooks/useAuth.ts
└── components/ProtectedRoute.tsx

frontend_admin/src/
├── components/Login/LoginPage.tsx
├── components/Users/UsersTable.tsx
├── components/Users/UserForm.tsx
├── components/Users/ResetPasswordModal.tsx
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
├── routes/Projects.ts (selector endpoint)
├── services/ProjectSelector.ts
├── services/CombinedAttendance.ts
├── utils/TimeValidation.ts
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
