/**
 * Attendance API Service
 * Handles API calls for DailyAttendance records
 */

import { apiClient } from '@shared/utils/ApiClient';
import {
  DailyAttendance,
  MonthHistoryParams,
  CreateCombinedAttendanceRequest,
  CreateCombinedAttendanceResponse,
  CreateAbsenceAttendanceRequest,
  UpdateAttendanceInput,
} from '../types';

/**
 * Get month history for a user
 * Returns all DailyAttendance records with embedded time logs for a specific month
 * 
 * @param params - Month (1-12) and userId
 * @returns Array of DailyAttendance records sorted by date descending
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
// Create & Update Operations
// ============================================================================

/**
 * Create a combined attendance record with time logs in a single transaction
 * Used for work attendance with project reports
 * 
 * @param data - Combined attendance data with embedded time logs
 * @returns Created attendance ID and time log IDs
 */
export async function createCombinedAttendance(
  data: CreateCombinedAttendanceRequest
): Promise<CreateCombinedAttendanceResponse> {
  const response = await apiClient.post<CreateCombinedAttendanceResponse>(
    '/attendance/combined',
    data
  );
  return response.data;
}

/**
 * Create an absence attendance record (sickness, dayOff, halfDayOff, reserves)
 * 
 * @param data - Absence attendance data
 * @returns Created attendance record
 */
export async function createAbsenceAttendance(
  data: CreateAbsenceAttendanceRequest
): Promise<DailyAttendance> {
  const response = await apiClient.post<DailyAttendance>('/attendance', data);
  return response.data;
}

/**
 * Update an existing attendance record
 * Can update times or switch between work/absence types
 * 
 * @param id - Attendance record ID
 * @param data - Fields to update
 * @returns Updated attendance record
 */
export async function updateAttendance(
  id: string,
  data: UpdateAttendanceInput
): Promise<DailyAttendance> {
  const response = await apiClient.put<DailyAttendance>(`/attendance/${id}`, data);
  return response.data;
}

// ============================================================================
// Document Operations
// ============================================================================

/**
 * Upload a document to an absence attendance record
 * For sickness or reserves attendance types
 * 
 * @param attendanceId - Attendance record ID
 * @param file - File to upload (PDF, JPG, PNG)
 * @returns Upload confirmation
 */
export async function uploadDocument(
  attendanceId: string,
  file: File
): Promise<{ success: true; message: string }> {
  const formData = new FormData();
  formData.append('document', file);

  const response = await apiClient.post<{ success: true; message: string }>(
    `/attendance/${attendanceId}/document`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

/**
 * Delete a document from an absence attendance record
 * 
 * @param attendanceId - Attendance record ID
 * @returns Deletion confirmation
 */
export async function deleteDocument(
  attendanceId: string
): Promise<{ success: true; message: string }> {
  const response = await apiClient.delete<{ success: true; message: string }>(
    `/attendance/${attendanceId}/document`
  );
  return response.data;
}

// ============================================================================
// Export all functions as a namespace for cleaner imports
// ============================================================================

export const attendanceApi = {
  getMonthHistory,
  getAttendanceById,
  createCombinedAttendance,
  createAbsenceAttendance,
  updateAttendance,
  uploadDocument,
  deleteDocument,
};
