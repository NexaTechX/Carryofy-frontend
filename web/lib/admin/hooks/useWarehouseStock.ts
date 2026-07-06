import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import {
  adjustStockRequest,
  createInboundStockRequest,
  createOutboundStockRequest,
  fetchLowStock,
  fetchWarehouseMovements,
  fetchWarehouseStock,
} from '../../admin/api';
import {
  AdjustStockPayload,
  CreateInboundPayload,
  CreateOutboundPayload,
  StockMovement,
  WarehouseStockItem,
} from '../../admin/types';

const warehouseKeys = {
  all: ['admin', 'warehouse'] as const,
  stock: ['admin', 'warehouse', 'stock'] as const,
  movements: ['admin', 'warehouse', 'movements'] as const,
  lowStock: (threshold: number) => ['admin', 'warehouse', 'low-stock', threshold] as const,
};

const isClient = typeof window !== 'undefined';

/** Surface the API's error message (e.g. "Insufficient stock") instead of a generic one. */
function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: string | string[] } | undefined)?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

export function useWarehouseStock() {
  return useQuery<WarehouseStockItem[]>({
    queryKey: warehouseKeys.stock,
    queryFn: fetchWarehouseStock,
    enabled: isClient,
  });
}

export function useWarehouseMovements() {
  return useQuery<StockMovement[]>({
    queryKey: warehouseKeys.movements,
    queryFn: fetchWarehouseMovements,
    enabled: isClient,
  });
}

export function useLowStock(threshold = 10) {
  return useQuery({
    queryKey: warehouseKeys.lowStock(threshold),
    queryFn: () => fetchLowStock(threshold),
    enabled: isClient,
  });
}

export function useCreateInboundMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInboundPayload) => createInboundStockRequest(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      toast.success('Inbound stock recorded.');
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error(getApiErrorMessage(error, 'Unable to record inbound stock.'));
    },
  });
}

export function useCreateOutboundMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOutboundPayload) => createOutboundStockRequest(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      toast.success('Outbound task logged.');
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error(getApiErrorMessage(error, 'Unable to create outbound task.'));
    },
  });
}

export function useAdjustStockMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdjustStockPayload) => adjustStockRequest(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      toast.success('Stock level adjusted.');
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error(getApiErrorMessage(error, 'Unable to adjust stock.'));
    },
  });
}


