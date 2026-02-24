import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { toast } from 'react-hot-toast';

export type RefundStatus = 'REQUESTED' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';

export interface AdminRefund {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  adminNotes?: string;
  processedBy?: string;
  customerName?: string;
  customerEmail?: string;
  orderAmount?: number;
  sellerName?: string;
  order?: {
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    paystackReference?: string | null;
    items?: Array<{
      productId: string;
      price: number;
      quantity: number;
      product?: { title?: string; images?: string[]; seller?: { businessName: string } };
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RefundStats {
  total: number;
  totalTrend: number;
  pending: number;
  pendingTrend: number;
  approved: number;
  approvedTrend: number;
  totalRefundedKobo: number;
  totalRefundedTrend: number;
  avgResolutionHours: number | null;
}

export interface RefundsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: RefundStatus;
}

export interface RefundsResponse {
  refunds: AdminRefund[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const REFUNDS_CACHE_KEY = 'admin-refunds';

export function useRefundStats() {
  return useQuery<RefundStats>({
    queryKey: [REFUNDS_CACHE_KEY, 'stats'],
    queryFn: async () => {
      const { data } = await apiClient.get('/refunds/admin/stats');
      return data;
    },
  });
}

export function useAdminRefunds(params: RefundsQueryParams = {}) {
  return useQuery<RefundsResponse>({
    queryKey: [REFUNDS_CACHE_KEY, params],
    queryFn: async () => {
      const { data } = await apiClient.get('/refunds/admin/all', { params });
      return data;
    },
    refetchInterval: 30_000, // near-real-time
  });
}

export function useRefundDetail(refundId: string | null) {
  return useQuery<AdminRefund>({
    queryKey: [REFUNDS_CACHE_KEY, 'detail', refundId],
    queryFn: async () => {
      if (!refundId) throw new Error('Refund ID is required');
      const { data } = await apiClient.get(`/refunds/${refundId}`);
      return data;
    },
    enabled: !!refundId,
  });
}

export function useUpdateRefundStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      refundId,
      status,
      adminNotes,
    }: {
      refundId: string;
      status: RefundStatus;
      adminNotes?: string;
    }) => {
      const { data } = await apiClient.put(`/refunds/${refundId}/status`, {
        status,
        adminNotes,
      });
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success('Refund status updated successfully');
      queryClient.invalidateQueries({ queryKey: [REFUNDS_CACHE_KEY] });
      queryClient.invalidateQueries({
        queryKey: [REFUNDS_CACHE_KEY, 'detail', variables.refundId],
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to update refund status'
      );
    },
  });
}

export function useBulkApproveRefunds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params?: { thresholdKobo?: number }) => {
      const { data } = await apiClient.post('/refunds/admin/bulk-approve', params ?? {});
      return data as { approved: number; failed: number; total: number };
    },
    onSuccess: (data) => {
      toast.success(`Bulk approve: ${data.approved} approved, ${data.failed} failed (${data.total} under threshold).`);
      queryClient.invalidateQueries({ queryKey: [REFUNDS_CACHE_KEY] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Bulk approve failed'
      );
    },
  });
}

