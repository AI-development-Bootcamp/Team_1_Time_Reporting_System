/**
 * useTimeLogs Hook
 * Fetches time logs for a specific attendance record (lazy load on expand)
 * 
 * Note: For the Month History page, time logs are embedded in the attendance response.
 * This hook is provided for cases where separate time log fetching is needed.
 */

import { useQuery } from '@tanstack/react-query';
import { getTimeLogsByAttendance } from '../services/timeLogsApi';
import { SerializedTimeLog } from '../types';
import { QUERY_KEYS } from '../utils/constants';

interface UseTimeLogsParams {
  dailyAttendanceId: string;
  enabled?: boolean;
}

interface UseTimeLogsReturn {
  /** Array of time logs for the attendance */
  timeLogs: SerializedTimeLog[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  isError: boolean;
  /** Error object if any */
  error: Error | null;
  /** Refetch function */
  refetch: () => void;
}

/**
 * Hook to fetch time logs for a specific attendance record
 * Use `enabled` prop to control when to fetch (e.g., only when accordion is expanded)
 * 
 * @param params - dailyAttendanceId and optional enabled flag
 * @returns Time logs data, loading/error states, and refetch function
 */
export function useTimeLogs({
  dailyAttendanceId,
  enabled = true,
}: UseTimeLogsParams): UseTimeLogsReturn {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.timeLogs, dailyAttendanceId],
    queryFn: () => getTimeLogsByAttendance({ dailyAttendanceId }),
    enabled: enabled && !!dailyAttendanceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    timeLogs: data ?? [],
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}
