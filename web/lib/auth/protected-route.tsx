import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from './context';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireVerified?: boolean;
    roles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requireVerified = false,
    roles,
}) => {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            // Redirect to login if not authenticated
            if (!isAuthenticated) {
                router.push('/auth/login');
                return;
            }

            // Check email verification requirement
            if (requireVerified && !user?.verified) {
                router.push('/auth/verify');
                return;
            }

            // Check role requirements
            if (roles && roles.length > 0 && user && !roles.includes(user.role)) {
                // Redirect to appropriate dashboard based on role
                router.push(getRoleRedirect(user.role));
                return;
            }
        }
    }, [isLoading, isAuthenticated, user, requireVerified, roles, router]);

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render children until authenticated
    if (!isAuthenticated) {
        return null;
    }

    // Check verification
    if (requireVerified && !user?.verified) {
        return null;
    }

    // Check roles
    if (roles && roles.length > 0 && user && !roles.includes(user.role)) {
        return null;
    }

    return <>{children}</>;
};

// Helper function to redirect based on role
const getRoleRedirect = (role: string): string => {
    switch (role.toUpperCase()) {
        case 'SELLER':
            return '/seller';
        case 'BUYER':
            return '/buyer';
        case 'ADMIN':
            return '/admin';
        case 'RIDER':
            return '/rider';
        default:
            return '/';
    }
};
