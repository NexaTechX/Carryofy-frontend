const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

/** HttpOnly cookie name — set by API; readable by edge middleware only. */
export const ACCESS_TOKEN_COOKIE = 'carryofy_access_token';

export const REFRESH_TOKEN_COOKIE = 'carryofy_refresh_token';

const isStorageUnavailableError = (error: unknown): boolean => {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return (
      error.name === 'QuotaExceededError' ||
      error.name === 'SecurityError' ||
      error.name === 'InvalidStateError'
    );
  }
  return false;
};

export const tokenManager = {
  setTokens: (accessToken: string, refreshToken: string) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        // HttpOnly auth cookies are set by the API (Set-Cookie on login/refresh).
      } catch (error) {
        if (isStorageUnavailableError(error)) {
          console.warn('Storage unavailable: could not persist auth tokens.');
          return;
        }
        throw error;
      }
    }
  },

  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      if (isStorageUnavailableError(error)) {
        return null;
      }
      throw error;
    }
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      if (isStorageUnavailableError(error)) {
        return null;
      }
      throw error;
    }
  },

  clearTokens: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      } catch (error) {
        if (isStorageUnavailableError(error)) {
          return;
        }
        throw error;
      }
    }
  },

  hasAccessToken: (): boolean => {
    return !!tokenManager.getAccessToken();
  },

  isAuthenticated: (): boolean => {
    return tokenManager.hasAccessToken();
  },
};
