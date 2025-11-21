import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenManager } from '../auth/token';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'https://carryofyapi.vercel.app/api/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for CORS if needed
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Only add token on client-side
    if (typeof window !== 'undefined') {
      const token = tokenManager.getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Enhanced error logging for network errors
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      console.error('Network Error Details:', {
        message: error.message,
        code: error.code,
        baseURL: API_BASE_URL,
        url: originalRequest?.url,
        fullURL: originalRequest ? `${API_BASE_URL}${originalRequest.url}` : 'N/A',
      });
      console.error('Please ensure:');
      console.error('1. The backend server is running');
      console.error('2. The API_BASE_URL is correct (currently:', API_BASE_URL, ')');
      console.error('3. CORS is properly configured on the backend');
    }

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      originalRequest._retry = true;

      try {
        const refreshToken = tokenManager.getRefreshToken();

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call refresh endpoint directly to avoid circular dependency and interceptors
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        // Extract accessToken from wrapped response
        const responseData = response.data;
        const accessToken = responseData?.data?.accessToken || responseData?.accessToken;

        if (accessToken) {
          // Update tokens - keep the old refresh token? 
          // The API spec says response is { accessToken: string }, so we reuse the old refresh token 
          // unless the backend rotates it. Assuming we keep the old one.
          tokenManager.setTokens(accessToken, refreshToken);

          // Update header and retry original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        console.error('Token refresh failed:', refreshError);
        tokenManager.clearTokens();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
          window.location.href = '/auth/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
export { apiClient };
