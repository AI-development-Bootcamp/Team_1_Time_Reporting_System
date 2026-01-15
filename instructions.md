# Time Reporting System (Course Version)

## 1. Project Overview

### Project Name
Time Reporting System (Course Version)

### One-line Description
A time-tracking platform built with TypeScript, featuring two distinct React interfaces (User & Admin) backed by a shared Express.js server for reporting work hours, managing absences, and controlling project budgets.

### Why are we building this?
To create a unified, transparent standard for reporting hours across the organization, reducing errors, and enabling efficient management of employee attendance and project assignments.

### Who are the users?
1. **Employees**: Report daily hours (manual/timer) and absences.
2. **Admins**: Admins are also employees with access to both platforms. They can report daily hours and absences (like regular employees) AND manage users, clients, projects, tasks, assignments, and perform monthly report closures.

---

## 2. Requirements

### Functional Requirements

#### Must Have (Critical)
- [ ] **Auth System**: Admin-created users (via UI), JWT-based login (24h expiry). Initial setup: Start with mock/seed data, later implement admin UI for user creation.
- [ ] **Dual Frontend Architecture**:
  1. `frontend_user`: Reporting & History (for Employees & Admins).
  2. `frontend_admin`: Management Dashboard (Admins only).
- [ ] **Manual Time Reporting**: Manual entry for daily hours with multiple time entries per day. The "Project" selector must group Projects by Client header, sorted by usage frequency (per user, last week usage). Minimum time unit: 1 minute. Reports stored as start/end times per task, not total hours.
- [ ] **Admin CRUD**: Management of Users (Soft Delete), Clients, Projects, and Tasks. Admin can create, update, and soft-delete users. User update includes: email, password, name, role, is_active status.
- [ ] **Hierarchy Logic**: Clients are unique companies. Each Client has many Projects (e.g., frontend build, backend build). Each Project has many Tasks (e.g., UI/UX, DB creation). Users are assigned to Tasks.
- [ ] **Validations**: Block if End Time < Start Time.
- [ ] **Month History Report**: View month history report with detailed UI (see UI Specifications below).

#### Should Have (Important)
- [ ] **Timer Functionality**: Timer for time tracking with auto-stop at 23:59. If left running, it saves as "Incomplete".
- [ ] **Absence Management**: Reporting Vacation/Sickness/Reserve with Binary File Upload (stored as Bytes in DB via Prisma).
- [ ] **Month Locking**: Admin capability to lock reporting for specific months to prevent retroactive editing.
- [ ] **Visual Dashboard**: Progress bar for daily 9-hour standard.
- [ ] **Validations**: Alerts for <9h or >9h daily.
- [ ] **Overlapping Reports**: Allow reporting different tasks for the same time window (e.g., working on 2 projects simultaneously). Multiple time entries can be saved per day, including overlapping time windows.

#### Nice to Have (Bonus)
- [ ] **Password Reset**: Password reset by Admin only. Admin sets new password directly for users.
- [ ] **Frequency Sorting**: Dynamic sorting of the dropdowns based on the user's most frequent choices.
- [ ] **Past Month Reports**: Option to pick past information of month report, one year behind.

### Non-Functional Requirements
- **Performance**: 
  - **Design Approach**: 
    - `frontend_user`: Mobile-first responsive design (optimized for mobile devices).
    - `frontend_admin`: Web-first design (optimized for desktop/laptop screens).
  - **Speed Requirements**:
    - **Critical (Must be fast)**:
      - Login/Authentication: < 1 second response time.
      - Manual time entry submission: < 500ms response time.
      - Project selector dropdown loading: < 300ms (should be cached/preloaded).
      - View month history report: < 2 seconds for initial load.
    - **Important (Should be fast)**:
      - Timer start/stop operations: < 200ms response time.
      - Absence file upload: < 3 seconds for files up to 5MB.
      - Admin CRUD operations (create/update/delete): < 1 second response time.
      - Admin dashboard data loading: < 2 seconds for initial load.
    - **Optimization Targets**:
      - API endpoints should respond within 500ms for standard operations.
      - Database queries should be optimized with proper indexing.
      - Frontend should implement lazy loading and code splitting where appropriate.
      - Use caching strategies for frequently accessed data (project lists, user assignments).
      - **Project Selector Caching**: Cache project lists grouped by client, sorted by usage frequency (per user, last week). Refresh cache when new assignments are made or daily reports are submitted. Use best practice approach (in-memory cache with TTL or Redis for production).
