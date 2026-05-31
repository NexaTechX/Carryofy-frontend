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

/** Max-age aligned with API auth cookie defaults — edge middleware reads this on the web origin. */
const ACCESS_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function accessCookieAttributes(maxAgeSeconds: number): string {
  const parts = ['path=/', `max-age=${maxAgeSeconds}`, 'samesite=lax'];
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    parts.push('secure');
  }
  return parts.join('; ');
}

/** Mirror access token onto the Next.js host so middleware can authorize dashboard routes. */
function syncAccessTokenCookie(accessToken: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(accessToken)}; ${accessCookieAttributes(ACCESS_COOKIE_MAX_AGE_SEC)}`;
}

function clearAccessTokenCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export const tokenManager = {
  setTokens: (accessToken: string, refreshToken: string) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        syncAccessTokenCookie(accessToken);
      } catch (error) {
        if (isStorageUnavailableError(error)) {
          console.warn('Storage unavailable: could not persist auth tokens.');
          syncAccessTokenCookie(accessToken);
          return;
        }
        throw error;
      }
    }
  },

  setAccessToken: (accessToken: string) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    } catch (error) {
      if (!isStorageUnavailableError(error)) {
        throw error;
      }
    }
    syncAccessTokenCookie(accessToken);
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
      clearAccessTokenCookie();
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
