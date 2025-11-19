import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  approveSellerRequest,
  fetchAdminSellers,
  rejectSellerRequest,
} from '../../admin/api';
import { AdminSeller } from '../../admin/types';

const sellersKeys = {
  all: ['admin', 'sellers'] as const,
};

export function useAdminSellers() {
  return useQuery<AdminSeller[]>({
    queryKey: sellersKeys.all,
    queryFn: fetchAdminSellers,
  });
}

export function useApproveSellerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveSellerRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sellersKeys.all });
      toast.success('Seller approved successfully.');
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error('Failed to approve seller.');
    },
  });
}

export function useRejectSellerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectSellerRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sellersKeys.all });
      toast.success('Seller rejected.');
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error('Failed to reject seller.');
    },
  });
}


