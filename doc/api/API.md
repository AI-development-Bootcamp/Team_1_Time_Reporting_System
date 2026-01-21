# Time Reporting System — API Spec (Course Version)

Base URL: `/api`  
Auth: JWT Bearer token (`Authorization: Bearer <token>`)

This API spec matches the **TypeScript Data Models** used in the project (User, Client, Project, Task, DailyAttendance, ProjectTimeLogs).

---

## Conventions

### Standard Response Envelope
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

### Common HTTP Status Codes
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

### Common Error Codes
- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `MONTH_LOCKED`
- `CONFLICT`
- `FILE_TOO_LARGE`
- `UNSUPPORTED_FILE_TYPE`
- `INTERNAL_ERROR`

---

## Data Models (Reference)

> These are the core shapes expected in responses (fields use the same names).

- **User**: `{ id, name, mail, userType, active, createdAt, updatedAt }`
- **Client**: `{ id, name, description?, active, createdAt, updatedAt }`
- **Project**: `{ id, name, clientId, projectManagerId, startDate, endDate?, description?, reportingType, active, createdAt, updatedAt }`
- **ReportingType**: `startEnd` (Default) | `duration`
- **Task**: `{ id, name, projectId, startDate?, endDate?, description?, status, createdAt, updatedAt }`
- **TaskWorker**: `{ taskId, userId }`
- **DailyAttendance**: `{ id, userId, date, startTime, endTime, status, document?, createdAt, updatedAt }`
- **ProjectTimeLogs**: `{ id, dailyAttendanceId, taskId, duration, location, description?, createdAt, updatedAt }`

> **Location**: `office` | `client` | `home` - Where the work was done

---

# 1) Authentication

## POST `/auth/login`
Login and receive JWT (24h expiry).

**Auth:** Public

### Request Body
```json
{
  "mail": "user@example.com",
  "password": "Password123"
}
```

### 200 OK
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

### Errors
- 400 `VALIDATION_ERROR` (missing/invalid fields)
- 401 `UNAUTHORIZED` (wrong credentials)

---

# 2) Users (Admin)

> Users are **soft-deleted** by setting `active=false`.

## GET `/admin/users?active=true`
List users (filter by active/inactive).

**Auth:** Required  
**Role:** `admin`

### Query Params
- `active` (boolean, optional)

### 200 OK
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

### Errors
- 401 `UNAUTHORIZED`
- 403 `FORBIDDEN`

---

## POST `/admin/users`
Create user.

**Auth:** Required  
**Role:** `admin`

### Request Body
```json
{
  "name": "New Worker",
  "mail": "worker@example.com",
  "password": "Password123",
  "userType": "worker"
}
```

### 201 Created
```json
{
  "success": true,
  "data": { "id": 22 }
}
```

### Errors
- 400 `VALIDATION_ERROR`
- 409 `CONFLICT` (mail already exists)

---

## PUT `/admin/users/:id`
Update user fields (including `active` and password if you allow it in update).

**Auth:** Required  
**Role:** `admin`

### Params
- `id` (number)

### Request Body (example)
```json
{
  "name": "Updated Name",
  "userType": "worker",
  "active": true
}
```

### 200 OK
```json
{ "success": true, "data": { "updated": true } }
```

### Errors
- 400 `VALIDATION_ERROR`
- 404 `NOT_FOUND`

---

## DELETE `/admin/users/:id`
Soft delete user (`active=false`).

**Auth:** Required  
**Role:** `admin`

### 200 OK
```json
{ "success": true, "data": { "deleted": true } }
```

### Errors
- 404 `NOT_FOUND`

---

## POST `/admin/users/:id/reset-password`
Admin sets a new password directly.

**Auth:** Required  
**Role:** `admin`

### Request Body
```json
{ "newPassword": "NewStrongPassword123" }
```

### 200 OK
```json
{ "success": true, "data": { "updated": true } }
```

---

# 3) Clients (Admin)

## GET `/admin/clients`
List clients.

