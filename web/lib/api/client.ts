import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenManager } from '../auth/token';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com/api/v1';

// Log API URL in development for debugging (only on client-side)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔗 API Base URL:', API_BASE_URL);
  console.log('📝 Environment variable NEXT_PUBLIC_API_BASE:', process.env.NEXT_PUBLIC_API_BASE || 'NOT SET (using default)');
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for CORS if needed
  timeout: 30000, // 30 second timeout (increased from 10s to handle slow queries)
});

// Single in-flight refresh promise so multiple 401s don't trigger concurrent refresh (which can invalidate refresh token)
let refreshPromise: Promise<string | null> | null = null;

function doRefresh(): Promise<string | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) return Promise.resolve(null);
  return axios
    .post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken })
    .then((response) => {
      const responseData = response.data;
      const accessToken = responseData?.data?.accessToken || responseData?.accessToken;
      if (accessToken) {
        tokenManager.setTokens(accessToken, refreshToken);
        return accessToken;
      }
      return null;
    })
    .catch(() => null);
}

/** Refresh access token and return the new token (or null if refresh failed). Used by non-axios calls (e.g. fetch) on 401. */
export async function refreshAccessTokenAndGet(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = doRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

/** Call after a successful save (e.g. onboarding) before redirecting, so the next page has a fresh token and doesn't trigger 401 → logout. */
export async function refreshAccessTokenBeforeRedirect(): Promise<void> {
  if (refreshPromise) {
    await refreshPromise;
    return;
  }
  refreshPromise = doRefresh().finally(() => {
    refreshPromise = null;
  });
  await refreshPromise;
}

// Request interceptor to add Access Token and CSRF Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Only add token on client-side
    if (typeof window !== 'undefined') {
      const token = tokenManager.getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add CSRF token for state-changing operations
      const method = config.method?.toUpperCase();
      if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        const csrfToken = getCsrfToken();
        if (csrfToken && config.headers) {
          config.headers['X-CSRF-Token'] = csrfToken;
        }
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Helper function to get CSRF token
function getCsrfToken(): string | null {
  if (typeof window === 'undefined') return null;

  // Try to get from meta tag (set by server-side rendering)
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    return metaTag.getAttribute('content');
  }

  // Try to get from cookie (if accessible)
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf-token') {
      return decodeURIComponent(value);
    }
  }

  return null;
}

// Response interceptor to handle CSRF, errors, and token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Extract CSRF token from response header and store it
    const csrfToken = response.headers['x-csrf-token'];
    if (csrfToken && typeof document !== 'undefined') {
      let metaTag = document.querySelector('meta[name="csrf-token"]');
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', 'csrf-token');
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', csrfToken);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error')) {
      console.error('Network Error:', originalRequest?.url);
    }

    // Handle 401 Unauthorized - try to refresh token
    const isLoginRequest = originalRequest?.url?.includes('/auth/login');
    const isRefreshRequest = originalRequest?.url?.includes('/auth/refresh-token');

    if (error.response?.status === 401 && !originalRequest?._retry && typeof window !== 'undefined' && !isLoginRequest && !isRefreshRequest) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => {
          refreshPromise = null;
        });
      }

      const newAccessToken = await refreshPromise;

      if (newAccessToken && originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      }

      // Refresh failed
      tokenManager.clearTokens();
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
        setTimeout(() => {
          window.location.href = '/auth/login?expired=true';
        }, 100);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
export { apiClient };
