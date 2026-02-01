import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  fetchAdminOrderById,
  fetchAdminOrders,
  fetchOrderValidTransitions,
  updateOrderStatusRequest,
} from '../../admin/api';
import { AdminOrder, AdminOrderStatus } from '../../admin/types';

const orderKeys = {
  all: ['admin', 'orders'] as const,
  detail: (orderId: string) => ['admin', 'orders', orderId] as const,
  validTransitions: (orderId: string) => ['admin', 'orders', orderId, 'valid-transitions'] as const,
};

export function useAdminOrders() {
  return useQuery<AdminOrder[]>({
    queryKey: orderKeys.all,
    queryFn: fetchAdminOrders,
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
    mutationFn: ({ orderId, status }: { orderId: string; status: AdminOrderStatus }) =>
      updateOrderStatusRequest(orderId, status),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: orderKeys.all }),
        queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) }),
        queryClient.invalidateQueries({ queryKey: orderKeys.validTransitions(variables.orderId) }),
      ]);
      toast.success('Order status updated.');
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error(getOrderStatusErrorMessage(error));
    },
  });
}


