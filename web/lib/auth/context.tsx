import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from './types';
import { tokenManager } from './token';
import { authService } from './service';
import { refreshAccessTokenAndGet } from '../api/client';

/** Renew the access token this long before it expires. */
const REFRESH_LEAD_MS = 2 * 60 * 1000;
/** Minimum delay between scheduled refreshes (guards against tight loops on short/clock-skewed tokens). */
const MIN_REFRESH_DELAY_MS = 15 * 1000;


interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUserState] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Wrapper to sync with localStorage whenever user is updated
    const setUser = React.useCallback((newUser: User | null) => {
        setUserState(newUser);
        if (typeof window !== 'undefined') {
            if (newUser) {
                localStorage.setItem('user', JSON.stringify(newUser));
            } else {
                localStorage.removeItem('user');
            }
        }
    }, []);

    // Initialize auth state on mount
    useEffect(() => {
        const initAuth = async () => {
            try {
                const accessToken = tokenManager.getAccessToken();

                if (accessToken) {
                    // Try to fetch current user
                    try {
                        const currentUser = await authService.getCurrentUser();
                        setUser(currentUser);
                    } catch (error: any) {
                        // 401: apiClient already tried refresh; if we're here, refresh failed and
                        // the interceptor will clear tokens and redirect to login. Do NOT clear here
                        // to avoid double-clearing and flicker.
                        if (error?.response?.status === 401) {
                            void tokenManager.clearTokens();
                            setUser(null);
                            return;
                        }
                        // Only log and clear on unexpected errors
                        console.error('Failed to initialize auth:', error);
                        void tokenManager.clearTokens();
                        setUser(null);
                    }
                } else {
                    // No token, check if user exists in localStorage (shouldn't happen, but clear it)
                    setUser(null);
                }
            } catch (error) {
                // Only log unexpected errors during initialization
                console.error('Failed to initialize auth:', error);
                void tokenManager.clearTokens();
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, [setUser]);

    // Silent token refresh: renew the access token shortly before it expires so
    // an actively-browsing user never hits a 401 → login redirect. Also refresh
    // on tab focus, which covers timers that never fired (laptop sleep, mobile
    // background tabs).
    useEffect(() => {
        if (typeof window === 'undefined') return;
        let timer: number | undefined;
        let cancelled = false;

        const schedule = () => {
            if (cancelled) return;
            window.clearTimeout(timer);
            const expMs = tokenManager.getAccessTokenExpiryMs();
            if (!expMs) return;
            const delay = Math.max(expMs - Date.now() - REFRESH_LEAD_MS, MIN_REFRESH_DELAY_MS);
            timer = window.setTimeout(async () => {
                const token = await refreshAccessTokenAndGet();
                // On failure, stop the loop; the axios 401 interceptor handles the
                // next API call, and a tab-focus retry below may recover it.
                if (!cancelled && token) schedule();
            }, delay);
        };

        const refreshIfStale = async () => {
            if (cancelled || document.visibilityState !== 'visible') return;
            const expMs = tokenManager.getAccessTokenExpiryMs();
            if (!expMs || expMs - Date.now() > REFRESH_LEAD_MS) return;
            const token = await refreshAccessTokenAndGet();
            if (!cancelled && token) schedule();
        };

        if (user && tokenManager.hasAccessToken()) {
            schedule();
            document.addEventListener('visibilitychange', refreshIfStale);
            window.addEventListener('focus', refreshIfStale);
        }

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
            document.removeEventListener('visibilitychange', refreshIfStale);
            window.removeEventListener('focus', refreshIfStale);
        };
    }, [user]);

    const login = async (email: string, password: string) => {
        const response = await authService.login({ email, password });
        await tokenManager.setTokens(response.accessToken, response.refreshToken);
        setUser(response.user);
    };

    const logout = () => {
        const refreshToken = tokenManager.getRefreshToken();
        void import('../api/client').then(({ default: apiClient }) =>
          apiClient
            .post('/auth/logout', refreshToken ? { refreshToken } : {}, { withCredentials: true })
            .catch(() => undefined),
        );
        void tokenManager.clearTokens();
        if (typeof window !== 'undefined') {
            localStorage.removeItem('user');
            window.location.href = '/auth/login';
        }
    };

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user && tokenManager.hasAccessToken(),
        login,
        logout,
        setUser,
    };

    return (
        <AuthContext.Provider value={value}>

            {children}
        </AuthContext.Provider>
    );
};



export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
