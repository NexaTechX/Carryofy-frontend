import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { firebaseAuth } from '../auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'https://carryofyapi.vercel.app/api/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for CORS
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add Firebase ID token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Only add token on client-side
    if (typeof window === 'undefined') {
      return config;
    }
    
    try {
      // Get Firebase ID token
      const token = await firebaseAuth.getIdToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // Silently fail if Firebase is not initialized (e.g., during SSR)
      if (error instanceof Error && error.message.includes('Firebase Auth is not initialized')) {
        // This is expected during SSR, just continue without token
      } else {
        console.error('Failed to get Firebase token:', error);
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - try to refresh Firebase token (client-side only)
    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      originalRequest._retry = true;

      try {
        // Force refresh Firebase ID token
        const token = await firebaseAuth.getIdToken(true);
        if (token && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, sign out and redirect to login
        console.error('Token refresh failed:', refreshError);
        try {
          await firebaseAuth.logout();
        } catch (logoutError) {
          // Ignore logout errors
        }
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
export { apiClient };
