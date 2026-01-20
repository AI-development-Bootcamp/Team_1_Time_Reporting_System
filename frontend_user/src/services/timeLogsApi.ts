/**
 * Time Logs API Service
 * Handles API calls for ProjectTimeLogs records
 */

import { apiClient } from '@shared/utils/ApiClient';
import { SerializedTimeLog, TimeLogsParams } from '../types';

/**
 * Get time logs for a specific attendance record
 * 
 * @param params - dailyAttendanceId
 * @returns Array of time logs
 */
export async function getTimeLogsByAttendance(params: TimeLogsParams): Promise<SerializedTimeLog[]> {
  const response = await apiClient.get<SerializedTimeLog[]>('/time-logs', {
    params: {
      dailyAttendanceId: params.dailyAttendanceId,
    },
  });
  return response.data;
}

/**
 * Get a single time log by ID
 * 
 * @param id - Time log ID
 * @returns Time log record
 */
export async function getTimeLogById(id: string): Promise<SerializedTimeLog> {
  const response = await apiClient.get<SerializedTimeLog>(`/time-logs/${id}`);
  return response.data;
}

// ============================================================================
// Export all functions as a namespace for cleaner imports
// ============================================================================

export const timeLogsApi = {
  getTimeLogsByAttendance,
  getTimeLogById,
};
