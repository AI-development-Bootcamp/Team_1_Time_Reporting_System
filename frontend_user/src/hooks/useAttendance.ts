/**
 * useAttendance Hook
 * Query hook for fetching a single attendance record by ID
 */

import { useQuery } from '@tanstack/react-query';
import { getAttendanceById } from '../services/attendanceApi';
import { DailyAttendance } from '../types';
import { QUERY_KEYS } from '../utils/constants';

interface UseAttendanceOptions {
  /** Attendance record ID */
  attendanceId: string | undefined;
  /** Whether to enable the query */
  enabled?: boolean;
}

interface UseAttendanceReturn {
  /** Attendance data */
  attendance: DailyAttendance | undefined;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  isError: boolean;
  /** Error object if any */
  error: Error | null;
  /** Success state */
  isSuccess: boolean;
  /** Refetch function */
  refetch: () => void;
}

/**
 * Hook to fetch a single attendance record by ID
 * Used for edit mode to pre-fill form data
 * 
 * @param options - Attendance ID and query options
 * @returns Query state and data
 * 
 * @example
 * const { attendance, isLoading } = useAttendance({
 *   attendanceId: '123',
 *   enabled: mode === 'edit'
 * });
 */
export function useAttendance({
  attendanceId,
  enabled = true,
}: UseAttendanceOptions): UseAttendanceReturn {
  const query = useQuery({
    queryKey: [QUERY_KEYS.attendance, attendanceId],
    queryFn: () => {
      if (!attendanceId) {
        throw new Error('Attendance ID is required');
      }
      return getAttendanceById(attendanceId);
    },
    enabled: enabled && !!attendanceId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  return {
    attendance: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    isSuccess: query.isSuccess,
    refetch: query.refetch,
  };
}
