import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  fetchAdminOrderById,
  fetchAdminOrdersPage,
  fetchCancellationBreakdown,
  fetchOrderValidTransitions,
  updateOrderStatusRequest,
} from '../../admin/api';
import {
  AdminOrder,
  AdminOrderStatus,
  CancellationBreakdown,
  OrderCancellationReason,
} from '../../admin/types';

const orderKeys = {
  all: ['admin', 'orders'] as const,
  list: (params: Record<string, unknown>) => ['admin', 'orders', params] as const,
  detail: (orderId: string) => ['admin', 'orders', orderId] as const,
  validTransitions: (orderId: string) => ['admin', 'orders', orderId, 'valid-transitions'] as const,
  cancellationBreakdown: ['admin', 'orders', 'cancellation-breakdown'] as const,
};

export interface AdminOrdersPageResult {
  orders: AdminOrder[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function getAdminOrdersErrorMessage(error: unknown): string {
  const err = error as { response?: { data?: { message?: string | string[] }; status?: number }; message?: string };
  const msg = err?.response?.data?.message;
  if (typeof msg === 'string' && msg.length) return msg;
  if (Array.isArray(msg) && msg.length) return msg.join(', ');
  if (err?.response?.status === 401) return 'Not signed in or session expired. Sign in again as an admin.';
  if (err?.response?.status === 403) return 'Access denied. This page requires an admin account.';
  if (error instanceof Error && error.message) return error.message;
  return 'Failed to load orders.';
}

export function useAdminOrders(options?: {
  refetchInterval?: number | false;
  orderType?: 'CONSUMER' | 'B2B';
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const queryParams = {
    page: options?.page ?? 1,
    limit: options?.limit ?? 20,
    orderType: options?.orderType,
    status: options?.status,
    search: options?.search,
  };

  return useQuery<AdminOrdersPageResult>({
    queryKey: orderKeys.list(queryParams),
    queryFn: async () => {
      try {
        return await fetchAdminOrdersPage(queryParams);
      } catch (error) {
        throw new Error(getAdminOrdersErrorMessage(error));
      }
    },
    refetchInterval: options?.refetchInterval ?? 30_000,
    retry: 1,
  });
}

export function useAdminOrderDetail(orderId: string | null) {
  return useQuery<AdminOrder>({
    queryKey: orderId ? orderKeys.detail(orderId) : orderKeys.detail('placeholder'),
    queryFn: () => {
      if (!orderId) {
        throw new Error('Order ID is required');
      }
      return fetchAdminOrderById(orderId);
    },
    enabled: Boolean(orderId),
  });
}

export function useOrderValidTransitions(orderId: string | null) {
  return useQuery<AdminOrderStatus[]>({
    queryKey: orderKeys.validTransitions(orderId ?? ''),
    queryFn: () => {
      if (!orderId) throw new Error('Order ID required');
      return fetchOrderValidTransitions(orderId);
    },
    enabled: Boolean(orderId),
  });
}

function getOrderStatusErrorMessage(error: unknown): string {
  const err = error as { response?: { data?: { message?: string }; status?: number } };
  const msg = err?.response?.data?.message;
  if (typeof msg === 'string' && msg.length) return msg;
  if (err?.response?.status === 400) return 'Invalid status change. Check valid transitions.';
  if (err?.response?.status === 404) return 'Order not found.';
  return 'Failed to update order status.';
}

export function useOrderStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      status,
      cancellationReason,
      cancellationReasonText,
    }: {
      orderId: string;
      status: AdminOrderStatus;
      cancellationReason?: OrderCancellationReason;
      cancellationReasonText?: string;
    }) =>
      updateOrderStatusRequest(orderId, status, {
        cancellationReason,
        cancellationReasonText,
      }),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: orderKeys.all }),
        queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) }),
        queryClient.invalidateQueries({ queryKey: orderKeys.validTransitions(variables.orderId) }),
        queryClient.invalidateQueries({ queryKey: orderKeys.cancellationBreakdown }),
      ]);
      toast.success('Order status updated.');
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error(getOrderStatusErrorMessage(error));
    },
  });
}

export function useCancellationBreakdown(options?: { refetchInterval?: number | false }) {
  return useQuery<CancellationBreakdown>({
    queryKey: orderKeys.cancellationBreakdown,
    queryFn: fetchCancellationBreakdown,
    refetchInterval: options?.refetchInterval ?? 60_000,
    retry: 1,
  });
}