- **Security**: 
  - JWT Tokens, Binary file storage in DB (PostgreSQL).
  - File Upload Restrictions: Only `.pdf`, `.jpg`, and `.png` formats allowed. Maximum file size: 5MB. Block large uploads.
- **UX**: Right-to-Left (Hebrew) interface, Mantine UI Library.
- **Infrastructure**: Dockerized environment, CI/CD with GitHub Actions.
- **Testing**: Unit tests using Vitest.

---

## 3. Technical Decisions

### Stack

#### Frontend Layer
- **Technology**: React + Mantine + TypeScript (Vite template)
- **Reason**: User request; Mobile-first responsive requirement.

#### Backend Layer
- **Technology**: Node.js + Express.js + TypeScript (ts-node for dev, tsc for build)
- **Reason**: User request.
- **Validation**: Zod
  - **Reason**: Works seamlessly with TypeScript as it infers types automatically, providing type-safe validation.

#### Data Layer
- **ORM**: Prisma
  - **Reason**: User request; Type-safe DB access and migration management.
- **Database**: PostgreSQL
  - **Reason**: Source requirement; supports BYTEA (Prisma Bytes) for files.

#### Development Tools
- **Testing**: Vitest
  - **Reason**: User request.
- **Orchestration**: npm scripts + concurrently
  - **Reason**: To run specific service combinations.

### Folder Structure (Monorepo)
Designed to support 3 separate services running via root commands.

```
/
├── backend/
│   ├── prisma/          # schema.prisma, migrations
│   ├── src/             # Express App (TypeScript)
│   └── tsconfig.json    # TypeScript configuration
├── frontend_user/       # React App: Reporting (TypeScript + Vite)
├── frontend_admin/      # React App: Management (TypeScript + Vite)
└── package.json         # Root config
```

### Run Configuration (npm scripts)
The root `package.json` will utilize `concurrently` to support the following commands:

1. `npm run dev:all` → Runs Backend + Frontend User + Frontend Admin.
2. `npm run dev:user` → Runs Backend + Frontend User.
3. `npm run dev:admin` → Runs Backend + Frontend Admin.

### API Endpoints

Base URL: `/api`  
Auth: JWT Bearer token (`Authorization: Bearer <token>`)

#### API Conventions

**Standard Response Envelope:**

Success:
```json
{ "success": true, "data": {} }
```

Error:
```json
{
  "success": false,
  "error": {
    "code": "SOME_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

**Common HTTP Status Codes:**
- **200** OK
- **201** Created
- **400** Validation error / bad input
- **401** Unauthorized (missing/invalid token)
- **403** Forbidden (role not allowed)
- **404** Not found
- **409** Conflict (e.g., month locked)
- **413** File too large
- **415** Unsupported file type
- **500** Internal server error

**Common Error Codes:**
- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `MONTH_LOCKED`
- `CONFLICT`
- `FILE_TOO_LARGE`
- `UNSUPPORTED_FILE_TYPE`
- `INTERNAL_ERROR`

#### 1. Authentication

**POST `/api/auth/login`**
Login and receive JWT (24h expiry).

**Auth:** Public

**Request Body:**
```json
{
  "mail": "user@example.com",
  "password": "Password123"
}
```

**200 OK Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt...",
    "expiresInHours": 24,
    "user": {
      "id": 1,
      "name": "Dor",
      "mail": "user@example.com",
      "userType": "admin",
      "active": true,
      "createdAt": "2026-01-14T10:00:00.000Z",
      "updatedAt": "2026-01-14T10:00:00.000Z"
    }
  }
}
```

