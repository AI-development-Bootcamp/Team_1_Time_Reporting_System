import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateDailyReport } from './useUpdateDailyReport';
import * as attendanceApi from '../services/attendanceApi';
import * as timeLogsApi from '../services/timeLogsApi';
import { notifications } from '@mantine/notifications';

// Mock the API modules
vi.mock('../services/attendanceApi');
vi.mock('../services/timeLogsApi');
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useUpdateDailyReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Update Attendance Tests
  // ============================================================================

  describe('updateAttendance', () => {
    it('updates attendance successfully', async () => {
      const mockResponse = { id: 'attendance-1', status: 'work' };
      vi.mocked(attendanceApi.updateAttendance).mockResolvedValue(mockResponse as any);

      const { result } = renderHook(() => useUpdateDailyReport(), {
        wrapper: createWrapper(),
      });

      const updateParams = {
        id: 'attendance-1',
        data: { startTime: '09:00', endTime: '18:00' },
      };

      result.current.updateAttendance.mutate(updateParams);

      await waitFor(() => {
        expect(result.current.updateAttendance.isSuccess).toBe(true);
      });

      expect(result.current.updateAttendance.isLoading).toBe(false);
      expect(result.current.updateAttendance.isError).toBe(false);
    });

    it('shows success toast on successful update', async () => {
      vi.mocked(attendanceApi.updateAttendance).mockResolvedValue({} as any);

      const { result } = renderHook(() => useUpdateDailyReport(), {
        wrapper: createWrapper(),
      });

      result.current.updateAttendance.mutate({
        id: 'attendance-1',
        data: { startTime: '09:00' },
      });

      await waitFor(() => {
        expect(result.current.updateAttendance.isSuccess).toBe(true);
      });

      expect(notifications.show).toHaveBeenCalledWith({
        title: 'הצלחה',
        message: 'הדיווח עודכן בהצלחה',
        color: 'green',
        autoClose: 3000,
      });
    });

    it('handles update attendance error', async () => {
      const errorMessage = 'Update failed';
      vi.mocked(attendanceApi.updateAttendance).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useUpdateDailyReport(), {
        wrapper: createWrapper(),
      });

      result.current.updateAttendance.mutate({
        id: 'attendance-1',
        data: { startTime: '09:00' },
      });

      await waitFor(() => {
        expect(result.current.updateAttendance.isError).toBe(true);
      });

      expect(notifications.show).toHaveBeenCalledWith({
        title: 'שגיאה',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    });
  });

  // ============================================================================
  // Create Time Log Tests
  // ============================================================================

  describe('createTimeLog', () => {
    it('creates time log successfully', async () => {
      const mockResponse = { success: true, data: { id: 'timelog-1' } };
      vi.mocked(timeLogsApi.createTimeLog).mockResolvedValue(mockResponse as any);

      const { result } = renderHook(() => useUpdateDailyReport(), {
        wrapper: createWrapper(),
      });

      const createData = {
        dailyAttendanceId: 'attendance-1',
        taskId: 'task-1',
        duration: 480,
        location: 'office' as const,
      };

      result.current.createTimeLog.mutate(createData);

      await waitFor(() => {
        expect(result.current.createTimeLog.isSuccess).toBe(true);
      });

      expect(result.current.createTimeLog.isLoading).toBe(false);
      expect(result.current.createTimeLog.isError).toBe(false);
    });

    it('shows success toast on time log creation', async () => {
      vi.mocked(timeLogsApi.createTimeLog).mockResolvedValue({} as any);

      const { result } = renderHook(() => useUpdateDailyReport(), {
        wrapper: createWrapper(),
      });

      result.current.createTimeLog.mutate({
        dailyAttendanceId: 'attendance-1',
        taskId: 'task-1',
        duration: 480,
        location: 'office',
      });

      await waitFor(() => {
        expect(result.current.createTimeLog.isSuccess).toBe(true);
      });

      expect(notifications.show).toHaveBeenCalledWith({
        title: 'הצלחה',
        message: 'דיווח פרויקט נוסף בהצלחה',
        color: 'green',
        autoClose: 3000,
      });
    });

    it('handles create time log error', async () => {
      const errorMessage = 'Creation failed';
      vi.mocked(timeLogsApi.createTimeLog).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useUpdateDailyReport(), {
        wrapper: createWrapper(),
      });

      result.current.createTimeLog.mutate({
        dailyAttendanceId: 'attendance-1',
        taskId: 'task-1',
        duration: 480,
        location: 'office',
      });

      await waitFor(() => {
        expect(result.current.createTimeLog.isError).toBe(true);
      });

      expect(notifications.show).toHaveBeenCalledWith({
        title: 'שגיאה',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    });
  });

  // ============================================================================
  // Update Time Log Tests
  // ============================================================================

  describe('updateTimeLog', () => {
    it('updates time log successfully', async () => {
      const mockResponse = { success: true as const, message: 'Updated' };
      vi.mocked(timeLogsApi.updateTimeLog).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUpdateDailyReport(), {
        wrapper: createWrapper(),
      });

      const updateParams = {
        id: 'timelog-1',
        data: { duration: 240 },
      };

      result.current.updateTimeLog.mutate(updateParams);

      await waitFor(() => {
        expect(result.current.updateTimeLog.isSuccess).toBe(true);
      });

      expect(result.current.updateTimeLog.isLoading).toBe(false);
      expect(result.current.updateTimeLog.isError).toBe(false);
    });

    it('shows success toast on time log update', async () => {
      vi.mocked(timeLogsApi.updateTimeLog).mockResolvedValue({} as any);

      const { result } = renderHook(() => useUpdateDailyReport(), {
        wrapper: createWrapper(),
      });

      result.current.updateTimeLog.mutate({
        id: 'timelog-1',
        data: { duration: 240 },
      });

      await waitFor(() => {
        expect(result.current.updateTimeLog.isSuccess).toBe(true);
      });

      expect(notifications.show).toHaveBeenCalledWith({
        title: 'הצלחה',
        message: 'דיווח פרויקט עודכן בהצלחה',
        color: 'green',
        autoClose: 3000,
      });
    });

    it('handles update time log error', async () => {
      const errorMessage = 'Update failed';
      vi.mocked(timeLogsApi.updateTimeLog).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useUpdateDailyReport(), {
        wrapper: createWrapper(),
      });

      result.current.updateTimeLog.mutate({
        id: 'timelog-1',
        data: { duration: 240 },
      });

      await waitFor(() => {
        expect(result.current.updateTimeLog.isError).toBe(true);
      });

      expect(notifications.show).toHaveBeenCalledWith({
        title: 'שגיאה',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    });
  });

  // ============================================================================
  // Delete Time Log Tests
  // ============================================================================

  describe('deleteTimeLog', () => {
    it('deletes time log successfully', async () => {
      const mockResponse = { success: true as const, message: 'Deleted' };
      vi.mocked(timeLogsApi.deleteTimeLog).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUpdateDailyReport(), {
        wrapper: createWrapper(),
      });

      result.current.deleteTimeLog.mutate('timelog-1');

      await waitFor(() => {
        expect(result.current.deleteTimeLog.isSuccess).toBe(true);
      });

      expect(result.current.deleteTimeLog.isLoading).toBe(false);
      expect(result.current.deleteTimeLog.isError).toBe(false);
    });

    it('shows success toast on time log deletion', async () => {
      vi.mocked(timeLogsApi.deleteTimeLog).mockResolvedValue({} as any);

      const { result } = renderHook(() => useUpdateDailyReport(), {
        wrapper: createWrapper(),
      });

      result.current.deleteTimeLog.mutate('timelog-1');

      await waitFor(() => {
        expect(result.current.deleteTimeLog.isSuccess).toBe(true);
      });

      expect(notifications.show).toHaveBeenCalledWith({
        title: 'הצלחה',
        message: 'דיווח פרויקט נמחק בהצלחה',
        color: 'green',
        autoClose: 3000,
      });
    });

    it('handles delete time log error', async () => {
      const errorMessage = 'Deletion failed';
      vi.mocked(timeLogsApi.deleteTimeLog).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useUpdateDailyReport(), {
        wrapper: createWrapper(),
      });

      result.current.deleteTimeLog.mutate('timelog-1');

      await waitFor(() => {
        expect(result.current.deleteTimeLog.isError).toBe(true);
      });

      expect(notifications.show).toHaveBeenCalledWith({
        title: 'שגיאה',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    });
  });

  // ============================================================================
  // Combined State Tests
  // ============================================================================

  describe('combined state', () => {
    it('tracks isAnyLoading across all mutations', async () => {
      vi.mocked(attendanceApi.updateAttendance).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() => useUpdateDailyReport(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isAnyLoading).toBe(false);

      result.current.updateAttendance.mutate({
        id: 'attendance-1',
        data: { startTime: '09:00' },
      });

      // Should be loading
      await waitFor(() => {
        expect(result.current.isAnyLoading).toBe(true);
      });
    });

    it('invalidates both monthHistory and timeLogs queries', async () => {
      vi.mocked(timeLogsApi.createTimeLog).mockResolvedValue({} as any);

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useUpdateDailyReport(), { wrapper });

      result.current.createTimeLog.mutate({
        dailyAttendanceId: 'attendance-1',
        taskId: 'task-1',
        duration: 480,
        location: 'office',
      });

      await waitFor(() => {
        expect(result.current.createTimeLog.isSuccess).toBe(true);
      });

      // Should invalidate both query keys
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['monthHistory'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['timeLogs'],
      });
    });
  });

  // ============================================================================
  // API Call Verification Tests
  // ============================================================================

  describe('API call verification', () => {
    it('passes correct parameters to updateAttendance API', async () => {
      vi.mocked(attendanceApi.updateAttendance).mockResolvedValue({} as any);

      const { result } = renderHook(() => useUpdateDailyReport(), {
        wrapper: createWrapper(),
      });

      const params = {
        id: 'attendance-123',
        data: { startTime: '10:00', endTime: '19:00' },
      };

      await result.current.updateAttendance.mutateAsync(params);

      expect(attendanceApi.updateAttendance).toHaveBeenCalledWith(
        params.id,
        params.data
      );
    });

    it('passes correct parameters to createTimeLog API', async () => {
      vi.mocked(timeLogsApi.createTimeLog).mockResolvedValue({} as any);

      const { result } = renderHook(() => useUpdateDailyReport(), {
        wrapper: createWrapper(),
      });

      const createData = {
        dailyAttendanceId: 'attendance-123',
        taskId: 'task-456',
        duration: 360,
        location: 'home' as const,
        description: 'Test task',
      };

      await result.current.createTimeLog.mutateAsync(createData);

      const firstCall = vi.mocked(timeLogsApi.createTimeLog).mock.calls[0];
      expect(firstCall[0]).toEqual(createData);
    });

    it('passes correct parameters to updateTimeLog API', async () => {
      vi.mocked(timeLogsApi.updateTimeLog).mockResolvedValue({} as any);

      const { result } = renderHook(() => useUpdateDailyReport(), {
        wrapper: createWrapper(),
      });

      const params = {
        id: 'timelog-789',
        data: { duration: 120, location: 'client' as const },
      };

      await result.current.updateTimeLog.mutateAsync(params);

      expect(timeLogsApi.updateTimeLog).toHaveBeenCalledWith(
        params.id,
        params.data
      );
    });

    it('passes correct parameter to deleteTimeLog API', async () => {
      vi.mocked(timeLogsApi.deleteTimeLog).mockResolvedValue({} as any);

      const { result } = renderHook(() => useUpdateDailyReport(), {
        wrapper: createWrapper(),
      });

      const timelogId = 'timelog-999';

      await result.current.deleteTimeLog.mutateAsync(timelogId);

      const firstCall = vi.mocked(timeLogsApi.deleteTimeLog).mock.calls[0];
      expect(firstCall[0]).toBe(timelogId);
    });
  });
});
