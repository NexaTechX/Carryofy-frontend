import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/context';
import { fetchAdminProfile } from '../api';

export const adminProfileKeys = {
  all: ['admin-profile'] as const,
  detail: (userId?: string) => ['admin-profile', userId] as const,
};

export function useAdminProfile() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: adminProfileKeys.detail(user?.id),
    queryFn: fetchAdminProfile,
    enabled: isAuthenticated && !authLoading && user?.role?.toUpperCase() === 'ADMIN',
    staleTime: 5 * 60 * 1000,
  });
}
