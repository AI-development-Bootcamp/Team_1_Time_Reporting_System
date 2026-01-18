# Time Reporting System (Course Version)

> A unified, full-stack time-tracking platform with distinct Employee and Admin interfaces, featuring automated monthly reports, absence management, and project budgeting.

## Table of Contents
1. [About The Project](#about-the-project)
2. [Built With](#built-with)
3. [Getting Started](#getting-started)
4. [Running the Project](#running-the-project)

## About The Project

This system was built to create a unified standard for reporting hours across the organization. It replaces manual processes with a digital, transparent workflow.

The architecture is a **Monorepo** consisting of three main services:
1.  **Backend:** A shared Node.js/Express server.
2.  **User Frontend:** A mobile-first React app for daily reporting.
3.  **Admin Frontend:** A desktop-first React dashboard for management.

### Key Features
* **Dual-Interface:** Specialized UIs for Employees (Speed/Mobile) vs. Admins (Data/Desktop).
* **Smart Time Tracking:** Manual entry + Live Timer (auto-stops at 23:59 via cron jobs).
* **Absence Management:** Upload sickness/vacation documents (stored as secure binary `Bytes` in DB).
* **Hierarchy Logic:** Complex management of Clients → Projects → Tasks.
* **Location Tracking:** Track where work was done (office, client, home).
* **RTL Support:** Fully localized Hebrew interface.

## Built With

### Frontend (`frontend_user` & `frontend_admin`)
* **Framework:** React + Vite + TypeScript
* **UI Library:** Mantine UI (with RTL support)
* **State Management:** TanStack Query (React Query)
* **Forms:** @mantine/form + Zod
* **Dates:** Day.js

### Backend (`backend`)
* **Runtime:** Node.js + Express + TypeScript
* **Database:** PostgreSQL
* **ORM:** Prisma
* **Validation:** Zod
* **Scheduling:** node-cron
* **Testing:** Vitest

## Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites
* **Node.js** (v18 or higher)
* **Docker** (for running the PostgreSQL database)

### Installation

1.  **Clone the repo**
    ```sh
    git clone https://github.com/AI-development-Bootcamp/Team_1_Time_Reporting_System.git
    cd Team_1_Time_Reporting_System
    ```

2.  **Install NPM packages**
    ```sh
    npm install
    ```

3.  **Quick Setup (Recommended)**
    
    Run the automated setup script that handles everything:
    ```sh
    npm run setup
    ```
    
    This single command will:
    - Start Docker Compose (PostgreSQL database)
    - Wait for database to be ready
    - Generate Prisma Client
    - Run database migrations
    - Seed the database with sample data
    
    **Alternative: Manual Setup**
    
    If you prefer to run steps manually:
    ```sh
    # Start Docker Compose
    docker-compose up -d
    
    # Setup Prisma (from backend directory)
    cd backend
    npx prisma generate
    npx prisma migrate dev --name init
    npx prisma db seed
    ```

### Running the Project

After running `npm run setup`, start the development servers:

```sh
# Run EVERYTHING (Backend + User App + Admin App)
npm run dev:all

# Run only User Environment
npm run dev:user

# Run only Admin Environment
npm run dev:admin
```

**Note:** Make sure you've run `npm run setup` first to initialize the database and seed data.

## Shutting Down

When you're done working:

1. **Stop the development servers**
   - Press `Ctrl+C` in the terminal where `npm run dev:all` (or `dev:user`/`dev:admin`) is running
   - This will stop all frontend and backend services

2. **Stop Docker Compose (optional)**
   ```sh
   docker-compose down
   ```
   
   **Note:** You can leave Docker running if you'll be working again soon. The database will persist data between sessions. Only run `docker-compose down` if you want to completely stop the database container.

   To remove all data (including volumes):
   ```sh
   docker-compose down -v
   ```
   ⚠️ **Warning:** This will delete all database data!

## Environment Variables

Create a `.env` file in the `/backend` folder:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/time_db"
JWT_SECRET="super_secret_key_change_this"
PORT=3000
```

## Seed Database

After running migrations, seed the database with initial data:

```sh
cd backend
npx prisma db seed
```

This will create:
- Initial admin user
- Sample clients, projects, and tasks
- User-task assignments

## Project Structure

```
/
├── backend/
│   ├── prisma/          # schema.prisma, migrations
│   ├── src/             # Express App (TypeScript)
│   └── tsconfig.json    # TypeScript configuration
├── frontend_user/       # React App: Reporting (TypeScript + Vite)
├── frontend_admin/      # React App: Management (TypeScript + Vite)
├── shared/              # Shared code between frontends
│   └── src/
│       └── utils/       # Shared utilities (e.g., ApiClient)
└── package.json         # Root config
```

### Shared Code

The `shared/` folder contains code that is used by both `frontend_user` and `frontend_admin` to avoid duplication. 

**When you need to import shared utilities**, use the `@shared` alias:

```typescript
// Example: Importing the shared ApiClient
import { apiClient, ApiResponse } from '@shared/utils/ApiClient';
```

**Important Notes:**
- Each frontend uses its own `.env` file, so environment variables (like `VITE_API_URL`) are resolved per frontend
- The `@shared` alias is configured in both `vite.config.ts` and `tsconfig.json` files
- If you need to add new shared utilities, place them in `shared/src/` and import using `@shared/...`

## Key Features

### Must Have (Critical)
- ✅ **Auth System**: Admin-created users, JWT-based login (24h expiry)
- ✅ **Dual Frontend Architecture**: Mobile-first user app & web-first admin dashboard
- ✅ **Manual Time Reporting**: Multiple time entries per day with project/task selection
- ✅ **Admin CRUD**: Management of Users, Clients, Projects, and Tasks (Soft Delete)
- ✅ **Month History Report**: View detailed month history with accordion UI and status badges

### Should Have (Important)
- ⏱️ **Timer Functionality**: Timer with auto-stop at 23:59
- 📎 **Absence Management**: Vacation/Sickness/Reserve reporting with file upload
- 📊 **Visual Dashboard**: Progress bar for daily 9-hour standard

## API Endpoints Overview

Base URL: `/api`  
Auth: JWT Bearer token (`Authorization: Bearer <token>`)

### Authentication
- `POST /api/auth/login` - Login and receive JWT (24h expiry)

### Users (Admin)
- `GET /api/admin/users?active=true` - List users (filter by active/inactive)
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Soft delete user (`active=false`)
- `POST /api/admin/users/:id/reset-password` - Admin sets new password

### Clients (Admin)
- `GET /api/admin/clients` - List clients
- `POST /api/admin/clients` - Create client
- `PUT /api/admin/clients/:id` - Update client
- `DELETE /api/admin/clients/:id` - Soft delete client

### Projects (Admin)
- `GET /api/admin/projects` - List projects
- `POST /api/admin/projects` - Create project
- `PUT /api/admin/projects/:id` - Update project
- `DELETE /api/admin/projects/:id` - Soft delete project

### Tasks (Admin)
- `GET /api/admin/tasks?projectId=5` - List tasks (optional filter by project)
- `POST /api/admin/tasks` - Create task
- `PUT /api/admin/tasks/:id` - Update task
- `DELETE /api/admin/tasks/:id` - Soft delete task

### Assignments (Admin)
- `POST /api/admin/assignments` - Assign worker to task
- `GET /api/admin/assignments` - List all assignments
- `DELETE /api/admin/assignments/:id` - Remove assignment

### Daily Attendance (Reporting)
- `POST /api/attendance` - Create DailyAttendance record (manual/timer)
- `GET /api/attendance/month-history?month=1&userId=2` - Get month history (uses current year)
- `PUT /api/attendance/:id` - Update DailyAttendance
- Note: No DELETE endpoint - records are edited, not deleted

### Project Time Logs
- `POST /api/time-logs` - Create time log entry (duration in minutes, location required)
- `GET /api/time-logs?dailyAttendanceId=701` - List time logs for a day
- `PUT /api/time-logs/:id` - Update time log
- `DELETE /api/time-logs/:id` - Delete time log

### Response Format
All responses follow this structure:
- **Success:** `{ "success": true, "data": {} }`
- **Error:** `{ "success": false, "error": { "code": "ERROR_CODE", "message": "..." } }`

### Role Permissions
- **`worker`**: Can login, create/update own attendance & time logs, view own month history
- **`admin`**: All worker permissions + Admin CRUD operations, manage assignments, view other workers' data

For complete documentation, see the [doc](./doc/) folder:
- **Specification**: [doc/specs/specification.md](./doc/specs/specification.md) - Complete project specification
- **API Documentation**: [doc/api/API.md](./doc/api/API.md) - Detailed API endpoints
- **Data Models**: [doc/models/data-models.md](./doc/models/data-models.md) - TypeScript interfaces
- **Database Schema**: [doc/database/schema.md](./doc/database/schema.md) - Database table layout

## Development Guidelines

### Key Rules
- **RTL Support**: All layouts support Hebrew (RTL)
- **Soft Deletes**: Always filter for `active: true` in standard queries
- **Validation**: Use Zod for all request validation
- **File Uploads**: Only `.pdf`, `.jpg`, `.png` formats, max 5MB, stored as Bytes in DB
- **Location Required**: All time logs must specify location (office/client/home)
- **No Deletion for DailyAttendance**: DailyAttendance records are edited, not deleted (ProjectTimeLogs can be deleted)

## Testing

- **Framework**: Vitest
- **Coverage Target**: 60%
- **Test Types**: Unit tests for backend logic and API endpoints

Run tests:
```sh
cd backend
npm test
```

## Contributing

1. Follow the coding guidelines in `.cursorrules`
2. Write unit tests for new features
3. Ensure RTL support for Hebrew interface
4. Follow the monorepo structure
5. Update documentation as needed

---

**Built with ❤️ using TypeScript, React, Express, and Prisma**