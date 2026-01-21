/**
 * Time Logs API Service
 * Handles API calls for ProjectTimeLogs records
 */

import { apiClient } from '@shared/utils/ApiClient';
import {
  SerializedTimeLog,
  TimeLogsParams,
  CreateTimeLogData,
  UpdateTimeLogData,
} from '../types';

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
// Create & Update Operations
// ============================================================================

/**
 * Create a new time log
 * 
 * @param data - Time log data
 * @returns Created time log ID
 */
export async function createTimeLog(data: CreateTimeLogData): Promise<{ success: true; data: { id: string } }> {
  const response = await apiClient.post<{ success: true; data: { id: string } }>('/time-logs', data);
  return response.data;
}

/**
 * Update an existing time log
 * 
 * @param id - Time log ID
 * @param data - Fields to update
 * @returns Success response
 */
export async function updateTimeLog(
  id: string,
  data: UpdateTimeLogData
): Promise<{ success: true; message: string }> {
  const response = await apiClient.put<{ success: true; message: string }>(`/time-logs/${id}`, data);
  return response.data;
}

/**
 * Delete a time log
 * 
 * @param id - Time log ID
 * @returns Success response
 */
export async function deleteTimeLog(id: string): Promise<{ success: true; message: string }> {
  const response = await apiClient.delete<{ success: true; message: string }>(`/time-logs/${id}`);
  return response.data;
}

// ============================================================================
// Export all functions as a namespace for cleaner imports
// ============================================================================

export const timeLogsApi = {
  getTimeLogsByAttendance,
  getTimeLogById,
  createTimeLog,
  updateTimeLog,
  deleteTimeLog,
};
