/**
 * Attendance API Service
 * Handles API calls for DailyAttendance records
 */

import { apiClient } from '@shared/utils/ApiClient';
import { DailyAttendance, MonthHistoryParams } from '../types';

/**
 * Get month history for the authenticated user
 * Returns all DailyAttendance records with embedded time logs for a specific month
 * Note: userId is obtained from auth token on the backend
 * 
 * @param params - Month (1-12) and year
 * @returns Array of DailyAttendance records sorted by date descending
 */
export async function getMonthHistory(params: MonthHistoryParams): Promise<DailyAttendance[]> {
  const response = await apiClient.get<DailyAttendance[]>('/attendance/month-history', {
    params: {
      month: params.month,
    },
  });
  return response.data;
}

/**
 * Get a single attendance record by ID
 * 
 * @param id - Attendance record ID
 * @returns DailyAttendance record
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
