import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateDailyReport } from './useCreateDailyReport';
import * as attendanceApi from '../services/attendanceApi';
import { notifications } from '@mantine/notifications';
import { CreateCombinedAttendanceRequest } from '../types';

// Mock the API module
vi.mock('../services/attendanceApi');

// Mock Mantine notifications
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockRequestData: CreateCombinedAttendanceRequest = {
  userId: 'user-1',
  date: '2026-01-21',
  startTime: '09:00',
  endTime: '17:00',
  status: 'work',
  timeLogs: [
    {
      taskId: 'task-1',
      duration: 480,
      location: 'office',
      description: 'Development work',
    },
  ],
};

const mockResponseData = {
  success: true as const,
  data: {
    attendanceId: 'attendance-1',
    timeLogIds: ['timelog-1'],
  },
};

describe('useCreateDailyReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates daily report successfully', async () => {
    vi.mocked(attendanceApi.createCombinedAttendance).mockResolvedValue(mockResponseData);

    const { result } = renderHook(() => useCreateDailyReport(), {
      wrapper: createWrapper(),
    });

    // Initially not loading
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);

    // Trigger mutation
    result.current.mutate(mockRequestData);

    // Wait for mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    
    // Check first argument of first call
    expect(attendanceApi.createCombinedAttendance).toHaveBeenCalledTimes(1);
    const firstCall = vi.mocked(attendanceApi.createCombinedAttendance).mock.calls[0];
    expect(firstCall[0]).toEqual(mockRequestData);
  });

  it('shows success toast on successful creation', async () => {
    vi.mocked(attendanceApi.createCombinedAttendance).mockResolvedValue(mockResponseData);

    const { result } = renderHook(() => useCreateDailyReport(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(mockRequestData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(notifications.show).toHaveBeenCalledWith({
      title: 'הצלחה',
      message: 'דיווח שעות הושלם',
      color: 'green',
      autoClose: 3000,
    });
  });

  it('handles API error', async () => {
    const errorMessage = 'Failed to create attendance';
    vi.mocked(attendanceApi.createCombinedAttendance).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useCreateDailyReport(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(mockRequestData);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error?.message).toBe(errorMessage);
  });

  it('shows error toast on failure', async () => {
    const errorMessage = 'Failed to create attendance';
    vi.mocked(attendanceApi.createCombinedAttendance).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useCreateDailyReport(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(mockRequestData);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(notifications.show).toHaveBeenCalledWith({
      title: 'שגיאה',
      message: errorMessage,
      color: 'red',
      autoClose: 5000,
    });
  });

  it('shows default error message when error has no message', async () => {
    vi.mocked(attendanceApi.createCombinedAttendance).mockRejectedValue(new Error());

    const { result } = renderHook(() => useCreateDailyReport(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(mockRequestData);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(notifications.show).toHaveBeenCalledWith({
      title: 'שגיאה',
      message: 'שגיאה ביצירת דיווח',
      color: 'red',
      autoClose: 5000,
    });
  });

  it('invalidates month history query on success', async () => {
    vi.mocked(attendanceApi.createCombinedAttendance).mockResolvedValue(mockResponseData);

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

    const { result } = renderHook(() => useCreateDailyReport(), { wrapper });

    result.current.mutate(mockRequestData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['monthHistory'],
    });
  });

  it('returns mutateAsync function that returns promise', async () => {
    vi.mocked(attendanceApi.createCombinedAttendance).mockResolvedValue(mockResponseData);

    const { result } = renderHook(() => useCreateDailyReport(), {
      wrapper: createWrapper(),
    });

    const promise = result.current.mutateAsync(mockRequestData);

    expect(promise).toBeInstanceOf(Promise);

    const response = await promise;
    expect(response).toEqual(mockResponseData);
  });

  it('provides reset function', async () => {
    vi.mocked(attendanceApi.createCombinedAttendance).mockResolvedValue(mockResponseData);

    const { result } = renderHook(() => useCreateDailyReport(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(mockRequestData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Reset mutation state
    result.current.reset();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
    });
  });

  it('handles multiple mutations correctly', async () => {
    vi.mocked(attendanceApi.createCombinedAttendance).mockResolvedValue(mockResponseData);

    const { result } = renderHook(() => useCreateDailyReport(), {
      wrapper: createWrapper(),
    });

    // First mutation
    result.current.mutate(mockRequestData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(attendanceApi.createCombinedAttendance).toHaveBeenCalledTimes(1);

    // Second mutation with different data
    const secondRequestData = {
      ...mockRequestData,
      date: '2026-01-22',
    };

    result.current.mutate(secondRequestData);

    await waitFor(() => {
      expect(attendanceApi.createCombinedAttendance).toHaveBeenCalledTimes(2);
    });

    // Check second call used the updated data
    const secondCall = vi.mocked(attendanceApi.createCombinedAttendance).mock.calls[1];
    expect(secondCall[0]).toEqual(secondRequestData);
  });

  it('exposes all required return values', () => {
    const { result } = renderHook(() => useCreateDailyReport(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty('mutate');
    expect(result.current).toHaveProperty('mutateAsync');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('isError');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('isSuccess');
    expect(result.current).toHaveProperty('reset');

    expect(typeof result.current.mutate).toBe('function');
    expect(typeof result.current.mutateAsync).toBe('function');
    expect(typeof result.current.reset).toBe('function');
    expect(typeof result.current.isLoading).toBe('boolean');
    expect(typeof result.current.isError).toBe('boolean');
    expect(typeof result.current.isSuccess).toBe('boolean');
  });
});
