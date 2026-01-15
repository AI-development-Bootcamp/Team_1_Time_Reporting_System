# Project Context

## Purpose
A time-tracking platform built with TypeScript, featuring two distinct React interfaces (User & Admin) backed by a shared Express.js server for reporting work hours, managing absences, and controlling project budgets.

**Goal**: To create a unified, transparent standard for reporting hours across the organization, reducing errors, and enabling efficient management of employee attendance and project assignments.

**Users**:
- **Employees**: Report daily hours (manual/timer) and absences
- **Admins**: Admins are also employees with access to both platforms. They can report daily hours and absences (like regular employees) AND manage users, clients, projects, tasks, assignments, and perform monthly report closures

## Tech Stack

### Frontend Layer
- **Framework**: React + Vite + TypeScript
- **UI Library**: Mantine UI (with RTL support for Hebrew)
- **State Management**: TanStack Query (React Query)
- **Forms**: @mantine/form + Zod
- **Date Handling**: Day.js (always use Day.js, never native Date object)
- **Architecture**: Two separate apps:
  - `frontend_user`: Mobile-first responsive design (optimized for mobile devices)
  - `frontend_admin`: Web-first design (optimized for desktop/laptop screens)

### Backend Layer
- **Runtime**: Node.js + Express.js + TypeScript (ts-node for dev, tsc for build)
- **Validation**: Zod (works seamlessly with TypeScript as it infers types automatically)
- **Authentication**: JWT-based (24h expiry)

### Data Layer
- **ORM**: Prisma (type-safe DB access and migration management)
- **Database**: PostgreSQL (supports BYTEA/Prisma Bytes for files)

### Development Tools
- **Testing**: Vitest (60% coverage target)
- **Orchestration**: npm scripts + concurrently
- **Infrastructure**: Dockerized environment, CI/CD with GitHub Actions

## Project Conventions

### Code Style

**Naming Conventions**:
- **Variables/Functions**: `camelCase` (e.g., `userReport`, `fetchProjectData`)
- **Components**: `PascalCase` (e.g., `ExpenseForm`, `CategorySummary`)
- **Files**: `PascalCase` for all files in folders (e.g., `ExpenseForm.tsx`, `ExpenseTypes.ts`, `FormatCurrency.ts`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `EXPENSE_CATEGORIES`)
- **Types/Interfaces**: `PascalCase` with descriptive names (e.g., `Expense`, `ExpenseFormData`)

**TypeScript Rules**:
- No `any` type - define interfaces for all API responses and data models
- Use Zod for all request body and query parameter validation
- Leverage TypeScript's type inference capabilities

**CSS Rules**:
- **No inline styles** permitted in components (avoid `style={{...}}`)
- Use Mantine UI components exclusively
- All layouts must support Hebrew (RTL) via `MantineProvider` with `direction: 'rtl'`

**Form Handling**:
- Use `useForm` hook from `@mantine/form`
- Pass `form.getInputProps('fieldName')` directly to Mantine components

**State Management**:
- Use TanStack Query hooks (`useQuery`, `useMutation`) for all server data fetching
- Do not use `useEffect + axios` manually in components
- Always invalidate queries after a mutation

**Date Handling**:
- Always use Day.js for date manipulations
- Do not use the native Date object for calculations
- When interacting with the DB, convert Day.js objects to ISO strings or JavaScript Date objects as required by Prisma

### Architecture Patterns

**Monorepo Structure**:
```
/
├── backend/
│   ├── prisma/          # schema.prisma, migrations
│   ├── src/             # Express App (TypeScript)
│   └── tsconfig.json    # TypeScript configuration
├── frontend_user/       # React App: Reporting (TypeScript + Vite)
├── frontend_admin/      # React App: Management (TypeScript + Vite)
├── doc/                 # Documentation
│   ├── specs/           # Project specifications
│   ├── api/              # API documentation
│   ├── models/           # Data models
│   └── database/         # Database schema
└── package.json         # Root config
```

**Run Configuration**:
- `npm run dev:all` → Runs Backend + Frontend User + Frontend Admin
- `npm run dev:user` → Runs Backend + Frontend User
- `npm run dev:admin` → Runs Backend + Frontend Admin

**API Conventions**:
- Base URL: `/api`
- Auth: JWT Bearer token (`Authorization: Bearer <token>`)
- Standard Response Envelope:
  - Success: `{ "success": true, "data": {} }`
  - Error: `{ "success": false, "error": { "code": "ERROR_CODE", "message": "...", "details": {} } }`

