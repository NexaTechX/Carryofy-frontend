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
        // Try to get CSRF token from cookie or meta tag
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

// Response interceptor to extract CSRF token from headers
apiClient.interceptors.response.use(
  (response) => {
    // Extract CSRF token from response header and store it
    const csrfToken = response.headers['x-csrf-token'];
    if (csrfToken && typeof document !== 'undefined') {
      // Store in meta tag for future requests
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
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Extract CSRF token from response header and store it
    const csrfToken = response.headers['x-csrf-token'];
    if (csrfToken && typeof document !== 'undefined') {
      // Store in meta tag for future requests
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

    // Skip noisy logging for 401 on auth/me and cart (session expired; interceptor will clear and redirect)
    const isAuthOrCart401 =
      error.response?.status === 401 &&
      (originalRequest?.url?.includes('/auth/me') || originalRequest?.url === '/cart');
    if (error.response && !isAuthOrCart401) {
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: originalRequest?.url,
        method: originalRequest?.method,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.response && isAuthOrCart401) {
      // Optional: log once at debug level in development
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.info('Session expired (401 on auth/me or cart); clearing and redirecting to login.');
      }
    }
    if (!error.response && (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
      const fullURL = originalRequest ? `${API_BASE_URL}${originalRequest.url}` : 'N/A';
      console.error('Network Error Details:', {
        message: error.message,
        code: error.code,
        baseURL: API_BASE_URL,
        url: originalRequest?.url,
        fullURL,
      });
      console.error('Please ensure:');
      console.error('1. The backend server is running');
      console.error('2. The API_BASE_URL is correct (currently:', API_BASE_URL, ')');
      console.error('3. CORS is properly configured on the backend');
      console.error('4. Check your .env file has NEXT_PUBLIC_API_BASE set correctly (should be: http://localhost:3000/api/v1)');
      console.error('5. Restart your Next.js dev server after changing .env file');
      
      // Enhance error message for better debugging
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        error.message = `Network Error: Unable to connect to ${fullURL}. Please ensure the API server is running at ${API_BASE_URL}`;
      }
    }

    // Handle 429 Too Many Requests - rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const responseData = error.response.data as { message?: string } | undefined;
      const message = (responseData?.message) || 'Too many requests. Please try again later.';
      const retryMessage = retryAfter 
        ? `${message} Please wait ${retryAfter} seconds before retrying.`
        : message;
      
      // Enhance error with retry information
      error.response.data = {
        ...(responseData || {}),
        message: retryMessage,
        retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
      };
      
      console.warn('Rate limit exceeded:', {
        url: originalRequest?.url,
        retryAfter,
        message: retryMessage,
      });
    }

    // Handle 401 Unauthorized - try to refresh token (single in-flight refresh to avoid race on page load)
    const isLoginRequest = originalRequest.url?.includes('/auth/login');

    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined' && !isLoginRequest) {
      originalRequest._retry = true;

      // One refresh at a time: if another 401 already started refresh, wait for it and reuse the new token
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

      // Refresh failed (newAccessToken is null) - clear session and redirect so user can log in again
      tokenManager.clearTokens();
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
        console.error('Token refresh failed, clearing session');
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 100);
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
export { apiClient, refreshAccessTokenBeforeRedirect };
