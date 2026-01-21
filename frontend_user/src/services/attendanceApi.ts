/**
 * Attendance API Service
 * Handles API calls for DailyAttendance records
 */

import { apiClient } from '@shared/utils/ApiClient';
import { DailyAttendance, MonthHistoryParams } from '../types';

/**
 * Retrieve a user's daily attendance records for a specific month.
 *
 * Includes embedded time logs for each day.
 *
 * @param params - Object with `month` (1-12) and `userId` identifying the target month and user
 * @returns An array of DailyAttendance records sorted by date descending
 */
export async function getMonthHistory(params: MonthHistoryParams): Promise<DailyAttendance[]> {
  const response = await apiClient.get<DailyAttendance[]>('/attendance/month-history', {
    params: {
      month: params.month,
      userId: params.userId,
    },
  });
  return response.data;
}

/**
 * Retrieve an attendance record by its ID.
 *
 * @param id - The attendance record's ID
 * @returns The attendance record matching `id`
 */
export async function getAttendanceById(id: string): Promise<DailyAttendance> {
  const response = await apiClient.get<DailyAttendance>(`/attendance/${id}`);
  return response.data;
}

// ============================================================================
// Export all functions as a namespace for cleaner imports
// ============================================================================

export const attendanceApi = {
  getMonthHistory,
  getAttendanceById,
};