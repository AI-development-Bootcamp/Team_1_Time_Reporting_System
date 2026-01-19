import axios, { AxiosInstance, AxiosError } from 'axios';

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    const primaryURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const fallbackURL = 'http://localhost:10000/api';
    
    // Initialize with primary URL, will be updated if needed
    this.baseURL = primaryURL;
    
    this.client = axios.create({
      baseURL: primaryURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Test primary URL and fallback to 10000 if needed
    this.initializeBaseURL(primaryURL, fallbackURL);

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
          // #region agent log
          fetch('http://127.0.0.1:7247/ingest/63c0bca4-1606-456f-930f-3bc967d7d81a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ApiClient.ts:58','message':'401 error intercepted','data':{url:error.config?.url,isLoginEndpoint:error.config?.url?.includes('/auth/login')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          // Skip auto-redirect for login endpoint - let the login component handle the error
          const requestUrl = error.config?.url || '';
          const isLoginEndpoint = requestUrl.includes('/auth/login');
          
          if (!isLoginEndpoint) {
            // #region agent log
            fetch('http://127.0.0.1:7247/ingest/63c0bca4-1606-456f-930f-3bc967d7d81a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ApiClient.ts:65','message':'Redirecting to login (not login endpoint)','data':{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            // Unauthorized on protected routes - clear token and redirect to login
            localStorage.removeItem('token');
            window.location.href = '/login';
          } else {
            // #region agent log
            fetch('http://127.0.0.1:7247/ingest/63c0bca4-1606-456f-930f-3bc967d7d81a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ApiClient.ts:70','message':'Skipping redirect for login endpoint, propagating error','data':{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
          }
          // For login endpoint, let the error propagate to the component's error handler
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
      // Primary URL works, keep it
      this.baseURL = primaryURL;
    } catch (error) {
      // Primary URL failed, try fallback
      try {
        const testClient = axios.create({
          baseURL: getBaseUrl(fallbackURL),
          timeout: 2000,
        });
        await testClient.get('/health');
        // Fallback works, update baseURL
        this.baseURL = fallbackURL;
        this.client.defaults.baseURL = fallbackURL;
        console.log(`API client: Primary URL (${primaryURL}) unavailable, using fallback (${fallbackURL})`);
      } catch (fallbackError) {
        // Both failed, keep primary and let requests fail naturally
        console.warn(`API client: Both primary (${primaryURL}) and fallback (${fallbackURL}) URLs are unavailable`);
      }
    }
  }

  async get<T = any>(url: string, config?: any): Promise<ApiSuccessResponse<T>> {
    const response = await this.client.get<ApiSuccessResponse<T>>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<ApiSuccessResponse<T>> {
    const response = await this.client.post<ApiSuccessResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<ApiSuccessResponse<T>> {
    const response = await this.client.put<ApiSuccessResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: any): Promise<ApiSuccessResponse<T>> {
    const response = await this.client.delete<ApiSuccessResponse<T>>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
