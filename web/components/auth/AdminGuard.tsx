import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth';
import type { User, UserRole } from '../../lib/auth';
import { fetchAdminProfile } from '../../lib/admin/api';
import { LoadingState } from '../admin/ui';
import NotFound from '../common/NotFound';

type GuardState = 'idle' | 'checking' | 'authorized' | 'notFound';

const ADMIN_PATH_REGEX = /^\/admin(\/.*)?$/;

interface AdminGuardProps {
  children: ReactNode;
}

function shouldProtect(pathname: string) {
  return ADMIN_PATH_REGEX.test(pathname);
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, setUser } = useAuth();
  const [state, setState] = useState<GuardState>('idle');

  const pathname = useMemo(() => router.pathname ?? '', [router.pathname]);

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      if (!shouldProtect(pathname)) {
        setState('authorized');
        return;
      }

      // Wait for auth to initialize
      if (isLoading) {
        setState('checking');
        return;
      }

      // Check if user is authenticated
      if (!isAuthenticated) {
        // Show 404 instead of redirecting to login
        if (!cancelled) {
          setState('notFound');
        }
        return;
      }

      // Check if current user is already an admin
      if (user?.role?.toUpperCase() === 'ADMIN') {
        if (!cancelled) {
          setState('authorized');
        }
        return;
      }

      // Fetch admin profile to verify role
      setState('checking');
      try {
        const profile = await fetchAdminProfile();
        if (cancelled) return;

        // Update user in context
        // Validate and cast role to UserRole type
        const validRoles: UserRole[] = ['BUYER', 'SELLER', 'ADMIN', 'RIDER'];
        const role = (validRoles.includes(profile.role?.toUpperCase() as UserRole)
          ? profile.role.toUpperCase()
          : 'BUYER') as UserRole;

        const normalizedUser: User = {
          id: profile.id,
          name: profile.name ?? '',
          email: profile.email ?? '',
          role: role,
          phone: profile.phone,
          verified: profile.verified ?? true,
        };

        setUser(normalizedUser);

        if (profile.role?.toUpperCase() === 'ADMIN') {
          setState('authorized');
        } else {
          // If user is not admin, show 404 instead of redirecting
          if (!cancelled) {
            setState('notFound');
          }
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to validate admin access', error);
        // Show 404 on error instead of redirecting
        if (!cancelled) {
          setState('notFound');
        }
      }
    }

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [pathname, router, user, isLoading, isAuthenticated, setUser]);

  if (state === 'authorized' || !shouldProtect(pathname)) {
    return <>{children}</>;
  }

  if (state === 'checking' || isLoading) {
    return <LoadingState fullscreen />;
  }

  if (state === 'notFound') {
    return <NotFound />;
  }

  return null;
}
