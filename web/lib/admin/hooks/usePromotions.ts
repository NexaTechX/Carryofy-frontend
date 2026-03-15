import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { toast } from 'react-hot-toast';

export type PromotionPlacement =
  | 'HOMEPAGE_HERO'
  | 'TOP_ANNOUNCEMENT'
  | 'HOMEPAGE_PROMO'
  | 'CATEGORY_PAGE';

export interface Promotion {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  mobileImageUrl?: string | null;
  redirectUrl?: string | null;
  placement: PromotionPlacement;
  categorySlug?: string | null;
  priority: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  campaignId?: string | null;
  campaignName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionsListResponse {
  promotions: Promotion[];
}

export interface CampaignsListResponse {
  campaigns: Campaign[];
}

function normalize<T>(response: unknown): T {
  const obj = response as Record<string, unknown>;
  if (obj?.data != null && typeof obj.data === 'object') {
    return obj.data as T;
  }
  return response as T;
}

export function useAdminPromotions(placement?: PromotionPlacement) {
  return useQuery<PromotionsListResponse>({
    queryKey: ['admin', 'promotions', placement ?? 'all'],
    queryFn: async () => {
      const url = placement
        ? `/admin/promotions?placement=${placement}`
        : '/admin/promotions';
      const response = await apiClient.get(url);
      return normalize<PromotionsListResponse>(response.data);
    },
  });
}

export function useAdminPromotion(id: string | null) {
  return useQuery<Promotion>({
    queryKey: ['admin', 'promotion', id],
    queryFn: async () => {
      if (!id) throw new Error('Promotion ID required');
      const response = await apiClient.get(`/admin/promotions/${id}`);
      return normalize<Promotion>(response.data);
    },
    enabled: !!id,
  });
}

export interface CreatePromotionPayload {
  title: string;
  description?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  redirectUrl?: string;
  placement: PromotionPlacement;
  categorySlug?: string;
  priority?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  campaignId?: string;
}

export interface UpdatePromotionPayload {
  title?: string;
  description?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  redirectUrl?: string;
  placement?: PromotionPlacement;
  categorySlug?: string;
  priority?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  campaignId?: string;
}

export function useCreatePromotionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePromotionPayload) => {
      const response = await apiClient.post<Promotion>('/admin/promotions', payload);
      return normalize<Promotion>(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
      toast.success('Promotion created successfully');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Failed to create promotion';
      toast.error(msg);
    },
  });
}

export function useUpdatePromotionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: { id: string; payload: UpdatePromotionPayload }) => {
      const response = await apiClient.patch<Promotion>(`/admin/promotions/${id}`, payload);
      return normalize<Promotion>(response.data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'promotion', variables.id] });
      toast.success('Promotion updated successfully');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Failed to update promotion';
      toast.error(msg);
    },
  });
}

export function useDeletePromotionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<{ message: string }>(`/admin/promotions/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
      toast.success('Promotion deleted successfully');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Failed to delete promotion';
      toast.error(msg);
    },
  });
}

export function useUploadPromotionImageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<{ url: string }> => {
      const formData = new FormData();
      formData.append('image', file);
      const response = await apiClient.post<{ url: string }>(
        '/admin/promotions/upload-image',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      return normalize<{ url: string }>(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Image upload failed';
      toast.error(msg);
    },
  });
}

// Campaigns
export function useAdminCampaigns() {
  return useQuery<CampaignsListResponse>({
    queryKey: ['admin', 'campaigns'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/campaigns');
      return normalize<CampaignsListResponse>(response.data);
    },
  });
}

export interface CreateCampaignPayload {
  name: string;
  slug: string;
  description?: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface UpdateCampaignPayload {
  name?: string;
  slug?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export function useCreateCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCampaignPayload) => {
      const response = await apiClient.post<Campaign>('/admin/campaigns', payload);
      return normalize<Campaign>(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
      toast.success('Campaign created successfully');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Failed to create campaign';
      toast.error(msg);
    },
  });
}

export function useUpdateCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateCampaignPayload }) => {
      const response = await apiClient.patch<Campaign>(`/admin/campaigns/${id}`, payload);
      return normalize<Campaign>(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
      toast.success('Campaign updated successfully');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Failed to update campaign';
      toast.error(msg);
    },
  });
}

export function useDeleteCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<{ message: string }>(`/admin/campaigns/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
      toast.success('Campaign deleted successfully');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Failed to delete campaign';
      toast.error(msg);
    },
  });
}
