import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth';
import type { User, UserRole } from '../../lib/auth';
import { fetchAdminProfile } from '../../lib/admin/fetchAdminProfile';
import { LoadingState } from '../admin/ui/LoadingState';
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
  const adminVerifiedRef = useRef(false);

  const pathname = useMemo(() => router.pathname ?? '', [router.pathname]);
  const isAdminRoute = useMemo(() => shouldProtect(pathname), [pathname]);

  useEffect(() => {
    if (!isAdminRoute) {
      setState('authorized');
      return;
    }

    if (isLoading) {
      setState('checking');
      return;
    }

    if (!isAuthenticated) {
      adminVerifiedRef.current = false;
      setState('notFound');
      return;
    }

    // Skip re-verification when admin access was already confirmed this session.
    // setUser() must not re-trigger this effect (user is intentionally omitted from deps).
    if (adminVerifiedRef.current && user?.role?.toUpperCase() === 'ADMIN') {
      setState('authorized');
      return;
    }

    let cancelled = false;

    async function verifyAdmin() {
      setState('checking');
      try {
        const profile = await fetchAdminProfile();
        if (cancelled) return;

        const isAdmin = profile.role?.toUpperCase() === 'ADMIN';

        if (isAdmin) {
          adminVerifiedRef.current = true;

          const validRoles: UserRole[] = ['BUYER', 'SELLER', 'ADMIN', 'RIDER'];
          const role = (validRoles.includes(profile.role?.toUpperCase() as UserRole)
            ? profile.role.toUpperCase()
            : 'BUYER') as UserRole;

          const normalizedUser: User = {
            id: profile.id,
            name: profile.name ?? '',
            email: profile.email ?? '',
            role,
            phone: profile.phone,
            verified: profile.verified ?? true,
          };

          if (
            user?.id !== normalizedUser.id ||
            user?.role !== normalizedUser.role ||
            user?.email !== normalizedUser.email
          ) {
            setUser(normalizedUser);
          }

          setState('authorized');
        } else {
          adminVerifiedRef.current = false;
          setState('notFound');
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to validate admin access', error);
        adminVerifiedRef.current = false;
        setState('notFound');
      }
    }

    void verifyAdmin();

    return () => {
      cancelled = true;
    };
  }, [isAdminRoute, isLoading, isAuthenticated, pathname, setUser]);

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
