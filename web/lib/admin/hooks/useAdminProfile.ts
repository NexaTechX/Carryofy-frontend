import { useQuery } from '@tanstack/react-query';
import { fetchAdminProfile } from '../api';

export const adminProfileKeys = {
  all: ['admin-profile'] as const,
};

export function useAdminProfile() {
  return useQuery({
    queryKey: adminProfileKeys.all,
    queryFn: fetchAdminProfile,
    staleTime: 5 * 60 * 1000,
  });
}