**Errors:**
- 400 `VALIDATION_ERROR` (missing/invalid fields)
- 401 `UNAUTHORIZED` (wrong credentials)

#### 2. Users (Admin)

> Users are **soft-deleted** by setting `active=false`.

**GET `/api/admin/users?active=true`**
List users (filter by active/inactive).

**Auth:** Required  
**Role:** `admin`

**Query Params:**
- `active` (boolean, optional)

**200 OK Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Admin",
      "mail": "admin@example.com",
      "userType": "admin",
      "active": true,
      "createdAt": "2026-01-01T09:00:00.000Z",
      "updatedAt": "2026-01-10T09:00:00.000Z"
    }
  ]
}
```

**POST `/api/admin/users`**
Create user.

**Auth:** Required  
**Role:** `admin`

**Request Body:**
```json
{
  "name": "New Worker",
  "mail": "worker@example.com",
  "password": "Password123",
  "userType": "worker"
}
```

**201 Created Response:**
```json
{
  "success": true,
  "data": { "id": 22 }
}
```

**PUT `/api/admin/users/:id`**
Update user fields (including `active` and password if allowed).

**Auth:** Required  
**Role:** `admin`

**Request Body (example):**
```json
{
  "name": "Updated Name",
  "userType": "worker",
  "active": true
}
```

**DELETE `/api/admin/users/:id`**
Soft delete user (`active=false`).

**Auth:** Required  
**Role:** `admin`

**POST `/api/admin/users/:id/reset-password`**
Admin sets a new password directly.

**Auth:** Required  
**Role:** `admin`

**Request Body:**
```json
{ "newPassword": "NewStrongPassword123" }
```

#### 3. Clients (Admin)

**GET `/api/admin/clients`**
List clients.

**Auth:** Required  
**Role:** `admin`

**POST `/api/admin/clients`**
Create client.

**Request Body:**
```json
{ "name": "New Client", "description": "Optional" }
```

**PUT `/api/admin/clients/:id`**
Update client.

**Request Body:**
```json
{ "name": "Updated Client", "description": null, "active": true }
```

**DELETE `/api/admin/clients/:id`**
Soft delete client (`active=false`).

#### 4. Projects (Admin)

**GET `/api/admin/projects`**
List projects.

**Auth:** Required  
**Role:** `admin`

**POST `/api/admin/projects`**
Create project.

**Request Body:**
```json
{
  "name": "Backend Build",
  "clientId": 1,
  "projectManagerId": 1,
  "startDate": "2026-01-15",
  "endDate": null,
  "description": "Build API"
}
```

**PUT `/api/admin/projects/:id`**
Update project.

**DELETE `/api/admin/projects/:id`**
Soft delete project (`active=false`).

#### 5. Tasks (Admin)

**GET `/api/admin/tasks?projectId=5`**
List tasks (optional filter by project).

**Auth:** Required  
**Role:** `admin`

**Query Params:**
- `projectId` (number, optional)

**POST `/api/admin/tasks`**
Create task.

**Request Body:**
```json
{
  "name": "DB Creation",
  "projectId": 5,
  "startDate": "2026-01-20",
  "endDate": null,
  "description": "Create schema",
  "status": "open",
  "workerIds": [2, 3]
}
```

**PUT `/api/admin/tasks/:id`**
Update task.

**DELETE `/api/admin/tasks/:id`**
Soft delete task (`active=false` on DB layer; API can hide inactive tasks by default).

#### 6. Assignments (Admin)

> If assignments are stored as a join table in DB, this API manages it.  
> If stored only as `workerIds[]` on `Task`, then this section can be simplified to "update task workerIds".

**POST `/api/admin/assignments`**
Assign worker to task.

**Auth:** Required  
**Role:** `admin`

**Request Body:**
```json
{ "workerId": 2, "taskId": 55 }
```

**201 Created Response:**
```json
{ "success": true, "data": { "id": 999 } }
```

**GET `/api/admin/assignments`**
List all assignments.

**DELETE `/api/admin/assignments/:id`**
Remove assignment.

#### 7. Daily Attendance (Reporting)

> DailyAttendance represents a daily record.  
> It can be used for:
> - Work day entry (manual/timer)
> - Sickness / reserves / dayOff / halfDayOff (absence-like statuses)

**POST `/api/attendance`**
Create a DailyAttendance record (manual entry or timer stop).

**Auth:** Required  
**Role:** `worker` or `admin` (as employee)

**Request Body:**
```json
{
  "date": "2026-01-14",
  "startTime": "2026-01-14T09:00:00.000Z",
  "endTime": "2026-01-14T17:30:00.000Z",
  "status": "work",
  "description": "Worked normally"
}
```

**Validations:**
- Block if `endTime < startTime`
- Minimum precision: 1 minute
- If month is locked → block

**201 Created Response:**
```json
{
  "success": true,
  "data": { "id": 701 }
}
```

**Errors:**
- 400 `VALIDATION_ERROR`
- 409 `MONTH_LOCKED`

**GET `/api/attendance/month-history?year=2026&month=1&workerId=optional`**
Returns month history of DailyAttendance (for UI accordion).

**Auth:** Required  
**Role:** `worker` (self) / `admin` (can view others)

**200 OK Response:**
```json
{
  "success": true,
  "data": {
    "year": 2026,
    "month": 1,
    "items": [
      {
        "id": 701,
        "workerId": 2,
        "date": "2026-01-14",
        "startTime": "2026-01-14T09:00:00.000Z",
        "endTime": "2026-01-14T17:30:00.000Z",
        "status": "work",
        "description": "Worked normally",
        "createdAt": "2026-01-14T18:00:00.000Z",
        "updatedAt": "2026-01-14T18:00:00.000Z"
      }
    ]
  }
}
```

**PUT `/api/attendance/:id`**
Update an existing DailyAttendance record.

**Errors:**
- 409 `MONTH_LOCKED`

**DELETE `/api/attendance/:id`**
Delete a DailyAttendance record (implementation choice: hard delete or soft delete — define in backend).

#### 8. Project Time Logs (Per-day entries per task)

> ProjectTimeLogs connects a DailyAttendance record to task-based time logs.  
> Overlapping logs are allowed.

**POST `/api/time-logs`**
Create a time log entry for a DailyAttendance.

**Auth:** Required

**Request Body:**
```json
{
  "dailyAttendanceId": 701,
  "taskId": 55,
  "duration": 120,
  "description": "Worked on UI"
}
```

**201 Created Response:**
```json
{ "success": true, "data": { "id": 9001 } }
```

**Errors:**
- 400 `VALIDATION_ERROR`
- 404 `NOT_FOUND` (attendance or task not found)
- 409 `MONTH_LOCKED` (if the day/month is locked)

**GET `/api/time-logs?dailyAttendanceId=701`**
List time logs for a specific day.

**PUT `/api/time-logs/:id`**
Update time log.

**DELETE `/api/time-logs/:id`**
Delete time log.

#### 9. Absences

> Absence model stores:
> - `dailyAttendanceIds[]` — the days included in the absence
> - `documentUrl` — optional link (if stored in DB as Bytes, expose a download URL)

**POST `/api/absences`**
Create an absence record.

**Auth:** Required

**Request Body:**
```json
{
  "dailyAttendanceIds": [701, 702],
  "documentUrl": null
}
```

**201 Created Response:**
```json
{ "success": true, "data": { "id": 12 } }
```

**POST `/api/absences/upload`** (multipart/form-data)
Upload absence document (pdf/jpg/png up to 5MB) and attach it to an absence.

**Auth:** Required  
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `absenceId` (number, required)
- `file` (required) `.pdf | .jpg | .png` max 5MB

**200 OK Response:**
```json
{
  "success": true,
  "data": {
    "absenceId": 12,
    "documentUrl": "/api/absences/12/document"
  }
}
```

**Errors:**
- 413 `FILE_TOO_LARGE`
- 415 `UNSUPPORTED_FILE_TYPE`

**GET `/api/absences/:id/document`**
Download/view absence document.

**Auth:** Required  
**Notes:** return the binary stream with correct `Content-Type`.

#### 10. Month Locking (Admin)

**PUT `/api/admin/month-lock`**
Lock/unlock a month.

**Auth:** Required  
**Role:** `admin`

**Request Body:**
```json
{ "year": 2026, "month": 1, "isLocked": true }
```

**200 OK Response:**
```json
{
  "success": true,
  "data": { "year": 2026, "month": 1, "isLocked": true }
}
```

#### API Role Rules Summary

- **`worker`:**
  - Can login
  - Can create/update attendance & time logs for self (unless month locked)
  - Can view month history for self

- **`admin`:**
  - Everything worker can do (as employee)
  - Admin CRUD: users/clients/projects/tasks
  - Manage assignments
  - Lock/unlock months
  - Can view other workers data via optional `workerId` query params

### TypeScript Data Models (API Contracts)

These TypeScript interfaces represent the data models used in API requests/responses and frontend components.

```typescript
export type UserType = 'worker' | 'admin';
export type TaskStatus = 'open' | 'closed';
export type DailyAttendanceStatus = 'work' | 'sickness' | 'reserves' | 'dayOff' | 'halfDayOff';

