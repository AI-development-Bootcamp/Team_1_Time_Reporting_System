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
- [ ] **Auth System**: Admin-created users, JWT-based login (24h expiry).
- [ ] **Dual Frontend Architecture**:
  1. `frontend_user`: Reporting & History (for Employees & Admins).
  2. `frontend_admin`: Management Dashboard (Admins only).
- [ ] **Manual Time Reporting**: Manual entry for daily hours. The "Project" selector must group Projects by Client header, sorted by usage frequency.
- [ ] **Admin CRUD**: Management of Users (Soft Delete), Clients, Projects, and Tasks.
- [ ] **Hierarchy Logic**: Clients are unique companies. Each Client has many Projects (e.g., frontend build, backend build). Each Project has many Tasks (e.g., UI/UX, DB creation). Users are assigned to Tasks.
- [ ] **Validations**: Block if End Time < Start Time.
- [ ] **Month History Report**: View month history report.

#### Should Have (Important)
- [ ] **Timer Functionality**: Timer for time tracking with auto-stop at 23:59. If left running, it saves as "Incomplete".
- [ ] **Absence Management**: Reporting Vacation/Sickness/Reserve with Binary File Upload (stored as Bytes in DB via Prisma).
- [ ] **Month Locking**: Admin capability to lock reporting for specific months to prevent retroactive editing.
- [ ] **Visual Dashboard**: Progress bar for daily 9-hour standard.
- [ ] **Validations**: Alerts for <9h or >9h daily.
- [ ] **Overlapping Reports**: Allow reporting different tasks for the same time window (e.g., working on 2 projects simultaneously).

#### Nice to Have (Bonus)
- [ ] **Password Reset**: Password reset by Admin only.
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
- **Security**: JWT Tokens, Binary file storage in DB (PostgreSQL).
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

### API Endpoints (Preliminary Plan)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login and receive JWT. |
| GET | `/api/user/my-projects-stats` | Get projects assigned to user (Grouped by Client, Sorted by Frequency). |
| POST | `/api/reports` | Submit daily report (Manual/Timer stop). |
| POST | `/api/absences` | Upload absence report + File (Multipart -> Prisma Bytes). |
| GET | `/api/admin/users` | List users (Admin Dashboard) with Active/Inactive filter. |
| DELETE | `/api/admin/users/:id` | Soft Delete (is_active = false). |
| PUT | `/api/admin/month-lock` | Lock/Unlock specific month. |

### Data Models (Prisma Schema Concepts)
Based on Soft Deletes, Binary storage, and Hierarchy requirements.

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  role      Role     @default(EMPLOYEE) // Enum: ADMIN, EMPLOYEE
  isActive  Boolean  @default(true) // Soft Delete
  reports   DailyReport[]
  absences  Absence[]
}

model Task {
  id        String   @id @default(uuid())
  project   Project  @relation(fields: [projectId], references: [id])
  projectId String
  name      String
  status    String   // 'open', 'closed'
  // assignments handled via relation table or implicit many-to-many
}

model Absence {
  id        String   @id @default(uuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  type      String   // Enum: SICKNESS, RESERVE, etc.
  fileData  Bytes?   // Binary storage (BYTEA)
  mimeType  String?
}
```

---

## 4. Tasks Breakdown

### Phase 1: Setup
- [ ] **TASK-001**: Init Git Repo + Monorepo Structure (backend, frontend_user, frontend_admin) with TypeScript configuration.
- [ ] **TASK-002**: Configure root package.json with concurrently scripts for the 3 run modes.
- [ ] **TASK-003**: Docker Compose setup (Postgres + Node services).
- [ ] **TASK-004**: Prisma Setup: Init Prisma in /backend, define schema.prisma, and run initial migration.

### Phase 2: Backend (Express + Prisma)
- [ ] **TASK-010**: Setup Express Server with TypeScript (ts-node/tsc) + Auth Middleware (JWT) + Zod validation.
- [ ] **TASK-011**: Prisma CRUD: Implement Services/Controllers for Clients/Projects/Tasks using Prisma Client (TypeScript).
- [ ] **TASK-012**: Manual Reporting Logic (Time entry validation with Zod, End Time < Start Time blocking).
- [ ] **TASK-012b**: Timer Functionality (Timer handling, Midnight auto-stop job) - Should Have.
- [ ] **TASK-013**: Binary File Upload Implementation (Multer -> Buffer -> Prisma Bytes field) - Should Have.
- [ ] **TASK-014**: Admin Logic (Implement Soft Deletes via Prisma middleware or explicit filters).
- [ ] **TASK-015**: Setup Vitest for backend unit testing.

### Phase 3: Frontend (React + Mantine)
- [ ] **TASK-020**: Setup frontend_user & frontend_admin with TypeScript (Vite template) + Mantine Provider (RTL).
- [ ] **TASK-021**: Build "Smart Project Selector" Component (Grouped Select).
- [ ] **TASK-022**: Build Manual Daily Report View & Month History Report (User App).
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
- [ ] Prisma Migrations applied successfully to PostgreSQL.
- [ ] Users can log in and report time manually.
- [ ] Users can view month history reports.
- [ ] Admin can manage entities (Users, Clients, Projects, Tasks).
- [ ] Validations block invalid time entries (End Time < Start Time).

### Tests to Pass
- [ ] All API endpoints functional.
- [ ] Unit Tests running via Vitest (60% coverage).
- [ ] UI displays data correctly in RTL.
- [ ] No console errors.
