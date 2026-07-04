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
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${accessToken}; ${accessCookieAttributes(ACCESS_COOKIE_MAX_AGE_SEC)}`;
}

/** Set access-token cookie on the web origin via API route (reliable for edge middleware). */
async function persistSessionCookie(accessToken: string): Promise<void> {
  if (!accessToken.includes('.')) {
    throw new Error('Invalid access token');
  }

  syncAccessTokenCookie(accessToken);

  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken }),
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      detail ? `Failed to persist session cookie: ${detail}` : 'Failed to persist session cookie',
    );
  }
}

async function clearSessionCookie(): Promise<void> {
  clearAccessTokenCookie();
  try {
    await fetch('/api/auth/session', { method: 'DELETE', credentials: 'same-origin' });
  } catch {
    /* ignore */
  }
}

function clearAccessTokenCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

/** Decode the `exp` claim (ms since epoch) from a JWT without verifying it. */
export function decodeJwtExpiryMs(token: string | null): number | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
    const payload = JSON.parse(atob(b64 + pad)) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export const tokenManager = {
  setTokens: async (accessToken: string, refreshToken: string): Promise<void> => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      } catch (error) {
        if (isStorageUnavailableError(error)) {
          console.warn('Storage unavailable: could not persist auth tokens.');
        } else {
          throw error;
        }
      }
      await persistSessionCookie(accessToken);
    }
  },

  setAccessToken: async (accessToken: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    } catch (error) {
      if (!isStorageUnavailableError(error)) {
        throw error;
      }
    }
    await persistSessionCookie(accessToken);
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

  clearTokens: async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      await clearSessionCookie();
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

  /** Expiry of the stored access token in ms since epoch, or null if absent/undecodable. */
  getAccessTokenExpiryMs: (): number | null => {
    return decodeJwtExpiryMs(tokenManager.getAccessToken());
  },

  isAuthenticated: (): boolean => {
    return tokenManager.hasAccessToken();
  },
};
