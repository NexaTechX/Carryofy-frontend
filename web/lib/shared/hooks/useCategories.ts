import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import type { CategoriesResponse } from '../../../types/category';

/**
 * Unwrap categories response from TransformInterceptor wrapper.
 * Shared between admin and buyer hooks.
 */
export function unwrapCategoriesResponse(data: unknown): CategoriesResponse {
  const d = data as Record<string, unknown>;
  if (d?.data && typeof d.data === 'object' && 'categories' in (d.data as object)) {
    return (d.data as CategoriesResponse);
  }
  if (d?.categories) {
    return d as unknown as CategoriesResponse;
  }
  return { categories: [] };
}

/**
 * Buyer read-only categories hook.
 * Fetches from /categories (public/authenticated endpoint).
 */
export function useCategories() {
  return useQuery<CategoriesResponse>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.get<CategoriesResponse>('/categories');
      return unwrapCategoriesResponse(response.data);
    },
  });
}
