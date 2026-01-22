/**
 * TimeLog Types
 * Matches backend API response from /api/time-logs
 */

import { LocationStatus } from './attendance';

/**
 * Serialized time log from GET /api/time-logs?dailyAttendanceId=X
 * Note: This is the flat version without embedded task info
 */
export interface SerializedTimeLog {
  id: string;
  dailyAttendanceId: string;
  taskId: string;
  duration: number; // in minutes
  startTime: string | null; // HH:mm or null
  endTime: string | null; // HH:mm or null
  location: LocationStatus;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * API response wrapper for time logs list
 */
export interface TimeLogsResponse {
  success: true;
  data: SerializedTimeLog[];
}

/**
 * Query params for time logs endpoint
 */
export interface TimeLogsParams {
  dailyAttendanceId: string;
}

/**
 * Create time log request body
 */
export interface CreateTimeLogData {
  dailyAttendanceId: string;
  taskId: string;
  duration?: number; // For duration-based projects
  startTime?: string; // For startEnd-based projects (HH:mm)
  endTime?: string; // For startEnd-based projects (HH:mm)
  location: LocationStatus;
  description?: string;
}

/**
 * Update time log request body
 */
export interface UpdateTimeLogData {
  taskId?: string;
  duration?: number;
  startTime?: string | null;
  endTime?: string | null;
  location?: LocationStatus;
  description?: string | null;
}
