import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  stock: ['admin', 'warehouse', 'stock'] as const,
  movements: ['admin', 'warehouse', 'movements'] as const,
  lowStock: (threshold: number) => ['admin', 'warehouse', 'low-stock', threshold] as const,
};

export function useWarehouseStock() {
  return useQuery<WarehouseStockItem[]>({
    queryKey: warehouseKeys.stock,
    queryFn: fetchWarehouseStock,
  });
}

export function useWarehouseMovements() {
  return useQuery<StockMovement[]>({
    queryKey: warehouseKeys.movements,
    queryFn: fetchWarehouseMovements,
  });
}

export function useLowStock(threshold = 10) {
  return useQuery({
    queryKey: warehouseKeys.lowStock(threshold),
    queryFn: () => fetchLowStock(threshold),
  });
}

export function useCreateInboundMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInboundPayload) => createInboundStockRequest(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: warehouseKeys.stock }),
        queryClient.invalidateQueries({ queryKey: warehouseKeys.movements }),
      ]);
      toast.success('Inbound stock recorded.');
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error('Unable to record inbound stock.');
    },
  });
}

export function useCreateOutboundMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOutboundPayload) => createOutboundStockRequest(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: warehouseKeys.stock }),
        queryClient.invalidateQueries({ queryKey: warehouseKeys.movements }),
      ]);
      toast.success('Outbound task logged.');
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error('Unable to create outbound task.');
    },
  });
}

export function useAdjustStockMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdjustStockPayload) => adjustStockRequest(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: warehouseKeys.stock }),
        queryClient.invalidateQueries({ queryKey: warehouseKeys.movements }),
      ]);
      toast.success('Stock level adjusted.');
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error('Unable to adjust stock.');
    },
  });
}


