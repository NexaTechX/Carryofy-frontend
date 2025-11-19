import { useQuery } from '@tanstack/react-query';
import { adminDashboardKeys, fetchAdminDashboard } from '../api';

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminDashboardKeys.all,
    queryFn: fetchAdminDashboard,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once on failure
    retryDelay: 1000, // Wait 1 second before retrying
  });
}


