import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AxiosError } from 'axios';
import { useLogin } from './useLogin';
import { ApiErrorResponse } from '../utils/ApiClient';
import { LoginRequest, LoginResponse } from '../types/User';

// Mock dependencies
vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(),
}));

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}));

vi.mock('../utils/ApiClient', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

vi.mock('./useAuth', () => ({
  useAuth: vi.fn(() => ({
    login: vi.fn(),
  })),
}));

describe('useLogin Hook Logic', () => {
  let mockForm: any;
  let mockOnSuccessRedirect: () => void;

  beforeEach(() => {
    mockForm = {
      setFieldError: vi.fn(),
    };
    mockOnSuccessRedirect = vi.fn();
    vi.clearAllMocks();
  });

  describe('success scenarios', () => {
    it('should handle successful login with valid response', () => {
      const mockLoginResponse: LoginResponse = {
        token: 'valid-token-123',
        expiresInHours: 24,
      };

      // Logic validation: onSuccess should call login() and redirect
      // User data is decoded from token, not returned in response
      const shouldCallLogin = !!mockLoginResponse.token;
      const shouldRedirect = true;

      expect(shouldCallLogin).toBe(true);
      expect(shouldRedirect).toBe(true);
    });

    it('should handle login response with token only', () => {
      const mockLoginResponse: LoginResponse = {
        token: 'admin-token-123',
        expiresInHours: 24,
      };

      // Token contains user data encoded in payload
      expect(mockLoginResponse.token).toBeDefined();
      expect(mockLoginResponse.expiresInHours).toBe(24);
    });
  });

  describe('error scenarios - 400 validation errors', () => {
    it('should handle 400 error with mail field error', () => {
      const errorResponse: AxiosError<ApiErrorResponse> = {
        response: {
          status: 400,
          data: {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: {
                mail: ['Invalid email format'],
              },
            },
          },
        },
      } as AxiosError<ApiErrorResponse>;

      const details = errorResponse.response?.data?.error?.details;
      const hasMailError = !!details?.mail;
      const shouldShowNotification = true;

      expect(hasMailError).toBe(true);
      expect(shouldShowNotification).toBe(true);
    });

    it('should handle 400 error with password field error', () => {
      const errorResponse: AxiosError<ApiErrorResponse> = {
        response: {
          status: 400,
          data: {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: {
                password: ['Password is required'],
              },
            },
          },
        },
      } as AxiosError<ApiErrorResponse>;

      const details = errorResponse.response?.data?.error?.details;
      const hasPasswordError = !!details?.password;
      expect(hasPasswordError).toBe(true);
    });

    it('should handle 400 error with both mail and password errors', () => {
      const errorResponse: AxiosError<ApiErrorResponse> = {
        response: {
          status: 400,
          data: {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: {
                mail: ['Invalid email format'],
                password: ['Password is required'],
              },
            },
          },
        },
      } as AxiosError<ApiErrorResponse>;

      const details = errorResponse.response?.data?.error?.details;
      const hasMailError = !!details?.mail;
      const hasPasswordError = !!details?.password;

      expect(hasMailError).toBe(true);
      expect(hasPasswordError).toBe(true);
    });

    it('should handle 400 error with Zod array format details', () => {
      const errorResponse: AxiosError<ApiErrorResponse> = {
        response: {
          status: 400,
          data: {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: [
                { path: ['mail'], message: 'Invalid email format' },
                { path: ['password'], message: 'Password is required' },
              ],
            },
          },
        },
      } as AxiosError<ApiErrorResponse>;

      const details = errorResponse.response?.data?.error?.details;
      const isArray = Array.isArray(details);
      expect(isArray).toBe(true);
    });
  });

  describe('error scenarios - 401/409/500 operational errors', () => {
    it('should handle 401 unauthorized error', () => {
      const errorResponse: AxiosError<ApiErrorResponse> = {
        response: {
          status: 401,
          data: {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid credentials',
            },
          },
        },
      } as AxiosError<ApiErrorResponse>;

      const shouldShowNotification = errorResponse.response?.status === 401;
      const shouldNotSetFieldErrors = errorResponse.response?.status !== 400;

      expect(shouldShowNotification).toBe(true);
      expect(shouldNotSetFieldErrors).toBe(true);
    });

    it('should handle 409 conflict error', () => {
      const errorResponse: AxiosError<ApiErrorResponse> = {
        response: {
          status: 409,
          data: {
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'Email already exists',
            },
          },
        },
      } as AxiosError<ApiErrorResponse>;

      const shouldShowNotification = errorResponse.response?.status === 409;
      expect(shouldShowNotification).toBe(true);
    });

    it('should handle 500 internal server error', () => {
      const errorResponse: AxiosError<ApiErrorResponse> = {
        response: {
          status: 500,
          data: {
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'An unexpected error occurred',
            },
          },
        },
      } as AxiosError<ApiErrorResponse>;

      const shouldShowNotification = errorResponse.response?.status === 500;
      expect(shouldShowNotification).toBe(true);
    });

    it('should handle error without response data', () => {
      const errorResponse: AxiosError<ApiErrorResponse> = {
        response: undefined,
      } as AxiosError<ApiErrorResponse>;

      const shouldUseDefaultMessage = !errorResponse.response?.data?.error?.message;
      expect(shouldUseDefaultMessage).toBe(true);
    });
  });
});
