import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  uploadBannerImage,
} from '../api';
import type { MarketingBanner, CreateBannerPayload, UpdateBannerPayload } from '../types';
import { toast } from 'react-hot-toast';

export function useAdminBanners() {
  return useQuery<MarketingBanner[]>({
    queryKey: ['admin', 'banners'],
    queryFn: fetchAdminBanners,
  });
}

export function useCreateBannerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBannerPayload) => createBanner(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners', 'public'] });
      toast.success('Banner created');
    },
    onError: (error: unknown) => {
      const msg =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(msg || 'Failed to create banner');
    },
  });
}

export function useUpdateBannerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBannerPayload }) =>
      updateBanner(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners', 'public'] });
      toast.success('Banner updated');
    },
    onError: (error: unknown) => {
      const msg =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(msg || 'Failed to update banner');
    },
  });
}

export function useDeleteBannerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners', 'public'] });
      toast.success('Banner deleted');
    },
    onError: (error: unknown) => {
      const msg =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(msg || 'Failed to delete banner');
    },
  });
}

export function useUploadBannerImageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadBannerImage(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
    },
    onError: (error: unknown) => {
      const msg =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(msg || 'Image upload failed');
    },
  });
}
