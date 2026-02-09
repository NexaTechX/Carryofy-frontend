import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';

export interface AdminRiderRating {
  id: string;
  deliveryId: string;
  orderId: string;
  userId: string;
  riderId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string };
  riderName?: string;
  riderEmail?: string;
  userName?: string;
  userEmail?: string;
}

export interface AdminRiderRatingsResponse {
  ratings: AdminRiderRating[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UseAdminRiderRatingsQuery {
  page?: number;
  limit?: number;
  riderId?: string;
}

export function useAdminRiderRatings(query: UseAdminRiderRatingsQuery) {
  const params = new URLSearchParams();
  if (query.page !== undefined && query.page !== null) {
    params.append('page', query.page.toString());
  }
  if (query.limit !== undefined && query.limit !== null) {
    params.append('limit', query.limit.toString());
  }
  if (query.riderId) {
    params.append('riderId', query.riderId);
  }

  return useQuery<AdminRiderRatingsResponse>({
    queryKey: ['admin', 'rider-ratings', query],
    queryFn: async () => {
      const queryString = params.toString();
      const url = `/admin/rider-ratings${queryString ? `?${queryString}` : ''}`;
      const response = await apiClient.get<{ data?: AdminRiderRatingsResponse } & AdminRiderRatingsResponse>(url);
      const res = response.data;
      return (res?.data ?? res) as AdminRiderRatingsResponse;
    },
  });
}
