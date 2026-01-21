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
 * Fetches a user's attendance history for a specific month and exposes query state and controls.
 *
 * @param month - Month number (1-12) for which to fetch attendance
 * @param year - Four-digit year for which to fetch attendance
 * @param userId - Identifier of the user whose attendance is requested
 * @param enabled - When false, disables the query even if `userId` is provided (default: `true`)
 * @returns An object containing:
 *  - `attendances`: array of DailyAttendance records (empty array if none),
 *  - `isLoading`: whether the initial load is in progress,
 *  - `isError`: whether the query encountered an error,
 *  - `error`: the Error object when `isError` is true, otherwise `null`,
 *  - `refetch`: function to manually re-run the query,
 *  - `isFetching`: whether the query is currently fetching (including background fetches)
 */
export function useMonthHistory({
  month,
  year,
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
    queryKey: [QUERY_KEYS.monthHistory, year, month, userId],
    queryFn: () => getMonthHistory({ month, userId }),
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