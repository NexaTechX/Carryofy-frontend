import { useQuery } from '@tanstack/react-query';
import { adminDashboardKeys, fetchAdminDashboard } from '../api';
import type { ReportsQueryParams } from '../types';

export function useAdminDashboard(params?: ReportsQueryParams) {
  const hasRange = !!(params?.startDate && params?.endDate);
  return useQuery({
    queryKey: hasRange ? adminDashboardKeys.range(params!) : adminDashboardKeys.all,
    queryFn: () => fetchAdminDashboard(params),
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
  });
}


