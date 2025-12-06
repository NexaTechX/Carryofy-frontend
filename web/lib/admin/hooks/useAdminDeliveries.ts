import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  assignDeliveryRequest,
  fetchActiveDeliveries,
  fetchDeliveryByOrderId,
  updateDeliveryStatusRequest,
  fetchAvailableRiders,
  AvailableRider,
} from '../../admin/api';
import { AdminDelivery, AdminDeliveryStatus } from '../../admin/types';

const deliveryKeys = {
  active: ['admin', 'deliveries', 'active'] as const,
  order: (orderId: string) => ['admin', 'deliveries', 'orders', orderId] as const,
};

export function useActiveDeliveries() {
  return useQuery<AdminDelivery[]>({
    queryKey: deliveryKeys.active,
    queryFn: fetchActiveDeliveries,
  });
}

export function useDeliveryByOrder(orderId: string | null) {
  return useQuery<AdminDelivery>({
    queryKey: orderId ? deliveryKeys.order(orderId) : deliveryKeys.order('placeholder'),
    queryFn: () => {
      if (!orderId) {
        throw new Error('Order ID is required');
      }
      return fetchDeliveryByOrderId(orderId);
    },
    enabled: Boolean(orderId),
  });
}

export function useAssignDeliveryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignDeliveryRequest,
    onSuccess: async (delivery) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: deliveryKeys.active }),
        queryClient.invalidateQueries({ queryKey: deliveryKeys.order(delivery.orderId) }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] }),
      ]);
      toast.success('Delivery assigned successfully.');
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error('Failed to assign delivery.');
    },
  });
}

export function useDeliveryStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deliveryId,
      status,
      updates,
    }: {
      deliveryId: string;
      status: AdminDeliveryStatus;
      updates?: { rider?: string; eta?: string };
    }) => updateDeliveryStatusRequest(deliveryId, status, updates),
    onSuccess: async (delivery) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: deliveryKeys.active }),
        queryClient.invalidateQueries({ queryKey: deliveryKeys.order(delivery.orderId) }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] }),
      ]);
      toast.success('Delivery status updated.');
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error('Failed to update delivery status.');
    },
  });
}

export function useAvailableRiders() {
  return useQuery<AvailableRider[]>({
    queryKey: ['admin', 'riders', 'available'],
    queryFn: fetchAvailableRiders,
    staleTime: 30000, // Cache for 30 seconds
  });
}


