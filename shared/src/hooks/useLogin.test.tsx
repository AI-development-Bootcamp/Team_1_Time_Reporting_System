import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLogin } from './useLogin';
import { apiClient } from '../utils/ApiClient';
import { notifications } from '@mantine/notifications';

// Mock dependencies
vi.mock('../utils/ApiClient', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}));

const mockLogin = vi.fn();

vi.mock('./useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

describe('useLogin Hook', () => {
  const mockForm = {
    setFieldError: vi.fn(),
  };
  const mockOnSuccessRedirect = vi.fn();

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client= { queryClient } > { children } </QueryClientProvider>
    );
  };

beforeEach(() => {
  vi.clearAllMocks();
});

it('should handle successful login', async () => {
  const mockResponse = {
    data: {
      token: 'fake-token',
      expiresInHours: 24,
    },
  };
  (apiClient.post as any).mockResolvedValue(mockResponse);

  const { result } = renderHook(
    () => useLogin({
      form: mockForm as any,
      onSuccessRedirect: mockOnSuccessRedirect,
    }),
    { wrapper: createWrapper() }
  );

  result.current.mutate({ mail: 'test@example.com', password: 'password' });

  await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('fake-token'));
  expect(mockOnSuccessRedirect).toHaveBeenCalled();
  expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
    mail: 'test@example.com',
    password: 'password',
  });
});

it('should handle validation errors (400)', async () => {
  const errorResponse = {
    response: {
      status: 400,
      data: {
        error: {
          details: {
            mail: ['Invalid email'],
            password: ['Password required'],
          },
        },
      },
    },
  };
  (apiClient.post as any).mockRejectedValue(errorResponse);

  const { result } = renderHook(
    () => useLogin({
      form: mockForm as any,
      onSuccessRedirect: mockOnSuccessRedirect,
    }),
    { wrapper: createWrapper() }
  );

  result.current.mutate({ mail: 'invalid', password: '' });

  await waitFor(() => expect(mockForm.setFieldError).toHaveBeenCalled());
  expect(mockForm.setFieldError).toHaveBeenCalledWith('mail', 'Invalid email');
  expect(mockForm.setFieldError).toHaveBeenCalledWith('password', 'Password required');
  expect(notifications.show).toHaveBeenCalled();
});

it('should handle unauthorized errors (401)', async () => {
  const errorResponse = {
    response: {
      status: 401,
      data: {
        error: {
          message: 'Invalid credentials',
        },
      },
    },
  };
  (apiClient.post as any).mockRejectedValue(errorResponse);

  const { result } = renderHook(
    () => useLogin({
      form: mockForm as any,
      onSuccessRedirect: mockOnSuccessRedirect,
    }),
    { wrapper: createWrapper() }
  );

  result.current.mutate({ mail: 'wrong@example.com', password: 'wrong' });

  await waitFor(() => expect(notifications.show).toHaveBeenCalled());
  expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({
    message: 'Invalid credentials',
    color: 'red',
  }));
  expect(mockForm.setFieldError).not.toHaveBeenCalled();
});

it('should handle server errors (409)', async () => {
  const errorResponse = {
    response: {
      status: 409,
      data: {
        error: {
          message: 'Already logged in',
        },
      },
    },
  };
  (apiClient.post as any).mockRejectedValue(errorResponse);

  const { result } = renderHook(
    () => useLogin({
      form: mockForm as any,
      onSuccessRedirect: mockOnSuccessRedirect,
    }),
    { wrapper: createWrapper() }
  );

  result.current.mutate({ mail: 'user@example.com', password: 'password' });

  await waitFor(() => expect(notifications.show).toHaveBeenCalled());
  expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({
    color: 'red',
  }));
});
});
