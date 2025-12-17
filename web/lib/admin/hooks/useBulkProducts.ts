import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  bulkApproveProductsRequest,
  bulkRejectProductsRequest,
  bulkDeleteProductsRequest,
  bulkStatusChangeRequest,
} from '../api';

export function useBulkApproveProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkApproveProductsRequest,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast.success(`${data.approved} product(s) approved successfully.`);
      if (data.failed > 0) {
        toast.error(`${data.failed} product(s) failed to approve.`);
      }
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error('Failed to approve products.');
    },
  });
}

export function useBulkRejectProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productIds, reason }: { productIds: string[]; reason?: string }) =>
      bulkRejectProductsRequest(productIds, reason),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast.success(`${data.rejected} product(s) rejected successfully.`);
      if (data.failed > 0) {
        toast.error(`${data.failed} product(s) failed to reject.`);
      }
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error('Failed to reject products.');
    },
  });
}

export function useBulkDeleteProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkDeleteProductsRequest,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast.success(`${data.deleted} product(s) deleted successfully.`);
      if (data.failed > 0) {
        toast.error(`${data.failed} product(s) failed to delete.`);
      }
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error('Failed to delete products.');
    },
  });
}

export function useBulkStatusChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productIds, status }: { productIds: string[]; status: string }) =>
      bulkStatusChangeRequest(productIds, status),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast.success(`${data.updated} product(s) status updated successfully.`);
      if (data.failed > 0) {
        toast.error(`${data.failed} product(s) failed to update.`);
      }
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error('Failed to update product status.');
    },
  });
}

