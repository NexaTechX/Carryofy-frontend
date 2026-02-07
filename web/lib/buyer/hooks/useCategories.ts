import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  displayOrder: number;
  commissionB2C?: number;
  commissionB2B?: number | null;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
}

export interface CategoriesResponse {
  categories: Category[];
}

export function useCategories() {
  return useQuery<CategoriesResponse>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.get<CategoriesResponse>('/categories');
      // Handle TransformInterceptor wrapper
      const data = response.data as any;
      if (data?.data && 'categories' in data.data) {
        return data.data as CategoriesResponse;
      }
      if (data?.categories) {
        return data as CategoriesResponse;
      }
      return { categories: [] };
    },
  });
}

