/**
 * useUpdateDailyReport Hook
 * Mutation hooks for updating daily attendance and managing time logs
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { updateAttendance } from '../services/attendanceApi';
import { createTimeLog, updateTimeLog, deleteTimeLog } from '../services/timeLogsApi';
import {
  UpdateAttendanceInput,
  CreateTimeLogData,
  UpdateTimeLogData,
} from '../types';
import { QUERY_KEYS } from '../utils/constants';

interface UpdateAttendanceParams {
  id: string;
  data: UpdateAttendanceInput;
}

interface UpdateTimeLogParams {
  id: string;
  data: UpdateTimeLogData;
}

interface UseUpdateDailyReportReturn {
  // Update attendance mutation
  updateAttendance: {
    mutate: (params: UpdateAttendanceParams) => void;
    mutateAsync: (params: UpdateAttendanceParams) => Promise<any>;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    isSuccess: boolean;
  };
  
  // Create time log mutation
  createTimeLog: {
    mutate: (data: CreateTimeLogData) => void;
    mutateAsync: (data: CreateTimeLogData) => Promise<any>;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    isSuccess: boolean;
  };
  
  // Update time log mutation
  updateTimeLog: {
    mutate: (params: UpdateTimeLogParams) => void;
    mutateAsync: (params: UpdateTimeLogParams) => Promise<any>;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    isSuccess: boolean;
  };
  
  // Delete time log mutation
  deleteTimeLog: {
    mutate: (id: string) => void;
    mutateAsync: (id: string) => Promise<any>;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    isSuccess: boolean;
  };
  
  // Combined loading state
  isAnyLoading: boolean;
}

/**
 * Hook to manage daily report updates
 * Provides separate mutations for updating attendance and managing time logs
 * Automatically invalidates relevant queries and shows toast notifications
 * 
 * @returns Multiple mutation functions and their states
 * 
 * @example
 * const { updateAttendance, createTimeLog, deleteTimeLog } = useUpdateDailyReport();
 * 
 * // Update attendance times
 * await updateAttendance.mutateAsync({
 *   id: 'attendance-1',
 *   data: { startTime: '09:00', endTime: '18:00' }
 * });
 * 
 * // Add a new time log
 * await createTimeLog.mutateAsync({
 *   dailyAttendanceId: 'attendance-1',
 *   taskId: 'task-1',
 *   duration: 240,
 *   location: 'office'
 * });
 * 
 * // Delete a time log
 * await deleteTimeLog.mutateAsync('timelog-1');
 */
export function useUpdateDailyReport(): UseUpdateDailyReportReturn {
  const queryClient = useQueryClient();

  // Shared invalidation logic
  const invalidateQueries = () => {
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.monthHistory],
    });
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.timeLogs],
    });
  };

  // Update attendance mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: ({ id, data }: UpdateAttendanceParams) => updateAttendance(id, data),
    onSuccess: () => {
      invalidateQueries();
      notifications.show({
        title: 'הצלחה',
        message: 'הדיווח עודכן בהצלחה',
        color: 'green',
        autoClose: 3000,
      });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'שגיאה',
        message: error.message || 'שגיאה בעדכון דיווח',
        color: 'red',
        autoClose: 5000,
      });
    },
  });

  // Create time log mutation
  const createTimeLogMutation = useMutation({
    mutationFn: createTimeLog,
    onSuccess: () => {
      invalidateQueries();
      notifications.show({
        title: 'הצלחה',
        message: 'דיווח פרויקט נוסף בהצלחה',
        color: 'green',
        autoClose: 3000,
      });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'שגיאה',
        message: error.message || 'שגיאה בהוספת דיווח פרויקט',
        color: 'red',
        autoClose: 5000,
      });
    },
  });

  // Update time log mutation
  const updateTimeLogMutation = useMutation({
    mutationFn: ({ id, data }: UpdateTimeLogParams) => updateTimeLog(id, data),
    onSuccess: () => {
      invalidateQueries();
      notifications.show({
        title: 'הצלחה',
        message: 'דיווח פרויקט עודכן בהצלחה',
        color: 'green',
        autoClose: 3000,
      });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'שגיאה',
        message: error.message || 'שגיאה בעדכון דיווח פרויקט',
        color: 'red',
        autoClose: 5000,
      });
    },
  });

  // Delete time log mutation
  const deleteTimeLogMutation = useMutation({
    mutationFn: deleteTimeLog,
    onSuccess: () => {
      invalidateQueries();
      notifications.show({
        title: 'הצלחה',
        message: 'דיווח פרויקט נמחק בהצלחה',
        color: 'green',
        autoClose: 3000,
      });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'שגיאה',
        message: error.message || 'שגיאה במחיקת דיווח פרויקט',
        color: 'red',
        autoClose: 5000,
      });
    },
  });

  return {
    updateAttendance: {
      mutate: updateAttendanceMutation.mutate,
      mutateAsync: updateAttendanceMutation.mutateAsync,
      isLoading: updateAttendanceMutation.isPending,
      isError: updateAttendanceMutation.isError,
      error: updateAttendanceMutation.error as Error | null,
      isSuccess: updateAttendanceMutation.isSuccess,
    },
    createTimeLog: {
      mutate: createTimeLogMutation.mutate,
      mutateAsync: createTimeLogMutation.mutateAsync,
      isLoading: createTimeLogMutation.isPending,
      isError: createTimeLogMutation.isError,
      error: createTimeLogMutation.error as Error | null,
      isSuccess: createTimeLogMutation.isSuccess,
    },
    updateTimeLog: {
      mutate: updateTimeLogMutation.mutate,
      mutateAsync: updateTimeLogMutation.mutateAsync,
      isLoading: updateTimeLogMutation.isPending,
      isError: updateTimeLogMutation.isError,
      error: updateTimeLogMutation.error as Error | null,
      isSuccess: updateTimeLogMutation.isSuccess,
    },
    deleteTimeLog: {
      mutate: deleteTimeLogMutation.mutate,
      mutateAsync: deleteTimeLogMutation.mutateAsync,
      isLoading: deleteTimeLogMutation.isPending,
      isError: deleteTimeLogMutation.isError,
      error: deleteTimeLogMutation.error as Error | null,
      isSuccess: deleteTimeLogMutation.isSuccess,
    },
    isAnyLoading:
      updateAttendanceMutation.isPending ||
      createTimeLogMutation.isPending ||
      updateTimeLogMutation.isPending ||
      deleteTimeLogMutation.isPending,
  };
}
