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
 * Fetch time logs for a specific daily attendance record and expose fetch state and manual refetch control.
 *
 * @param params - Parameters for fetching time logs.
 * @param params.dailyAttendanceId - Identifier of the attendance record whose time logs should be fetched.
 * @param params.enabled - When `false`, disables automatic fetching (useful for lazy loading, e.g., when an accordion is collapsed); defaults to `true`.
 * @returns An object with:
 * - `timeLogs`: an array of `SerializedTimeLog` (empty array if no data),
 * - `isLoading`: `true` while the query is loading,
 * - `isError`: `true` if the query failed,
 * - `error`: the `Error` instance when a failure occurred, or `null`,
 * - `refetch`: a function to trigger a manual refetch.
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