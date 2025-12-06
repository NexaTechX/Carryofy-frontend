import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { toast } from 'react-hot-toast';

export interface AdminReview {
  id: string;
  productId: string;
  productTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  flagged: boolean;
  flagReason: string | null;
  moderatedBy: string | null;
  moderatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReviewDetail extends AdminReview {
  productImage: string | null;
}

export interface AdminReviewsResponse {
  reviews: AdminReview[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UseAdminReviewsQuery {
  page?: number;
  limit?: number;
  flaggedOnly?: boolean;
  productId?: string;
  rating?: number;
}

export function useAdminReviews(query: UseAdminReviewsQuery) {
  const params = new URLSearchParams();
  if (query.page !== undefined && query.page !== null) {
    params.append('page', query.page.toString());
  }
  if (query.limit !== undefined && query.limit !== null) {
    params.append('limit', query.limit.toString());
  }
  if (query.flaggedOnly === true) {
    params.append('flaggedOnly', 'true');
  }
  if (query.productId) {
    params.append('productId', query.productId);
  }
  if (query.rating !== undefined && query.rating !== null) {
    params.append('rating', query.rating.toString());
  }

  return useQuery<AdminReviewsResponse>({
    queryKey: ['admin', 'reviews', query],
    queryFn: async () => {
      const queryString = params.toString();
      const url = `/reviews/admin/all${queryString ? `?${queryString}` : ''}`;
      const response = await apiClient.get<AdminReviewsResponse>(url);
      return response.data;
    },
  });
}

export function useAdminReviewDetail(reviewId: string | null) {
  return useQuery<AdminReviewDetail>({
    queryKey: ['admin', 'review', reviewId],
    queryFn: async () => {
      if (!reviewId) throw new Error('Review ID is required');
      const response = await apiClient.get<AdminReviewDetail>(`/reviews/admin/${reviewId}`);
      return response.data;
    },
    enabled: !!reviewId,
  });
}

export function useFlagReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, flagReason }: { reviewId: string; flagReason: string }) => {
      const response = await apiClient.put<{ message: string }>(`/reviews/admin/${reviewId}/flag`, {
        flagReason,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      toast.success('Review flagged successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to flag review';
      toast.error(message);
    },
  });
}

export function useUnflagReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await apiClient.put<{ message: string }>(`/reviews/admin/${reviewId}/unflag`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      toast.success('Review unflagged successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to unflag review';
      toast.error(message);
    },
  });
}

export function useDeleteReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await apiClient.delete<{ message: string }>(`/reviews/admin/${reviewId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      toast.success('Review deleted successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete review';
      toast.error(message);
    },
  });
}

