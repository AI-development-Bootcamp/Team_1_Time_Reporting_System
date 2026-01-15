# Time Reporting System - Spec Deltas

## ADDED Requirements

### Requirement: Authentication System
The system SHALL provide JWT-based authentication with 24h token expiry.

#### Scenario: User Login
- **WHEN** a user submits valid credentials (mail, password)
- **THEN** the system returns a JWT token and user information
- **AND** the token expires after 24 hours
- **AND** the response format matches the API specification: `{success: true, data: {token, expiresInHours, user}}`

#### Scenario: Protected Route Access
- **WHEN** a user accesses a protected route without a valid token
- **THEN** the system returns 401 Unauthorized
- **AND** the error format matches the API specification: `{success: false, error: {code: "UNAUTHORIZED", message: "..."}}`

### Requirement: Manual Time Reporting
The system SHALL allow users to manually enter daily work hours with multiple project entries per day.

#### Scenario: Create Time Entry
- **WHEN** a user submits a time entry with date, startTime, endTime, status
- **THEN** the system creates a DailyAttendance record
- **AND** creates ProjectTimeLogs records with taskId and duration in minutes
- **AND** validates that endTime > startTime (blocks with 400 VALIDATION_ERROR if invalid)
- **AND** checks month lock status (blocks with 409 MONTH_LOCKED if locked)
- **AND** stores duration in minutes per task entry (not start/end times per task)

#### Scenario: Multiple Entries Per Day
- **WHEN** a user submits multiple time entries for the same day
- **THEN** the system creates multiple ProjectTimeLogs linked to the same DailyAttendance
- **AND** allows overlapping time windows for different tasks
- **AND** DailyAttendance stores overall day start/end times (optional TIME fields)

### Requirement: Project Selector
The system SHALL provide a project selector that groups projects by client and sorts by usage frequency.

#### Scenario: Load Project Selector
- **WHEN** a user opens the project selector
- **THEN** the system displays projects grouped by client header
- **AND** sorts projects by last week's usage frequency (highest first)
- **AND** loads within 300ms (cached)

### Requirement: Month History Report
The system SHALL display a month history report with accordion UI and status badges.

#### Scenario: View Month History
- **WHEN** a user selects a month (uses current year)
- **THEN** the system displays days in descending order (newest on top)
- **AND** shows status badges (Red/Yellow/Green/Blue) based on hours:
  - Red: Missing/no hours
  - Green: 9h (full quota)
  - Yellow: <9h (partial)
  - Blue: Sick/Weekend/Holiday
- **AND** allows expanding to see time entry details (time range, client, project, duration)
- **AND** displays date with icon (briefcase for work, calendar for absence)
- **AND** response format is array of DailyAttendance objects (not nested structure)

### Requirement: Admin CRUD Operations
The system SHALL allow admins to manage users, clients, projects, tasks, and assignments.

#### Scenario: Create User
- **WHEN** an admin creates a user with mail, password, name, userType
- **THEN** the system creates the user with hashed password
- **AND** returns the user ID

#### Scenario: Soft Delete User
- **WHEN** an admin deletes a user
- **THEN** the system sets active=false
- **AND** the user no longer appears in standard queries

## MODIFIED Requirements

N/A - New system

## REMOVED Requirements

N/A - New system
