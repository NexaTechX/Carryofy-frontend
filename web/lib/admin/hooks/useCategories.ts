import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { toast } from 'react-hot-toast';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  displayOrder: number;
  commissionB2C: number;
  commissionB2B: number | null;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface CreateCategoryPayload {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  displayOrder?: number;
  commissionB2C?: number;
  commissionB2B?: number | null;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
  displayOrder?: number;
  commissionB2C?: number;
  commissionB2B?: number | null;
}

export interface ReorderCategoryPayload {
  categories: Array<{ id: string; displayOrder: number }>;
}

export function useAdminCategories(includeInactive: boolean = true) {
  return useQuery<CategoriesResponse>({
    queryKey: ['admin', 'categories', includeInactive],
    queryFn: async () => {
      const response = await apiClient.get<CategoriesResponse>(
        `/categories/admin/all?includeInactive=${includeInactive}`
      );
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

export function useCategory(categoryId: string | null) {
  return useQuery<Category>({
    queryKey: ['admin', 'category', categoryId],
    queryFn: async () => {
      if (!categoryId) throw new Error('Category ID is required');
      const response = await apiClient.get<Category>(`/categories/admin/${categoryId}`);
      return response.data;
    },
    enabled: !!categoryId,
  });
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCategoryPayload) => {
      const response = await apiClient.post<Category>('/categories/admin', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      toast.success('Category created successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create category';
      toast.error(message);
    },
  });
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ categoryId, payload }: { categoryId: string; payload: UpdateCategoryPayload }) => {
      const response = await apiClient.put<Category>(`/categories/admin/${categoryId}`, payload);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'category', variables.categoryId] });
      toast.success('Category updated successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update category';
      toast.error(message);
    },
  });
}

export function useToggleCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await apiClient.put<Category>(`/categories/admin/${categoryId}/toggle-active`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      toast.success('Category status updated');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update category status';
      toast.error(message);
    },
  });
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await apiClient.delete<{ message: string }>(`/categories/admin/${categoryId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete category';
      toast.error(message);
    },
  });
}

export function useReorderCategoriesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ReorderCategoryPayload) => {
      const response = await apiClient.put<{ message: string }>('/categories/admin/reorder', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      toast.success('Categories reordered successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to reorder categories';
      toast.error(message);
    },
  });
}

