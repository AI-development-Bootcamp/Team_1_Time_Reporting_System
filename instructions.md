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

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login and receive JWT. |

#### User Reporting
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/my-projects-stats` | Get projects assigned to user (Grouped by Client, Sorted by Frequency - last week usage). |
| POST | `/api/reports` | Submit daily report (Manual/Timer stop). |
| GET | `/api/reports/month-history` | Get month history report for user. |
| POST | `/api/absences` | Upload absence report + File (Multipart -> Prisma Bytes). |

#### Admin - User Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List users (Admin Dashboard) with Active/Inactive filter. |
| POST | `/api/admin/users` | Create new user (Email, Password, Name, Role). |
| PUT | `/api/admin/users/:id` | Update user details (Name, Role, is_active status). |
| DELETE | `/api/admin/users/:id` | Soft Delete (is_active = false). |
| POST | `/api/admin/users/:id/reset-password` | Admin forces password reset (sets new password directly). |

#### Admin - Entity CRUD
**Note**: All DELETE operations implement Soft Delete (isActive = false).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/clients` | List all clients. |
| POST | `/api/admin/clients` | Create new client. |
| PUT | `/api/admin/clients/:id` | Update client. |
| DELETE | `/api/admin/clients/:id` | Soft delete client. |
| GET | `/api/admin/projects` | List all projects. |
| POST | `/api/admin/projects` | Create new project (requires client_id). |
| PUT | `/api/admin/projects/:id` | Update project. |
| DELETE | `/api/admin/projects/:id` | Soft delete project. |
| GET | `/api/admin/tasks` | List all tasks. |
| POST | `/api/admin/tasks` | Create new task (requires project_id). |
| PUT | `/api/admin/tasks/:id` | Update task. |
| DELETE | `/api/admin/tasks/:id` | Soft delete task. |

#### Admin - Assignments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/assignments` | Assign Users to Tasks (Many-to-Many relationship). |
| GET | `/api/admin/assignments` | List all user-task assignments. |
| DELETE | `/api/admin/assignments/:id` | Remove user-task assignment. |

#### Admin - Month Locking
| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/admin/month-lock` | Lock/Unlock specific month. |

### Data Models (Prisma Schema)

#### Core Models

// Need to Update according to the Data models that Dor created (After approval in the pull request).

```prisma
enum Role {
  ADMIN
  EMPLOYEE
}

enum AbsenceType {
  VACATION
  SICKNESS
  RESERVE
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String   // Hashed password
  name      String
  role      Role     @default(EMPLOYEE)
  isActive  Boolean  @default(true) // Soft Delete
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  reports       DailyReport[]
  absences      Absence[]
  assignments   UserTaskAssignment[]
}

model Client {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  isActive    Boolean  @default(true) // Soft Delete
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  projects    Project[]
}

model Project {
  id          Int      @id @default(autoincrement())
  clientId    Int
  projectName String
  status      String   @default("active") // 'active', 'inactive', 'closed'
  startDate   DateTime?
  endDate     DateTime?
  description String?
  isActive    Boolean  @default(true) // Soft Delete
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  client      Client   @relation(fields: [clientId], references: [id])
  tasks       Task[]
}

model Task {
  id        Int      @id @default(autoincrement())
  projectId Int
  name      String
  status    String   @default("open") // 'open', 'closed'
  isActive  Boolean  @default(true) // Soft Delete
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  project     Project            @relation(fields: [projectId], references: [id])
  assignments UserTaskAssignment[]
  reportEntries ProjectReportEntry[]
}

model DailyReport {
  id        Int      @id @default(autoincrement())
  userId    Int
  date      DateTime @db.Date
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user           User                @relation(fields: [userId], references: [id])
  projectEntries ProjectReportEntry[]
}

model ProjectReportEntry {
  id            Int      @id @default(autoincrement())
  dailyReportId Int
  taskId        Int
  startTime     DateTime
  endTime       DateTime
  location      String   // 'home', 'office', 'in-client'
  description   String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  dailyReport   DailyReport @relation(fields: [dailyReportId], references: [id])
  task          Task        @relation(fields: [taskId], references: [id])
}

model UserTaskAssignment {
  id        Int      @id @default(autoincrement())
  userId    Int
  taskId    Int
  createdAt DateTime @default(now())
  
  user      User @relation(fields: [userId], references: [id])
  task      Task @relation(fields: [taskId], references: [id])
  
  @@unique([userId, taskId])
}

model Absence {
  id        Int         @id @default(autoincrement())
  userId    Int
  type      AbsenceType
  startDate DateTime    @db.Date
  endDate   DateTime    @db.Date
  fileData  Bytes?      // Binary storage (BYTEA)
  mimeType  String?     // 'application/pdf', 'image/jpeg', 'image/png'
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  
  user      User        @relation(fields: [userId], references: [id])
}

model MonthLock {
  id        Int      @id @default(autoincrement())
  year      Int
  month     Int      // 1-12
  isLocked  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([year, month])
}
```

#### Notes
- All models use `Int` with `@default(autoincrement())` for primary keys (self-incrementing).
- Soft deletes implemented via `isActive` boolean field (default: true).
- User-Task assignments are many-to-many via `UserTaskAssignment` relation table.
- Daily reports store multiple project entries per day (start/end times, not totals).
- File uploads stored as `Bytes` in PostgreSQL BYTEA format.

### Implementation Details

#### User Management
- **Initial Setup**: Start with seed data (mock users, clients, projects, tasks).
- **User Creation**: Admin UI for creating users (fields: email, password, name, role).
- **User Update**: Admin UI for updating employee information (email, password, name, role, is_active).
- **Password Reset**: Admin sets new password directly (no reset link flow).

#### Time Reporting Structure
- **Daily Report**: One DailyReport record per user per day.
- **Project Entries**: Multiple ProjectReportEntry records per DailyReport.
- **Time Storage**: Each entry stores start_time and end_time (DateTime), not total hours.
- **Minimum Unit**: 1 minute precision.
- **Overlapping Entries**: Allowed for different tasks (e.g., working on 2 projects simultaneously).
- **Location Tracking**: Each entry includes location (home, office, in-client).

#### Project Selector Sorting
- **Frequency Calculation**: Per user, based on last week's usage (7 days).
- **Caching Strategy**: Cache project lists with refresh on:
  - New user-task assignments
  - Daily report submissions
  - Best practice: In-memory cache with TTL or Redis for production.

#### File Upload
- **Allowed Formats**: `.pdf`, `.jpg`, `.png` only.
- **Maximum Size**: 5MB.
- **Storage**: Binary data stored in PostgreSQL BYTEA via Prisma Bytes.
- **Validation**: Block uploads that don't meet format/size requirements.

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
- Each project entry stored as separate record with start_time and end_time.
- Multiple entries can be added per day.
- Entries can overlap in time windows (for different tasks).

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
- [ ] **TASK-012**: Manual Reporting Logic (Time entry validation with Zod, End Time < Start Time blocking). Support multiple project entries per day with overlapping time windows. Store as start/end times per task entry.
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
