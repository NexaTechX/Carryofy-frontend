import { useQuery } from '@tanstack/react-query';
import { fetchAllProducts } from '../api';
import type { PendingProduct } from '../types';

export function useAllProducts() {
  return useQuery<PendingProduct[]>({
    queryKey: ['admin', 'products', 'all'],
    queryFn: fetchAllProducts,
    staleTime: 30000, // 30 seconds
  });
}