export interface User {
  id: number;
  name: string;
  mail: string;
  userType: UserType;
  active: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface Client {
  id: number;
  name: string;
  description?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  name: string;
  clientId: number;
  projectManagerId: number;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD | null
  description?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  name: string;
  projectId: number;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  workerIds?: number[]; // Array of worker IDs assigned to this task
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DailyAttendance {
  id: number;
  workerId: number;
  date: string; // YYYY-MM-DD
  startTime: string; // ISO Time
  endTime: string; // ISO Time
  description?: string | null;
  status: DailyAttendanceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTimeLogs {
  id: number;
  dailyAttendanceId: number;
  taskId: number;
  duration: number; // in minutes
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Absence {
  id: number;
  dailyAttendanceIds?: number[]; // DailyAttendance ids of the days that the user absence
  documentUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}
```

**Notes:**
- These TypeScript interfaces match the database table layout and are used for API contracts and frontend type definitions.
- Field names match the database schema (snake_case in DB, camelCase in TypeScript).
- The Prisma schema (below) represents the actual database structure with proper PostgreSQL types.

### Data Models (Prisma Schema)

#### Core Models

Based on the database table layout (PostgreSQL schema).

```prisma
enum UserType {
  worker
  admin
}

enum TaskStatus {
  open
  closed
}

enum DailyAttendanceStatus {
  work
  sickness
  reserves
  dayOff
  halfDayOff
}

model User {
  id        BigInt    @id @default(autoincrement())
  name      String    @db.Text
  mail      String    @unique @db.Text
  password  String    @db.Text // Hashed password
  userType  UserType  @default(worker)
  active    Boolean   @default(true) // Soft Delete
  createdAt DateTime  @default(now()) @db.Timestamptz
  updatedAt DateTime  @updatedAt @db.Timestamptz

}

model Client {
  id          BigInt    @id @default(autoincrement())
  name        String    @db.Text
  description String?   @db.Text
  active      Boolean   @default(true) // Soft Delete
  createdAt   DateTime  @default(now()) @db.Timestamptz
  updatedAt   DateTime  @updatedAt @db.Timestamptz
}

model Project {
  id                BigInt    @id @default(autoincrement())
  name              String    @db.Text
  clientId          BigInt    @reference to client.id(fk)
  projectManagerId  BigInt    @reference to a user.id(fk)
  startDate         DateTime  @db.Date
  endDate           DateTime? @db.Date
  description       String?   @db.Text
  active            Boolean   @default(true) // Soft Delete
  createdAt         DateTime  @default(now()) @db.Timestamptz
  updatedAt         DateTime  @updatedAt @db.Timestamptz
}

model Task {
  id          BigInt      @id @default(autoincrement())
  name        String      @db.Text
  projectId   BigInt      @reference to project.id(fk)
  startDate   DateTime?   @db.Date
  endDate     DateTime?   @db.Date
  description String?     @db.Text
  workerIds   BigInt[]    // Array of worker IDs assigned to this task
  status      TaskStatus  @default(open)
  createdAt   DateTime    @default(now()) @db.Timestamptz
  updatedAt   DateTime    @updatedAt @db.Timestamptz
}

model DailyAttendance {
  id          BigInt                @id @default(autoincrement())
  workerId    BigInt                @reference to user.id(fk)
  date        DateTime              @db.Date
  startTime   DateTime?             @db.Time
  endTime     DateTime?             @db.Time
  status      DailyAttendanceStatus
  description String?               @db.Text
  createdAt   DateTime              @default(now()) @db.Timestamptz
  updatedAt   DateTime              @updatedAt @db.Timestamptz
  
  worker          User              @relation(fields: [workerId], references: [id])
  projectTimeLogs ProjectTimeLogs[]
}

model ProjectTimeLogs {
  id                BigInt   @id @default(autoincrement())
  dailyAttendanceId BigInt   @reference to dailyattendance.id(fk)
  taskId            BigInt   @refernce to task.id(fk)
  durationMin       Int      // Duration in minutes
  description       String?  @db.Text
  createdAt         DateTime @default(now()) @db.Timestamptz
  updatedAt         DateTime @updatedAt @db.Timestamptz
}

model Absence {
  id                 BigInt    @id @default(autoincrement())
  dailyAttendanceIds BigInt[]  // Array of DailyAttendance IDs for the absence days
  documentUrl        String?   @db.Text // URL or path to document (if stored as file, not in DB)
  createdAt          DateTime  @default(now()) @db.Timestamptz
  updatedAt          DateTime  @updatedAt @db.Timestamptz
}
```

#### Notes
- All models use `BigInt` with `@default(autoincrement())` for primary keys (matching PostgreSQL BIGSERIAL).
- Soft deletes implemented via `active` boolean field (default: true).
- User-Task assignments stored as `workerIds` array on Task model (BIGINT[] in PostgreSQL).
- DailyAttendance stores daily records with optional start/end times (TIME type).
- ProjectTimeLogs stores task-based time entries with duration in minutes (not start/end times).
- Absence stores `dailyAttendanceIds` array and `documentUrl` (TEXT) - file storage implementation choice.
- All timestamp fields use `@db.Timestamptz` to match PostgreSQL TIMESTAMPTZ.
- Date fields use `@db.Date` to match PostgreSQL DATE.
- Time fields use `@db.Time` to match PostgreSQL TIME.

### Implementation Details

#### User Management
- **Initial Setup**: Start with seed data (mock users, clients, projects, tasks).
- **User Creation**: Admin UI for creating users (fields: mail, password, name, userType).
- **User Update**: Admin UI for updating employee information (mail, password, name, userType, active).
- **Password Reset**: Admin sets new password directly (no reset link flow).

#### Time Reporting Structure
- **Daily Attendance**: One DailyAttendance record per user per day (stores date, startTime, endTime, status).
- **Project Time Logs**: Multiple ProjectTimeLogs records per DailyAttendance (stores taskId, duration in minutes).
- **Time Storage**: 
  - DailyAttendance stores overall start/end times for the day (TIME type, nullable).
  - ProjectTimeLogs stores duration in minutes per task (not start/end times per task).
- **Minimum Unit**: 1 minute precision.
- **Overlapping Entries**: Allowed for different tasks (e.g., working on 2 projects simultaneously via multiple ProjectTimeLogs).
- **Status Tracking**: DailyAttendance includes status (work, sickness, reserves, dayOff, halfDayOff).

#### Project Selector Sorting
- **Frequency Calculation**: Per user, based on last week's usage (7 days).
- **Caching Strategy**: Cache project lists with refresh on:
  - New user-task assignments
  - Daily report submissions
  - Best practice: In-memory cache with TTL or Redis for production.

#### File Upload (Absences)
- **Allowed Formats**: `.pdf`, `.jpg`, `.png` only.
- **Maximum Size**: 5MB.
- **Storage**: Implementation choice - can store as file path/URL in `documentUrl` (TEXT field) or as binary in separate storage system.
- **Validation**: Block uploads that don't meet format/size requirements.
- **Note**: Absence model uses `dailyAttendanceIds` array to link to DailyAttendance records and `documentUrl` for file reference.

### UI Specifications

#### Month History Report (Mobile UI Focus - frontend_user)

**Report Content (UI Layout):**

**Header:**
- Month/Year Selector with Left/Right navigation arrows (e.g., `< October >`).

**Visual View:**
- A Vertical Accordion List listing days in descending order (newest on top).

**List Item (Collapsed State):**
- **Right Side**: Date (e.g., "16/10/25, Thu") and a visual Icon:
  - Briefcase icon for work
  - Calendar/X icon for absence
- **Left Side**: A Status Badge (Pill shape) indicating the daily summary:
  - 🔴 **Red ("Missing/Haser")**: No hours or critical missing info.
  - 🟢 **Green ("9h")**: Full daily quota met.
  - 🟡 **Yellow ("7h" / Warning)**: Partial day (below quota).
  - 🔵 **Blue ("Sick/Weekend")**: Special status (Sick Leave, Weekend, Holiday).

**List Item (Expanded State):**
- Displays a list of specific time entries for that day.

**Entry Card Details:**
- **Actions**: "Edit" button (Pencil icon) on the top right of the entry.
- **Time**: Start Time - End Time (e.g., 09:00-14:00) in blue text.
- **Context**: Client Name (e.g., "Globaly") and Project/Track Name (e.g., "Design Track").
- **Duration**: Calculated total hours for that entry (e.g., "05:30 h").
- **Footer Action**: A generic "Add Report" (הוספת דיווח) button at the bottom of the day card to add a new entry for that specific date.

**Filtering/Sorting:**
- **User App**: Filter by Month/Year (via the header navigation).
- **Admin App**: Same view, but with a User Select dropdown to view a specific employee's list.

**Export:**
- Not required for MVP.

#### Daily Report Entry (Manual Time Reporting)

**Component Structure:**
- Date selector (defaults to today).
- "Add Project" button that opens a project report component.

**Project Report Component:**
- **Client Selection**: Dropdown (grouped by Client, sorted by last week usage frequency).
- **Project Selection**: Dropdown (filtered by selected Client).
- **Task Selection**: Dropdown (filtered by selected Project, only tasks assigned to user).
- **Location of Work**: Radio/Select options:
  - Home
  - Office
  - In-Client
- **Start Time**: Time picker.
- **End Time**: Time picker.
- **Description Box**: Text area (optional).
- **Delete Project Button**: Closes/removes the project component.

**Report Storage:**
- DailyAttendance stores overall day start/end times (optional TIME fields).
- Each project entry stored as ProjectTimeLogs record with taskId and duration (in minutes).
- Multiple ProjectTimeLogs entries can be added per DailyAttendance.
- Entries can overlap in time windows (for different tasks) via multiple ProjectTimeLogs with same/different durations.

---

## 4. Tasks Breakdown

### Phase 1: Setup
- [ ] **TASK-001**: Init Git Repo + Monorepo Structure (backend, frontend_user, frontend_admin) with TypeScript configuration.
- [ ] **TASK-002**: Configure root package.json with concurrently scripts for the 3 run modes.
- [ ] **TASK-003**: Docker Compose setup (Postgres + Node services).
- [ ] **TASK-004**: Prisma Setup: Init Prisma in /backend, define complete schema.prisma (all models), and run initial migration.
- [ ] **TASK-005**: Create seed script with mock data (initial admin user, sample clients, projects, tasks, user assignments).

### Phase 2: Backend (Express + Prisma)
- [ ] **TASK-010**: Setup Express Server with TypeScript (ts-node/tsc) + Auth Middleware (JWT) + Zod validation.
- [ ] **TASK-011**: Prisma CRUD: Implement Services/Controllers for Clients/Projects/Tasks/User-Task Assignments using Prisma Client (TypeScript).
- [ ] **TASK-012**: Manual Reporting Logic (Time entry validation with Zod, End Time < Start Time blocking for DailyAttendance). Support multiple ProjectTimeLogs entries per day with overlapping time windows. Store duration in minutes per task entry.
- [ ] **TASK-012b**: Timer Functionality (Timer handling, Midnight auto-stop job) - Should Have.
- [ ] **TASK-013**: Binary File Upload Implementation (Multer -> Buffer -> Prisma Bytes field) - Should Have.
- [ ] **TASK-014**: Admin Logic (Implement Soft Deletes via Prisma middleware or explicit filters).
- [ ] **TASK-015**: Setup Vitest for backend unit testing.

### Phase 3: Frontend (React + Mantine)
- [ ] **TASK-020**: Setup frontend_user & frontend_admin with TypeScript (Vite template) + Mantine Provider (RTL).
- [ ] **TASK-021**: Build "Smart Project Selector" Component (Grouped Select by Client, sorted by last week usage frequency per user, with caching).
- [ ] **TASK-022**: Build Manual Daily Report View (with Add Project component) & Month History Report (accordion UI with status badges) (User App).
- [ ] **TASK-022b**: Build Timer Component (User App) - Should Have.
- [ ] **TASK-023**: Build Management Tables (Admin App: Users, Projects, Assignments).

### Phase 4: Integration
- [ ] **TASK-030**: Connect Auth & JWT handling on both Frontends.
- [ ] **TASK-031**: Integrate File Upload with Backend.
- [ ] **TASK-032**: Enforce "Month Lock" logic on UI (Disable editing) - Should Have.

### Phase 5: Polish
- [ ] **TASK-040**: Hebrew Translations & RTL Layout fixes.
- [ ] **TASK-041**: Edge case testing (Timer at midnight).

---

## 5. Progress Tracking

| Phase | Status | Notes |
|-------|--------|-------|
| Setup | Not Started | |
| Backend | Not Started | Express + Prisma |
| Frontend | Not Started | 2 Separate Apps |
| Integration | Not Started | |
| Polish | Not Started | |

---

## 6. Done Criteria

### Minimum Viable Product (MVP)
- [ ] Docker environment runs successfully.
- [ ] npm run commands successfully launch the specific service combinations.
- [ ] Prisma Migrations applied successfully to PostgreSQL with complete schema (all models).
- [ ] Seed data loads successfully (mock users, clients, projects, tasks).
- [ ] Users can log in with JWT authentication (24h expiry).
- [ ] Users can report time manually with multiple project entries per day.
- [ ] Project selector groups by Client and sorts by last week usage frequency.
- [ ] Users can view month history reports with accordion UI and status badges.
- [ ] Admin can create, update, and soft-delete users via UI.
- [ ] Admin can manage entities (Clients, Projects, Tasks) via CRUD operations.
- [ ] Admin can assign users to tasks (many-to-many).
- [ ] Validations block invalid time entries (End Time < Start Time).
- [ ] File uploads restricted to .pdf, .jpg, .png (max 5MB).

### Tests to Pass
- [ ] All API endpoints functional.
- [ ] Unit Tests running via Vitest (60% coverage).
- [ ] UI displays data correctly in RTL.
- [ ] No console errors.
