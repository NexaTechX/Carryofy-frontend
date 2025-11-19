import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { firebaseAuth, userManager, getRoleRedirect } from '../../lib/auth';
import type { User } from '../../lib/auth';
import { fetchAdminProfile } from '../../lib/admin/api';
import { LoadingState } from '../admin/ui';

type GuardState = 'idle' | 'checking' | 'authorized' | 'redirecting';

const ADMIN_PATH_REGEX = /^\/admin(\/.*)?$/;

interface AdminGuardProps {
  children: ReactNode;
}

function shouldProtect(pathname: string) {
  return ADMIN_PATH_REGEX.test(pathname);
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [state, setState] = useState<GuardState>('idle');

  const pathname = useMemo(() => router.pathname ?? '', [router.pathname]);

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      if (!shouldProtect(pathname)) {
        setState('authorized');
        return;
      }

      setState('checking');

      // Check if user is authenticated with Firebase
      const currentUser = firebaseAuth.getCurrentUser();
      if (!currentUser) {
        if (!cancelled) {
          setState('redirecting');
          const nextParam = encodeURIComponent(router.asPath ?? '/admin');
          router.replace(`/auth/login?next=${nextParam}`);
        }
        return;
      }

      const cachedUser = userManager.getUser();
      if (cachedUser?.role?.toUpperCase() === 'ADMIN') {
        if (!cancelled) {
          setState('authorized');
        }
        return;
      }

      try {
        const profile = await fetchAdminProfile();
        if (cancelled) return;

        // Normalize to the shared User shape expected by userManager
        const normalizedUser: User = {
          id: profile.id,
          firebaseUid: firebaseAuth.getCurrentUser()?.uid ?? '',
          name: profile.name ?? '',
          email: profile.email ?? '',
          role: profile.role ?? '',
          phone: profile.phone, // optional on admin profile
          verified: profile.verified ?? true,
        };

        userManager.setUser(normalizedUser);
        if (profile.role?.toUpperCase() === 'ADMIN') {
          setState('authorized');
        } else {
          const redirect = getRoleRedirect(profile.role);
          setState('redirecting');
          router.replace(redirect);
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to validate admin access', error);
        userManager.logout();
        setState('redirecting');
        const nextParam = encodeURIComponent(router.asPath ?? '/admin');
        router.replace(`/auth/login?next=${nextParam}`);
      }
    }

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (state === 'authorized' || !shouldProtect(pathname)) {
    return <>{children}</>;
  }

  if (state === 'checking') {
    return <LoadingState fullscreen />;
  }

  return null;
}


