import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  approveRiderPayout,
  fetchRiderPayoutRequests,
  processRiderPayout,
  rejectRiderPayout,
} from '../api';
import { AdminRiderPayout, PayoutStatus } from '../types';

const riderPayoutKeys = {
  all: ['admin', 'rider-payouts'] as const,
  list: (status?: PayoutStatus) => ['admin', 'rider-payouts', status ?? 'ALL'] as const,
};

export function useRiderPayouts(status?: PayoutStatus) {
  return useQuery<AdminRiderPayout[]>({
    queryKey: riderPayoutKeys.list(status),
    queryFn: () => fetchRiderPayoutRequests(status),
  });
}

export function useApproveRiderPayoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveRiderPayout,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: riderPayoutKeys.all });
      toast.success('Rider payout approved.');
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error('Failed to approve rider payout.');
    },
  });
}

export function useRejectRiderPayoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => rejectRiderPayout(id, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: riderPayoutKeys.all });
      toast.success('Rider payout rejected.');
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error('Failed to reject rider payout.');
    },
  });
}

export function useProcessRiderPayoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: processRiderPayout,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: riderPayoutKeys.all });
      toast.success('Rider payout processed.');
    },
    onError: (error: unknown) => {
      console.error(error);
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to process rider payout.';
      toast.error(message);
    },
  });
}
