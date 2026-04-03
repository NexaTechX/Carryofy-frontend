const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

/** Cookie mirror for edge middleware (same JWT as localStorage access token) */
export const ACCESS_TOKEN_COOKIE = 'carryofy_access_token';

function setAccessTokenCookie(accessToken: string) {
    if (typeof document === 'undefined') return;
    const maxAge = 60 * 60 * 24 * 7;
    const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(accessToken)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function clearAccessTokenCookie() {
    if (typeof document === 'undefined') return;
    document.cookie = `${ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

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
                setAccessTokenCookie(accessToken);
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
                clearAccessTokenCookie();
            } catch (error) {
                if (isStorageUnavailableError(error)) {
                    return;
                }
                throw error;
            }
        }
    },

    hasAccessToken: (): boolean => {
        if (typeof window === 'undefined') return false;
        try {
            return !!localStorage.getItem(ACCESS_TOKEN_KEY);
        } catch (error) {
            if (isStorageUnavailableError(error)) {
                return false;
            }
            throw error;
        }
    },

    isAuthenticated: (): boolean => {
        if (typeof window === 'undefined') return false;
        try {
            return !!localStorage.getItem(ACCESS_TOKEN_KEY);
        } catch (error) {
            if (isStorageUnavailableError(error)) {
                return false;
            }
            throw error;
        }
    }
};
