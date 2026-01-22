import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { isTokenExpired } from './jwt';

// Helper to check if we're in development mode (type-safe)
const isDev = (): boolean => {
  return (import.meta as { env?: { DEV?: boolean } }).env?.DEV ?? false;
};

/**
 * API Client configuration constants
 */
const API_CONFIG = {
  /** Health check timeout in milliseconds */
  HEALTH_CHECK_TIMEOUT_MS: 2000,
} as const;

/**
 * Validation error detail structure
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  code?: string;
}

export type ValidationErrorDetails = ValidationErrorDetail[] | Record<string, string[]>;

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    target?: string;
    details?: ValidationErrorDetails;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private initPromise: Promise<void>;

  constructor() {
    // Ensure baseURL always ends with /api
    const ensureApiSuffix = (url: string): string => {
      if (!url.endsWith('/api')) {
        return url.endsWith('/') ? `${url}api` : `${url}/api`;
      }
      return url;
    };

    const envURL = import.meta.env.VITE_API_URL;

    // Default to 3000 (Primary), Fallback to 10000
    // User logic: "make sure the default port is indeed 3000 else, go to 10000"
    const defaultURL = 'http://localhost:3000/api';
    const primaryURL = envURL ? ensureApiSuffix(envURL) : defaultURL;
    const fallbackURL = 'http://localhost:10000/api';

    this.baseURL = primaryURL;

    this.client = axios.create({
      baseURL: primaryURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Log the baseURL for debugging (development only)
    if (isDev()) {
      console.log('ApiClient initialized with baseURL:', this.baseURL);
    }

    // Store init promise for lazy await pattern
    this.initPromise = this.initializeBaseURL(primaryURL, fallbackURL);

    // Add request interceptor to include auth token and ensure baseURL is correct
    this.client.interceptors.request.use(
      (config) => {
        // Always use the current baseURL to ensure it's correct
        config.baseURL = this.baseURL;
        const token = localStorage.getItem('token');

        // Validate token expiration before making request
        if (token) {
          if (isTokenExpired(token)) {
            // Token expired, clear auth data and redirect
            localStorage.removeItem('token');
            window.location.href = '/login';
            return Promise.reject(new Error('Token expired'));
          }
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log the full URL for debugging (development only)
        if (isDev() && config.url) {
          const fullURL = `${config.baseURL}${config.url}`;
          console.log('API Request:', fullURL);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiErrorResponse>) => {
        if (error.response?.status === 401) {
          // Skip auto-redirect for login and /auth/me endpoints
          const requestUrl = error.config?.url || '';
          const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/me');

          if (!isAuthEndpoint) {
            // Unauthorized on protected routes - clear token and redirect to login
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
          // For auth endpoints, let the error propagate to the component's error handler
        }
        return Promise.reject(error);
      }
    );
  }

  private async initializeBaseURL(primaryURL: string, fallbackURL: string): Promise<void> {
    // Extract base URL without /api for health check
    const getBaseUrl = (url: string) => url.replace('/api', '');

    // Test primary URL with a health check
    try {
      const testClient = axios.create({
        baseURL: getBaseUrl(primaryURL),
        timeout: API_CONFIG.HEALTH_CHECK_TIMEOUT_MS,
      });
      await testClient.get('/health');
      // Primary URL works, keep it - ensure it includes /api
      this.baseURL = primaryURL;
      this.client.defaults.baseURL = primaryURL;
      if (isDev()) {
        console.log(`API client: Using primary URL: ${this.baseURL}`);
      }
    } catch (error) {
      // Primary URL failed, try fallback
      try {
        const testClient = axios.create({
          baseURL: getBaseUrl(fallbackURL),
          timeout: API_CONFIG.HEALTH_CHECK_TIMEOUT_MS,
        });
        await testClient.get('/health');
        // Fallback works, update client baseURL
        this.baseURL = fallbackURL;
        this.client.defaults.baseURL = fallbackURL;
        if (isDev()) {
          console.log(`API client: Primary URL (${primaryURL}) unavailable, using fallback (${fallbackURL})`);
        }
      } catch (fallbackError) {
        // Both failed, keep primary and let requests fail naturally
        if (isDev()) {
          console.warn(`API client: Both primary (${primaryURL}) and fallback (${fallbackURL}) URLs are unavailable. Using primary.`);
        }
        // Ensure baseURL is still set correctly even if health check fails
        this.baseURL = primaryURL;
        this.client.defaults.baseURL = primaryURL;
      }
    }
  }

  /**
   * Wait for API client initialization to complete
   */
  async waitForReady(): Promise<void> {
    await this.initPromise;
  }

  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiSuccessResponse<T>> {
    await this.initPromise;
    const response = await this.client.get<ApiSuccessResponse<T>>(url, config);
    return response.data;
  }

  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiSuccessResponse<T>> {
    await this.initPromise;
    const response = await this.client.post<ApiSuccessResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiSuccessResponse<T>> {
    await this.initPromise;
    const response = await this.client.put<ApiSuccessResponse<T>>(url, data, config);
    return response.data;
  }

  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiSuccessResponse<T>> {
    await this.initPromise;
    const response = await this.client.patch<ApiSuccessResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiSuccessResponse<T>> {
    await this.initPromise;
    const response = await this.client.delete<ApiSuccessResponse<T>>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
