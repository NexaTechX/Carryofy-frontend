import { ReactNode, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth';
import { LoadingState } from '../admin/ui/LoadingState';
import NotFound from '../common/NotFound';

const ADMIN_PATH_REGEX = /^\/admin(\/.*)?$/;

interface AdminGuardProps {
  children: ReactNode;
}

function shouldProtect(pathname: string) {
  return ADMIN_PATH_REGEX.test(pathname);
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  const pathname = useMemo(() => router.pathname ?? '', [router.pathname]);
  const isAdminRoute = useMemo(() => shouldProtect(pathname), [pathname]);

  if (!isAdminRoute) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <LoadingState fullscreen />;
  }

  if (!isAuthenticated || user?.role?.toUpperCase() !== 'ADMIN') {
    return <NotFound />;
  }

  return <>{children}</>;
}