**Auth:** Required  
**Role:** `admin`

### 200 OK
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Globaly",
      "description": "Main client",
      "active": true,
      "createdAt": "2026-01-01T09:00:00.000Z",
      "updatedAt": "2026-01-10T09:00:00.000Z"
    }
  ]
}
```

## POST `/admin/clients`
Create client.

### Request Body
```json
{ "name": "New Client", "description": "Optional" }
```

### 201 Created
```json
{ "success": true, "data": { "id": 10 } }
```

## PUT `/admin/clients/:id`
Update client.

### Request Body
```json
{ "name": "Updated Client", "description": null, "active": true }
```

## DELETE `/admin/clients/:id`
Soft delete client (`active=false`).

---

# 4) Projects (Admin)

## GET `/admin/projects`
List projects.

**Auth:** Required  
**Role:** `admin`

### 200 OK
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "name": "Frontend Build",
      "clientId": 1,
      "projectManagerId": 1,
      "startDate": "2026-01-01",
      "endDate": null,
      "description": "Build UI",
      "reportingType": "startEnd",
      "active": true,
      "createdAt": "2026-01-01T09:00:00.000Z",
      "updatedAt": "2026-01-10T09:00:00.000Z"
    }
  ]
}
```

## POST `/admin/projects`
Create project.

### Request Body
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

## PUT `/admin/projects/:id`
Update project.

## PATCH `/admin/projects/:id`
Partial update for project settings (e.g., reportingType).

**Auth:** Required  
**Role:** `admin`

### Request Body
```json
{
  "reportingType": "duration"
}
```

### 200 OK
```json
{ "success": true, "data": { "updated": true } }
```

## DELETE `/admin/projects/:id`
Soft delete project (`active=false`).

---

# 5) Tasks (Admin)

## GET `/admin/tasks?projectId=5`
List tasks (optional filter by project).

**Auth:** Required  
**Role:** `admin`

### Query Params
- `projectId` (number, optional)

### 200 OK
```json
{
  "success": true,
  "data": [
    {
      "id": 55,
      "name": "UI/UX",
      "projectId": 5,
      "startDate": null,
      "endDate": null,
      "description": "Design work",
      "status": "open",
      "createdAt": "2026-01-01T09:00:00.000Z",
      "updatedAt": "2026-01-10T09:00:00.000Z"
    }
  ]
}
```

## POST `/admin/tasks`
Create task.

### Request Body
```json
{
  "name": "DB Creation",
  "projectId": 5,
  "startDate": "2026-01-20",
  "endDate": null,
  "description": "Create schema",
  "status": "open"
}
```

## PUT `/admin/tasks/:id`
Update task.

## DELETE `/admin/tasks/:id`
Soft delete task (`active=false` on DB layer; API can hide inactive tasks by default).

---

# 6) Assignments (Admin)

> Assignments are stored as a join table (`TaskWorker`) in DB. This API manages the many-to-many relationship between Users and Tasks.

## POST `/admin/assignments`
Assign worker to task.

**Auth:** Required  
**Role:** `admin`

### Request Body
```json
{ "userId": 2, "taskId": 55 }
```

### 201 Created
```json
{ 
  "success": true, 
  "data": { 
    "taskId": 55,
    "userId": 2
  } 
}
```

### 409 Conflict
Returns when attempting to assign a user to a task they are already assigned to (unique constraint violation).
```json
{
  "success": false,
  "error": "User is already assigned to this task"
}
```

## GET `/admin/assignments`
List all assignments.

## DELETE `/admin/assignments/:id`
Remove assignment.

---

# 7) Daily Attendance (Reporting)

> DailyAttendance represents a daily record.  
> It can be used for:
> - Work day entry (manual/timer)
> - Sickness / reserves / dayOff / halfDayOff (absence-like statuses)

## POST `/attendance`
Create a DailyAttendance record (manual entry or timer stop).

**Auth:** Required  
**Role:** `worker` or `admin` (as employee)

