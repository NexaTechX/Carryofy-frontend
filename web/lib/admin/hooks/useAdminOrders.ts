import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  fetchAdminOrderById,
  fetchAdminOrders,
  updateOrderStatusRequest,
} from '../../admin/api';
import { AdminOrder, AdminOrderStatus } from '../../admin/types';

const orderKeys = {
  all: ['admin', 'orders'] as const,
  detail: (orderId: string) => ['admin', 'orders', orderId] as const,
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

export function useOrderStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: AdminOrderStatus }) =>
      updateOrderStatusRequest(orderId, status),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: orderKeys.all }),
        queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) }),
      ]);
      toast.success('Order status updated.');
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error('Failed to update order status.');
    },
  });
}


