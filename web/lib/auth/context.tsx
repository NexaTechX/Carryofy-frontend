import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from './types';
import { tokenManager } from './token';
import { authService } from './service';

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
                    const currentUser = await authService.getCurrentUser();
                    setUser(currentUser);
                }
            } catch (error) {
                console.error('Failed to initialize auth:', error);
                // If token is invalid, clear it
                tokenManager.clearTokens();
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, [setUser]);

    const login = async (email: string, password: string) => {
        const response = await authService.login({ email, password });
        tokenManager.setTokens(response.accessToken, response.refreshToken);
        setUser(response.user);
    };

    const logout = () => {
        tokenManager.clearTokens();
        setUser(null);
        if (typeof window !== 'undefined') {
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

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
