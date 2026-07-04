import { useQuery } from '@tanstack/react-query';
import { fetchOperationalIssues, operationalIssuesKeys } from '../api';
import type { OperationalIssuesResponse } from '../types';

export function useOperationalIssues() {
  return useQuery<OperationalIssuesResponse>({
    queryKey: operationalIssuesKeys.all,
    queryFn: fetchOperationalIssues,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    retry: 1,
  });
}
