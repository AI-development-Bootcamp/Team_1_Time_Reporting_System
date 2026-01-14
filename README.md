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
* **Month Locking:** Admins can lock past months to prevent retroactive editing.
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
    # [TODO: Add your git URL below]
    git clone [https://github.com/your_username/repo_name.git](https://github.com/your_username/repo_name.git)
    cd repo_name
    ```

2.  **Install NPM packages**
    ```sh
    npm install
    ```

3.  **Setup Database (Docker)**
    ```sh
    docker-compose up -d
    ```

4.  **Prisma Setup**
    ```sh
    cd backend
    # Run migrations to create tables
    npx prisma migrate dev --name init
    # Generate the Prisma Client
    npx prisma generate
    ```

### Running the Project

The root `package.json` includes scripts to run different service combinations:

```sh
# Run EVERYTHING (Backend + User App + Admin App)
npm run dev:all

# Run only User Environment
npm run dev:user

# Run only Admin Environment
npm run dev:admin
```

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
└── package.json         # Root config
```

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
- 🔒 **Month Locking**: Admin capability to lock reporting for specific months
- 📊 **Visual Dashboard**: Progress bar for daily 9-hour standard

## API Endpoints Overview

### Authentication
- `POST /api/auth/login` - Login and receive JWT

### User Reporting
- `GET /api/user/my-projects-stats` - Get projects assigned to user
- `POST /api/reports` - Submit daily report
- `GET /api/reports/month-history` - Get month history report
- `POST /api/absences` - Upload absence report + File

### Admin Endpoints
- User Management: `GET/POST/PUT/DELETE /api/admin/users`
- Entity CRUD: `GET/POST/PUT/DELETE /api/admin/clients|projects|tasks`
- Assignments: `POST/GET/DELETE /api/admin/assignments`
- Month Locking: `PUT /api/admin/month-lock`

For complete API documentation, see [instructions.md](./instructions.md).

## Development Guidelines

### Code Style
- **TypeScript**: Strict mode, no `any` types
- **CSS**: No inline styles (use Mantine components)
- **Date Handling**: Always use Day.js, convert to Date/ISO for Prisma
- **State Management**: Use TanStack Query hooks (useQuery, useMutation)
- **Forms**: Use `@mantine/form` with `form.getInputProps()`

### Key Rules
- **RTL Support**: All layouts support Hebrew (RTL)
- **Soft Deletes**: Always filter for `isActive: true` in standard queries
- **Validation**: Use Zod for all request validation
- **File Uploads**: Only `.pdf`, `.jpg`, `.png` formats, max 5MB

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