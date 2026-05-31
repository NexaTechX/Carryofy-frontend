import { ReactNode, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth';
import { fetchAdminProfile } from '../../lib/admin/fetchAdminProfile';
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
  const shouldVerify = isAdminRoute && !isLoading && isAuthenticated;

  const { data: profile, isLoading: profileLoading, isError } = useQuery({
    queryKey: ['admin-guard-profile', user?.id],
    queryFn: fetchAdminProfile,
    enabled: shouldVerify,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (!isAdminRoute) {
    return <>{children}</>;
  }

  if (isLoading || (shouldVerify && profileLoading)) {
    return <LoadingState fullscreen />;
  }

  if (!isAuthenticated || isError || profile?.role?.toUpperCase() !== 'ADMIN') {
    return <NotFound />;
  }

  return <>{children}</>;
}
