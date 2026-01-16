# Data Models (Schemas)

TypeScript data models for the core entities in the system.

```ts
export type UserType = 'worker' | 'admin';
export type TaskStatus = 'open' | 'closed';
export type DailyAttendanceStatus = 'work' | 'sickness' | 'reserves' | 'dayOff' | 'halfDayOff';
export type LocationStatus = 'office' | 'client' | 'home';

export interface User {
  id: number;
  name: string;
  mail: string;
  userType: UserType;
  active: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
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
  startDate: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD | null
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
//many to many
export interface TaskWorker {
  taskId: number;
  userId: number;
  // Unique constraint: (taskId, userId) - ensures a user can only be assigned to a task once
}

export interface DailyAttendance {
  id: number;
  userId: number;
  date: string; // In SQL: saved as DATE object
  startTime: string; // In SQL: saved as TIME type
  endTime: string; // In SQL: saved as TIME type
  status: DailyAttendanceStatus;
  document?: Uint8Array | null; // Binary file stored as Bytes in DB
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTimeLogs {
  id: number;
  dailyAttendanceId: number;
  taskId: number;
  duration: number; // in minutes
  location: LocationStatus; // Where the work was done: office, client, or home
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}
```
