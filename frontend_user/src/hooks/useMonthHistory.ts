/**
 * useMonthHistory Hook
 * Fetches and manages month history data using TanStack Query
 */

import { useQuery } from '@tanstack/react-query';
import { getMonthHistory } from '../services/attendanceApi';
import { DailyAttendance } from '../types';
import { QUERY_KEYS } from '../utils/constants';

interface UseMonthHistoryParams {
  month: number; // 1-12
  year: number;
  userId: string;
  enabled?: boolean;
}

interface UseMonthHistoryReturn {
  /** Array of attendance records for the month */
  attendances: DailyAttendance[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  isError: boolean;
  /** Error object if any */
  error: Error | null;
  /** Refetch function */
  refetch: () => void;
  /** Is currently fetching (includes background refetches) */
  isFetching: boolean;
}

/**
 * Hook to fetch month history data
 * Note: userId is obtained from auth token on the backend
 * 
 * @param params - Month, year, userId (for cache key), and optional enabled flag
 * @returns Attendance data, loading/error states, and refetch function
 */
export function useMonthHistory({
  month,
  year: _year, // Reserved for future use when backend supports year filtering
  userId,
  enabled = true,
}: UseMonthHistoryParams): UseMonthHistoryReturn {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [QUERY_KEYS.monthHistory, month, userId],
    queryFn: () => getMonthHistory({ month }),
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  return {
    attendances: data ?? [],
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
    isFetching,
  };
}
