import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';

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
  private initPromise: Promise<void>;

  constructor() {
    const primaryURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const fallbackURL = 'http://localhost:10000/api';

    this.client = axios.create({
      baseURL: primaryURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Store init promise for lazy await pattern
    this.initPromise = this.initializeBaseURL(primaryURL, fallbackURL);

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
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
        timeout: 2000, // 2 second timeout
      });
      await testClient.get('/health');
      // Primary URL works, keep it (already set in client)
    } catch (error) {
      // Primary URL failed, try fallback
      try {
        const testClient = axios.create({
          baseURL: getBaseUrl(fallbackURL),
          timeout: 2000,
        });
        await testClient.get('/health');
        // Fallback works, update client baseURL
        this.client.defaults.baseURL = fallbackURL;
        console.log(`API client: Primary URL (${primaryURL}) unavailable, using fallback (${fallbackURL})`);
      } catch (fallbackError) {
        // Both failed, keep primary and let requests fail naturally
        console.warn(`API client: Both primary (${primaryURL}) and fallback (${fallbackURL}) URLs are unavailable`);
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

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiSuccessResponse<T>> {
    await this.initPromise;
    const response = await this.client.delete<ApiSuccessResponse<T>>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();

