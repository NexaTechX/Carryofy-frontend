import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  approvePayoutRequest,
  fetchPayouts,
  processPayoutRequest,
  rejectPayoutRequest,
} from '../../admin/api';
import { AdminPayout, ProcessPayoutPayload } from '../../admin/types';

const payoutKeys = {
  all: ['admin', 'payouts'] as const,
};

export function useAdminPayouts() {
  return useQuery<AdminPayout[]>({
    queryKey: payoutKeys.all,
    queryFn: fetchPayouts,
  });
}

export function useApprovePayoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approvePayoutRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: payoutKeys.all });
      toast.success('Payout approved.');
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error('Failed to approve payout.');
    },
  });
}

export function useRejectPayoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectPayoutRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: payoutKeys.all });
      toast.success('Payout rejected.');
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error('Failed to reject payout.');
    },
  });
}

export function useProcessPayoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payoutId, payload }: { payoutId: string; payload: ProcessPayoutPayload }) =>
      processPayoutRequest(payoutId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: payoutKeys.all });
      toast.success('Payout processed.');
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error('Failed to process payout.');
    },
  });
}


