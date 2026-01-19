# Technical Coordination: Project Reporting Settings

**To:** Member 3 (Entity Management)  
**From:** Project Admin / Member 1  
**Subject:** Requirement update for `Project` model & API

## Context
We are implementing a new **"Reporting Hours Settings" (הגדרת דיווחי שעות)** tab. This screen allows admins to choose how workers report time for each specific project: either via **Start/End times** (כניסה/יציאה) or **Total Duration** (סכום שעות).

Since you are handling the Project CRUD and Database setup, please include the following changes in your implementation.

---

## 1. Database Schema (Prisma)
Please add a new Enum and a field to the `Project` model. Note that the **default value must be `startEnd`**.

```prisma
enum ReportingType {
  duration
  startEnd
}

model Project {
  id               BigInt        @id @default(autoincrement())
  name             String
  // ... existing fields ...
  reportingType    ReportingType @default(startEnd) @map("reporting_type")

  @@map("projects")
}
```

---

## 2. API Requirements

### `GET /admin/projects`
Please ensure the response includes the `reportingType` field so it can be displayed in the settings table.
```json
{
  "id": 5,
  "name": "Cargo",
  "reportingType": "startEnd",
  "active": true
}
```

### `POST /admin/projects`
When creating a new project, it should automatically default to `startEnd`. If you allow the admin to set this during creation, please add `reportingType` as an optional field in the request body.

---

## 3. Planned Implementation (For your information)
To support the "save immediately" requirement for the radio buttons, I (Member 1) will be implementing:
*   **`PATCH /admin/projects/:id`**: A partial update endpoint specifically to toggle this setting.

---

## 4. Impact on other members
*   **Member 2 (Time Reporting):** Will use this field to decide which UI to show the worker (Time Pickers vs. Duration Input).
*   **Member 4 (Timer):** Will check this field to decide if a timer is allowed for the project.

---

**Please let me know once you have updated the Prisma schema so I can sync my local environment!**