**Database Patterns**:
- Soft deletes: Set `active=false` instead of removing records (for Users, Clients, Projects, Tasks)
- Always filter for `active: true` in standard queries
- Use Prisma Client for all DB interactions
- All models use `BigInt` with `@default(autoincrement())` for primary keys
- Timestamp fields use `@db.Timestamptz` (PostgreSQL TIMESTAMPTZ)
- Date fields use `@db.Date` (PostgreSQL DATE)
- Time fields use `@db.Time` (PostgreSQL TIME)

**Time Reporting Structure**:
- **DailyAttendance**: One record per user per day (stores date, startTime, endTime, status, documentUrl)
- **ProjectTimeLogs**: Multiple records per DailyAttendance (stores taskId, duration in minutes)
- Minimum time unit: 1 minute precision
- Overlapping entries allowed for different tasks
- Time storage: DailyAttendance stores overall day start/end times (TIME type, nullable), ProjectTimeLogs stores duration in minutes per task

**Project Selector Caching**:
- Cache project lists grouped by client, sorted by usage frequency (per user, last week)
- Refresh cache when new assignments are made or daily reports are submitted
- Use in-memory cache with TTL or Redis for production

### Testing Strategy

- **Framework**: Vitest
- **Coverage Target**: 60%
- **Test Types**: Unit tests for backend logic and API endpoints
- **Run Tests**: `cd backend && npm test`

### Git Workflow

- Follow the monorepo structure
- Write unit tests for new features
- Ensure RTL support for Hebrew interface
- Update documentation as needed
- Follow coding guidelines in `.cursorrules`

## Domain Context

**Hierarchy Logic**:
- Clients are unique companies
- Each Client has many Projects (e.g., frontend build, backend build)
- Each Project has many Tasks (e.g., UI/UX, DB creation)
- Users are assigned to Tasks (many-to-many via TaskWorker join table)

**Time Reporting**:
- Manual entry for daily hours with multiple time entries per day
- Timer functionality with auto-stop at 23:59 (if left running, saves as "Incomplete")
- Project selector groups Projects by Client header, sorted by usage frequency (per user, last week usage)
- Reports stored as start/end times per task, not total hours
- Multiple time entries can be saved per day, including overlapping time windows

**Absence Management**:
- Handled via DailyAttendance records with absence-related statuses (sickness, reserves, dayOff, halfDayOff)
- Binary file upload (PDF, JPG, PNG, max 5MB) stored as `documentUrl` (TEXT) or Bytes in DB

**Month Locking**:
- Admin capability to lock reporting for specific months to prevent retroactive editing
- Check month lock status before any Create/Update/Delete operations on reports

**Validations**:
- Block if End Time < Start Time
- Alerts for <9h or >9h daily (Should Have)
- File upload restrictions: Only `.pdf`, `.jpg`, `.png` formats, max 5MB

## Important Constraints

**Performance Requirements**:
- **Critical (Must be fast)**:
  - Login/Authentication: < 1 second response time
  - Manual time entry submission: < 500ms response time
  - Project selector dropdown loading: < 300ms (should be cached/preloaded)
  - View month history report: < 2 seconds for initial load
- **Important (Should be fast)**:
  - Timer start/stop operations: < 200ms response time
  - Absence file upload: < 3 seconds for files up to 5MB
  - Admin CRUD operations: < 1 second response time
  - Admin dashboard data loading: < 2 seconds for initial load

**Security Constraints**:
- JWT Tokens with 24h expiry
- Binary file storage in DB (PostgreSQL)
- File Upload Restrictions: Only `.pdf`, `.jpg`, `.png` formats allowed, maximum 5MB

**UX Constraints**:
- Right-to-Left (Hebrew) interface required
- Mantine UI Library exclusively
- Mobile-first for `frontend_user`, web-first for `frontend_admin`

**Technical Constraints**:
- No inline styles in components
- Always use Day.js for date manipulations (never native Date)
- Use TanStack Query for all server data fetching (no manual useEffect + axios)
- Use Zod for all request validation
- Soft deletes implemented via `active` boolean field

## External Dependencies

**Key Libraries**:
- React + Mantine UI (frontend)
- Express.js + Prisma (backend)
- PostgreSQL (database)
- Zod (validation)
- Day.js (date handling)
- TanStack Query (state management)
- Vitest (testing)

**Infrastructure**:
- Docker (for PostgreSQL database)
- GitHub Actions (CI/CD)

**Documentation**:
- Complete project specification: `doc/specs/specification.md`
- API documentation: `doc/api/API.md`
- Data models: `doc/models/data-models.md`
- Database schema: `doc/database/schema.md`
