# Database Tables Overview (PostgreSQL)

This document describes how the tables look in the database (columns + types), including the array-based “list of IDs” fields (`BIGINT[] NULL`) as requested.

---

## Users

| column | type |
|---|---|
| id | BIGSERIAL (PK) |
| name | TEXT |
| mail | TEXT (UNIQUE) |
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
| id | BIGSERIAL (PK) |  |
| task_id | BIGINT | FK → tasks.id |
| user_id | BIGINT | FK → users.id |

**Constraints:**
- UNIQUE constraint on (task_id, user_id) - ensures a user can only be assigned to a task once

---


## DailyAttendance

| column | type |
|---|---|
| id | BIGSERIAL (PK) |
| user_id | BIGINT (FK → users.id) |
| date | DATE | In SQL: DATE object
| start_time | TIME NULL | In SQL: TIME type
| end_time | TIME NULL | In SQL: TIME type
| status | daily_attendance_status ENUM |
| document_url | TEXT NULL |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

---

## ProjectTimeLogs

| column | type |
|---|---|
| id | BIGSERIAL (PK) |
| daily_attendance_id | BIGINT (FK → daily_attendance.id) |
| task_id | BIGINT (FK → tasks.id) |
| duration_min | INTEGER |
| description | TEXT NULL |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

---

