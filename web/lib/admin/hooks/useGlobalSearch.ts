import { useQuery } from '@tanstack/react-query';
import { globalSearch, GlobalSearchResult } from '../api';

export function useGlobalSearch(query: string, enabled = true) {
  return useQuery<GlobalSearchResult>({
    queryKey: ['admin', 'global-search', query],
    queryFn: () => globalSearch(query),
    enabled: enabled && query.length >= 2,
    staleTime: 30000, // 30 seconds
  });
}
