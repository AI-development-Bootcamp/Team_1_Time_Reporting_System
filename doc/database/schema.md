# Database Tables Overview (PostgreSQL)

This document describes how the tables look in the database (columns + types).

---

## Enums

| Enum | Values |
|------|--------|
| user_type | worker, admin |
| task_status | open, closed |
| daily_attendance_status | work, sickness, reserves, dayOff, halfDayOff |
| location_status | office, client, home |

---

## Users

| column | type |
|---|---|
| id | BIGSERIAL (PK) |
| name | TEXT |
| mail | TEXT (UNIQUE) |
| password | TEXT |
| user_type | user_type ENUM (worker/admin) |
| active | BOOLEAN |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

---

## Clients

| column | type |
|---|---|
| id | BIGSERIAL (PK) |
| name | TEXT |
| description | TEXT NULL |
| active | BOOLEAN |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

---

## Projects

| column | type |
|---|---|
| id | BIGSERIAL (PK) |
| name | TEXT |
| client_id | BIGINT (FK → clients.id) |
| project_manager_id | BIGINT (FK → users.id) |
| start_date | DATE |
| end_date | DATE NULL |
| description | TEXT NULL |
| active | BOOLEAN |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

---

## Tasks

| column | type | notes |
|---|---|---|
| id | BIGSERIAL (PK) |  |
| name | TEXT |  |
| project_id | BIGINT | FK → projects.id |
| start_date | DATE NULL |  |
| end_date | DATE NULL |  |
| description | TEXT NULL |  |
| status | task_status ENUM | open/closed |
| created_at | TIMESTAMPTZ |  |
| updated_at | TIMESTAMPTZ |  |

---

## TaskWorker

| column | type | notes |
|---|---|---|
| task_id | BIGINT (PK) | FK → tasks.id |
| user_id | BIGINT (PK) | FK → users.id |

**Constraints:**
- UNIQUE constraint on (task_id, user_id) - ensures a user can only be assigned to a task once

---

## DailyAttendance

| column | type | notes |
|---|---|---|
| id | BIGSERIAL (PK) | |
| user_id | BIGINT (FK → users.id) | |
| date | DATE | In SQL: DATE object |
| start_time | TIME NULL | In SQL: TIME type |
| end_time | TIME NULL | In SQL: TIME type |
| status | daily_attendance_status ENUM | work/sickness/reserves/dayOff/halfDayOff |
| document | BYTEA NULL | Binary file storage (Bytes in Prisma) |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

---

## ProjectTimeLogs

| column | type | notes |
|---|---|---|
| id | BIGSERIAL (PK) | |
| daily_attendance_id | BIGINT (FK → daily_attendance.id) | |
| task_id | BIGINT (FK → tasks.id) | |
| duration_min | INTEGER | Duration in minutes |
| location | location_status ENUM | office/client/home |
| description | TEXT NULL | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

---

## Notes

- **No deletion**: DailyAttendance and ProjectTimeLogs records are edited, not deleted
- **Soft delete**: Users, Clients, Projects, Tasks use `active=false` for soft delete
- **File storage**: Documents stored as BYTEA (Bytes) in database
- **API versioning**: Implemented from start (e.g., `/api/v1/...`)
- **Caching**: In-memory cache for project selector (no Redis for MVP)
- **Timer**: Memory-only storage for running timers
- **Timer auto-stop status**: Uses `work` status when timer auto-stops at 23:59