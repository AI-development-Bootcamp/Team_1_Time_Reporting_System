# Time Reporting System - Spec Deltas

Based on `doc/specs/specification.md`, `doc/api/API.md`, `doc/models/data-models.md`, and `doc/database/schema.md`.

## ADDED Requirements

---

### Requirement: Authentication System (Member 1)
The system SHALL provide JWT-based authentication with 24h token expiry.

#### Scenario: User Login
- **GIVEN** a user with valid credentials exists in the database
- **WHEN** the user submits POST `/api/auth/login` with mail and password
- **THEN** the system returns a JWT token (24h expiry) and user info (excluding password)
- **AND** the response matches: `{ success: true, data: { token, expiresInHours: 24, user } }`

#### Scenario: Invalid Login
- **GIVEN** invalid credentials are provided
- **WHEN** the user submits POST `/api/auth/login`
- **THEN** the system returns 401 with `{ success: false, error: { code: "UNAUTHORIZED" } }`

#### Scenario: Protected Route Access
- **GIVEN** a protected endpoint
- **WHEN** accessed without a valid JWT token
- **THEN** the system returns 401 Unauthorized

---

### Requirement: User Management (Member 1)
The system SHALL allow admins to manage users with soft delete functionality.

#### Scenario: Create User
- **GIVEN** an admin is authenticated
- **WHEN** POST `/api/admin/users` with name, mail, password, userType
- **THEN** the system creates a user with hashed password
- **AND** returns `{ success: true, data: { id } }`

#### Scenario: Soft Delete User
- **GIVEN** an admin is authenticated
- **WHEN** DELETE `/api/admin/users/:id`
- **THEN** the system sets `active = false` (not hard delete)
- **AND** the user no longer appears in standard queries (filter by `active: true`)

#### Scenario: Reset Password
- **GIVEN** an admin is authenticated
- **WHEN** POST `/api/admin/users/:id/reset-password` with newPassword
- **THEN** the system updates the user's password (hashed)

---

### Requirement: Time Reporting (Member 2)
The system SHALL allow users to manually enter daily work hours with multiple entries per day.

#### Scenario: Create DailyAttendance
- **GIVEN** a user is authenticated
- **WHEN** POST `/api/attendance` with date, startTime, endTime, status
- **THEN** the system validates endTime > startTime
- **AND** creates a DailyAttendance record
- **AND** returns `{ success: true, data: { id } }`

#### Scenario: Invalid Time Entry
- **GIVEN** endTime < startTime
- **WHEN** POST `/api/attendance`
- **THEN** the system returns 400 with `{ success: false, error: { code: "VALIDATION_ERROR" } }`

#### Scenario: Create ProjectTimeLogs
- **GIVEN** a DailyAttendance exists
- **WHEN** POST `/api/time-logs` with dailyAttendanceId, taskId, duration (minutes), description?
- **THEN** the system creates a ProjectTimeLogs record
- **AND** multiple entries per DailyAttendance are allowed (overlapping time windows)

#### Scenario: Month History
- **GIVEN** a user is authenticated
- **WHEN** GET `/api/attendance/month-history?month=1&userId=2`
- **THEN** the system returns an array of DailyAttendance objects for that month (current year)
- **AND** response format: `{ success: true, data: [DailyAttendance, ...] }`

---

### Requirement: Project Selector (Member 2)
The system SHALL provide a project selector grouped by client and sorted by usage frequency.

#### Scenario: Load Project Selector
- **GIVEN** a user is authenticated
- **WHEN** GET `/api/projects/selector`
- **THEN** the system returns projects grouped by Client header
- **AND** sorted by last week's usage frequency (per user)
- **AND** response time < 300ms (cached)

#### Scenario: Cache Refresh
- **GIVEN** a new assignment is created or daily report submitted
- **WHEN** the cache is checked
- **THEN** the cache is invalidated and refreshed

---

### Requirement: Entity Management (Member 3)
The system SHALL allow admins to manage Clients, Projects, Tasks, and Assignments.

#### Scenario: CRUD Clients
- **GIVEN** an admin is authenticated
- **WHEN** GET/POST/PUT/DELETE `/api/admin/clients`
- **THEN** the system performs CRUD operations with soft delete
- **AND** GET filters by `active: true` by default

#### Scenario: CRUD Projects
- **GIVEN** an admin is authenticated
- **WHEN** GET/POST/PUT/DELETE `/api/admin/projects`
- **THEN** the system performs CRUD operations
- **AND** GET supports `?clientId=X` filter

#### Scenario: CRUD Tasks
- **GIVEN** an admin is authenticated
- **WHEN** GET/POST/PUT/DELETE `/api/admin/tasks`
- **THEN** the system performs CRUD operations
- **AND** GET supports `?projectId=X` filter

#### Scenario: Manage Assignments
- **GIVEN** an admin is authenticated
- **WHEN** POST `/api/admin/assignments` with userId, taskId
- **THEN** the system creates a TaskWorker record (user-task assignment)

---

### Requirement: Timer Functionality (Member 4)
The system SHALL provide timer functionality with auto-stop at 23:59.

#### Scenario: Start Timer
- **GIVEN** a user is authenticated
- **WHEN** POST `/api/timer/start` with taskId
- **THEN** the system starts tracking time for that task

#### Scenario: Stop Timer
- **GIVEN** a timer is running
- **WHEN** POST `/api/timer/stop`
- **THEN** the system creates a DailyAttendance record with calculated duration

#### Scenario: Auto-Stop at Midnight
- **GIVEN** a timer is running at 23:59
- **WHEN** the clock reaches 23:59
- **THEN** the system auto-stops the timer
- **AND** saves the entry with status indicating incomplete

---

### Requirement: Month Locking (Member 4)
The system SHALL allow admins to lock months to prevent retroactive editing.

#### Scenario: Lock Month
- **GIVEN** an admin is authenticated
- **WHEN** PUT `/api/admin/month-lock` with year, month, isLocked: true
- **THEN** the system locks that month

#### Scenario: Edit Locked Month
- **GIVEN** a month is locked
- **WHEN** a user tries to POST/PUT/DELETE attendance for that month
- **THEN** the system returns 409 with `{ success: false, error: { code: "MONTH_LOCKED" } }`

---

### Requirement: File Upload (Member 4)
The system SHALL allow file uploads for absence documentation.

#### Scenario: Upload Document
- **GIVEN** a DailyAttendance with absence status exists
- **WHEN** POST `/api/attendance/:id/upload` with file (multipart/form-data)
- **THEN** the system stores the file and updates documentUrl
- **AND** file must be .pdf, .jpg, or .png
- **AND** file must be ≤ 5MB

#### Scenario: Invalid File Type
- **GIVEN** a file with unsupported type
- **WHEN** uploaded
- **THEN** the system returns 415 with `{ success: false, error: { code: "UNSUPPORTED_FILE_TYPE" } }`

#### Scenario: File Too Large
- **GIVEN** a file > 5MB
- **WHEN** uploaded
- **THEN** the system returns 413 with `{ success: false, error: { code: "FILE_TOO_LARGE" } }`

---

## Data Models Reference (Per `doc/models/data-models.md`)

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
  createdAt: string;
  updatedAt: string;
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
  startDate: string;
  endDate?: string | null;
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
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TaskWorker {
  taskId: number;
  userId: number;
}

export interface DailyAttendance {
  id: number;
  userId: number;
  date: string; // DATE
  startTime: string; // TIME
  endTime: string; // TIME
  status: DailyAttendanceStatus;
  documentUrl?: string | null;
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
```

---

## MODIFIED Requirements

N/A - New system

## REMOVED Requirements

N/A - New system
