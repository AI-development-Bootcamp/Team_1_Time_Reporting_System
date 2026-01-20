/**
 * DailyAttendance Types
 * Matches backend API response from /api/attendance/month-history
 */

// Status values from Prisma enum
export type DailyAttendanceStatus = 'work' | 'sickness' | 'dayOff' | 'halfDayOff' | 'reserves';

// Location values from Prisma enum
export type LocationStatus = 'office' | 'client' | 'home';

/**
 * Task info embedded in time log
 */
export interface TaskInfo {
  id: string;
  name: string;
  project: {
    id: string;
    name: string;
    client: {
      id: string;
      name: string;
    };
  };
}

/**
 * Time log entry embedded in attendance
 */
export interface ProjectTimeLog {
  id: string;
  dailyAttendanceId: string;
  taskId: string;
  duration: number; // in minutes
  location: LocationStatus;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  task: TaskInfo;
}

/**
 * DailyAttendance record with embedded time logs
 * Response from GET /api/attendance/month-history
 */
export interface DailyAttendance {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  startTime: string | null; // HH:mm
  endTime: string | null; // HH:mm
  status: DailyAttendanceStatus;
  document: boolean | null; // true if document exists, null otherwise
  createdAt: string;
  updatedAt: string;
  projectTimeLogs: ProjectTimeLog[];
}

/**
 * API response wrapper for month history
 */
export interface MonthHistoryResponse {
  success: true;
  data: DailyAttendance[];
}

/**
 * Query params for month history endpoint
 */
export interface MonthHistoryParams {
  month: number; // 1-12
  userId: string;
}
