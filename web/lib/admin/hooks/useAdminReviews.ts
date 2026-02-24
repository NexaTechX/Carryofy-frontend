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
  /** true = flagged only, false = unflagged only, undefined = all */
  flaggedOnly?: boolean;
  productId?: string;
  rating?: number;
  /** Filter by seller (product's sellerId); backend may support later */
  sellerId?: string;
  /** Search by reviewer name or product title; backend may support later, else client filter */
  search?: string;
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
  if (query.flaggedOnly === false) {
    params.append('flaggedOnly', 'false');
  }
  if (query.productId) {
    params.append('productId', query.productId);
  }
  if (query.rating !== undefined && query.rating !== null) {
    params.append('rating', query.rating.toString());
  }
  if (query.sellerId) {
    params.append('sellerId', query.sellerId);
  }
  if (query.search && query.search.trim()) {
    params.append('search', query.search.trim());
  }

  return useQuery<AdminReviewsResponse>({
    queryKey: ['admin', 'reviews', query],
    queryFn: async () => {
      const queryString = params.toString();
      const url = `/reviews/admin/all${queryString ? `?${queryString}` : ''}`;
      const response = await apiClient.get<{ data?: AdminReviewsResponse } & AdminReviewsResponse>(url);
      const res = response.data;
      return (res?.data ?? res) as AdminReviewsResponse;
    },
    refetchInterval: 30_000, // near-real-time
  });
}

/** Returns total count of flagged reviews for stats. */
export function useAdminReviewFlaggedCount() {
  return useQuery<{ total: number }>({
    queryKey: ['admin', 'reviews', 'flagged-count'],
    queryFn: async () => {
      const response = await apiClient.get<{ data?: AdminReviewsResponse } & AdminReviewsResponse>(
        '/reviews/admin/all?page=1&limit=1&flaggedOnly=true'
      );
      const res = response.data;
      const data = (res?.data ?? res) as AdminReviewsResponse;
      return { total: data?.pagination?.total ?? 0 };
    },
  });
}

export function useAdminReviewDetail(reviewId: string | null) {
  return useQuery<AdminReviewDetail>({
    queryKey: ['admin', 'review', reviewId],
    queryFn: async () => {
      if (!reviewId) throw new Error('Review ID is required');
      const response = await apiClient.get<{ data?: AdminReviewDetail } & AdminReviewDetail>(`/reviews/admin/${reviewId}`);
      const res = response.data;
      return (res?.data ?? res) as AdminReviewDetail;
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

