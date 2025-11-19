import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  approveProductRequest,
  fetchPendingProducts,
  rejectProductRequest,
} from '../../admin/api';
import { PendingProduct } from '../../admin/types';

const productKeys = {
  pending: ['admin', 'products', 'pending'] as const,
};

export function usePendingProducts() {
  return useQuery<PendingProduct[]>({
    queryKey: productKeys.pending,
    queryFn: fetchPendingProducts,
  });
}

export function useApproveProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveProductRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productKeys.pending });
      toast.success('Product approved successfully.');
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error('Failed to approve product.');
    },
  });
}

export function useRejectProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectProductRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productKeys.pending });
      toast.success('Product rejected.');
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error('Failed to reject product.');
    },
  });
}


