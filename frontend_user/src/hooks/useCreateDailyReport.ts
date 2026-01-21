/**
 * useCreateDailyReport Hook
 * Mutation hook for creating combined daily attendance with time logs
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { createCombinedAttendance } from '../services/attendanceApi';
import { CreateCombinedAttendanceRequest, CreateCombinedAttendanceResponse } from '../types';
import { QUERY_KEYS } from '../utils/constants';

interface UseCreateDailyReportReturn {
  /** Mutation function (fire-and-forget) */
  mutate: (data: CreateCombinedAttendanceRequest) => void;
  /** Async mutation function (returns promise) */
  mutateAsync: (data: CreateCombinedAttendanceRequest) => Promise<CreateCombinedAttendanceResponse>;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  isError: boolean;
  /** Error object if any */
  error: Error | null;
  /** Success state */
  isSuccess: boolean;
  /** Reset mutation state */
  reset: () => void;
}

/**
 * Hook to create a combined daily attendance record with time logs
 * Automatically invalidates month history cache and shows toast notifications
 * 
 * @returns Mutation functions and states
 * 
 * @example
 * const { mutateAsync, isLoading } = useCreateDailyReport();
 * 
 * await mutateAsync({
 *   userId: '123',
 *   date: '2026-01-21',
 *   startTime: '09:00',
 *   endTime: '17:00',
 *   status: 'work',
 *   timeLogs: [...]
 * });
 */
export function useCreateDailyReport(): UseCreateDailyReportReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createCombinedAttendance,
    onSuccess: () => {
      // Invalidate month history query to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.monthHistory],
      });

      // Show success toast
      notifications.show({
        title: 'הצלחה',
        message: 'דיווח שעות הושלם',
        color: 'green',
        autoClose: 3000,
      });
    },
    onError: (error: Error) => {
      // Show error toast
      notifications.show({
        title: 'שגיאה',
        message: error.message || 'שגיאה ביצירת דיווח',
        color: 'red',
        autoClose: 5000,
      });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error as Error | null,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
}
