import type { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import { queryClient } from './query-client';
import { API_URL } from './env';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      withCredentials: true,
      timeout: 10000, // 10 second timeout
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Don't attempt to refresh for auth endpoints, public endpoints, or if it's already a retry
        const isPublicEndpoint = originalRequest.url?.includes('/products') && 
                                !originalRequest.url?.includes('/admin') &&
                                !originalRequest.url?.includes('/toggle-featured');
        
        if (error.response?.status === 401 && 
            !originalRequest._retry && 
            !originalRequest.url?.includes('/auth/') &&
            originalRequest.url !== '/auth/profile' &&
            !isPublicEndpoint) {
          
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.refreshSubscribers.push((token: string) => {
                if (token) {
                  resolve(this.client(originalRequest));
                } else {
                  reject(error);
                }
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            await this.refreshToken();
            this.onRefreshSuccess();
            return this.client(originalRequest);
          } catch {
            this.onRefreshFailure();
            queryClient.setQueryData(['user'], null);
            // Only redirect to login for protected routes, not for initial auth checks
            if (!window.location.pathname.includes('/login') && 
                !window.location.pathname.includes('/signup')) {
              window.location.href = '/login';
            }
            return Promise.reject(error);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      },
    );
  }

  private async refreshToken() {
    return this.client.post('/auth/refresh-token', null, { timeout: 5000 });
  }

  private onRefreshSuccess() {
    this.refreshSubscribers.forEach(callback => callback('success'));
    this.refreshSubscribers = [];
  }

  private onRefreshFailure() {
    this.refreshSubscribers.forEach(callback => callback(''));
    this.refreshSubscribers = [];
  }

  get<T>(url: string, config?: AxiosRequestConfig) {
    return this.client.get<T>(url, config);
  }

  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.client.post<T>(url, data, config);
  }

  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.client.put<T>(url, data, config);
  }

  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.client.patch<T>(url, data, config);
  }

  delete<T>(url: string, config?: AxiosRequestConfig) {
    return this.client.delete<T>(url, config);
  }
}

export const apiClient = new ApiClient();