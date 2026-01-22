import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMonthHistory } from './useMonthHistory';
import * as attendanceApi from '../services/attendanceApi';

// Mock the API module
vi.mock('../services/attendanceApi');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useMonthHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches month history data successfully', async () => {
    const mockAttendances = [
      {
        id: '1',
        userId: 'user-1',
        date: '2025-01-20',
        status: 'work',
        startTime: '09:00',
        endTime: '18:00',
        projectTimeLogs: [],
      },
    ];

    vi.mocked(attendanceApi.getMonthHistory).mockResolvedValue(mockAttendances as any);

    const { result } = renderHook(
      () => useMonthHistory({ month: 1, year: 2025, userId: 'user-1' }),
      { wrapper: createWrapper() }
    );

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check the data
    expect(result.current.attendances).toEqual(mockAttendances);
    expect(result.current.isError).toBe(false);
  });

  it('handles API error', async () => {
    vi.mocked(attendanceApi.getMonthHistory).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(
      () => useMonthHistory({ month: 1, year: 2025, userId: 'user-1' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.attendances).toEqual([]);
  });

  it('does not fetch when disabled', async () => {
    vi.mocked(attendanceApi.getMonthHistory).mockResolvedValue([]);

    const { result } = renderHook(
      () => useMonthHistory({ month: 1, year: 2025, userId: 'user-1', enabled: false }),
      { wrapper: createWrapper() }
    );

    // Should not be loading when disabled
    expect(result.current.isLoading).toBe(false);
    expect(attendanceApi.getMonthHistory).not.toHaveBeenCalled();
  });

  it('passes correct parameters to API', async () => {
    vi.mocked(attendanceApi.getMonthHistory).mockResolvedValue([]);

    renderHook(
      () => useMonthHistory({ month: 3, year: 2025, userId: 'test-user' }),
      { wrapper: createWrapper() }
    );

    // Note: userId is obtained from auth token on the backend, not passed via API
    await waitFor(() => {
      expect(attendanceApi.getMonthHistory).toHaveBeenCalledWith({
        month: 3,
      });
    });
  });
});