### Request Body
```json
{
  "date": "2026-01-14",
  "startTime": "2026-01-14T09:00:00.000Z",
  "endTime": "2026-01-14T17:30:00.000Z",
  "status": "work"
}
```

### Validations
- Block if `endTime < startTime`
- Minimum precision: 1 minute
- If month is locked → block

### 201 Created
```json
{
  "success": true,
  "data": {
    "id": 701
  }
}
```

### Errors
- 400 `VALIDATION_ERROR`
- 409 `MONTH_LOCKED`

---

## GET `/attendance/month-history?month=1&userId=2`
Returns month history of DailyAttendance (for UI accordion). Uses current year.

**Auth:** Required  
**Role:** `worker` (self) / `admin` (can view others)

### Query Params
- `month` (number, required, 1-12)
- `userId` (number, required)

### 200 OK
```json
{
  "success": true,
  "data": [
    {
      "id": 701,
      "userId": 2,
      "date": "2026-01-14",
      "startTime": "2026-01-14T09:00:00.000Z",
      "endTime": "2026-01-14T17:30:00.000Z",
      "status": "work",
      "document": null,
      "createdAt": "2026-01-14T18:00:00.000Z",
      "updatedAt": "2026-01-14T18:00:00.000Z"
    }
  ]
}
```

---

## PUT `/attendance/:id`
Update an existing DailyAttendance record.

### Errors
- 409 `MONTH_LOCKED`

> **Note**: No DELETE endpoint for DailyAttendance. Records are edited, not deleted.

---

# 8) Project Time Logs (Per-day entries per task)

> ProjectTimeLogs connects a DailyAttendance record to task-based time logs.
> Overlapping logs are allowed.

## POST `/time-logs`
Create a time log entry for a DailyAttendance.

**Auth:** Required

### Request Body
```json
{
  "dailyAttendanceId": 701,
  "taskId": 55,
  "duration": 120,
  "location": "office",
  "description": "Worked on UI"
}
```

> **location**: Required. One of: `office`, `client`, `home`

### 201 Created
```json
{ "success": true, "data": { "id": 9001 } }
```

### Errors
- 400 `VALIDATION_ERROR`
- 404 `NOT_FOUND` (attendance or task not found)
- 409 `MONTH_LOCKED` (if the day/month is locked)

---

## GET `/time-logs?dailyAttendanceId=701`
List time logs for a specific day.

### 200 OK
```json
{
  "success": true,
  "data": [
    {
      "id": 9001,
      "dailyAttendanceId": 701,
      "taskId": 55,
      "duration": 120,
      "location": "office",
      "description": "Worked on UI",
      "createdAt": "2026-01-14T18:10:00.000Z",
      "updatedAt": "2026-01-14T18:10:00.000Z"
    }
  ]
}
```

## PUT `/time-logs/:id`
Update time log.

## DELETE `/time-logs/:id`
Delete time log.

---

---

# Appendix A — Role Rules Summary

- `worker`:
  - Can login
  - Can create/update attendance & time logs for self (unless month locked)
  - Can view month history for self
- `admin`:
  - Everything worker can do (as employee)
  - Admin CRUD: users/clients/projects/tasks
  - Manage assignments
  - Can view other users data by specifying `userId` query param

---

# Appendix B — Notes / Clarifications

- **Soft Delete Users:** `active=false` instead of deleting.
- **Time Validation:** block when `endTime < startTime`.
- **Overlaps:** allowed in ProjectTimeLogs (different tasks).
- **No Deletion for DailyAttendance:** DailyAttendance records are edited, not deleted. ProjectTimeLogs can be deleted.
- **Location Required:** All ProjectTimeLogs must specify location (office/client/home).
- **File Storage:** Documents stored as Bytes (BYTEA) in database.
- **Caching:** In-memory cache for project selector (no Redis for MVP).
- **Timer Storage:** Memory-only for running timers.
- **Timer Auto-Stop:** Uses `work` status when timer auto-stops at 23:59.
- **Locked Month UI:** Edit button is disabled when month is locked.
