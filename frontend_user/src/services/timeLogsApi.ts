/**
 * Time Logs API Service
 * Handles API calls for ProjectTimeLogs records
 */

import { apiClient } from '@shared/utils/ApiClient';
import { SerializedTimeLog, TimeLogsParams } from '../types';

/**
 * Fetches time logs for the given daily attendance record.
 *
 * @param params - Object containing `dailyAttendanceId`, the ID of the daily attendance used to filter time logs
 * @returns An array of serialized time log records for the specified daily attendance
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
 * Retrieve a time log by its identifier.
 *
 * @param id - The ID of the time log to fetch
 * @returns The time log record for the given `id`
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