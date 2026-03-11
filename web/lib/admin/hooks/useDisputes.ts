import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminDisputeQueue,
  getDispute,
  adminUpdateDispute,
  addDisputeMessage,
  type DisputeStatus,
  type AdminUpdateDisputePayload,
} from '../../api/disputes';
import { toast } from 'react-hot-toast';

const DISPUTES_CACHE_KEY = 'admin-disputes';

export function useAdminDisputeQueue(params?: {
  status?: DisputeStatus;
  orderId?: string;
  slaBreachRisk?: boolean;
}) {
  return useQuery({
    queryKey: [DISPUTES_CACHE_KEY, 'queue', params],
    queryFn: () => getAdminDisputeQueue(params),
    refetchInterval: 30_000,
  });
}

export function useDisputeDetail(disputeId: string | null) {
  return useQuery({
    queryKey: [DISPUTES_CACHE_KEY, 'detail', disputeId],
    queryFn: () => getDispute(disputeId!),
    enabled: !!disputeId,
  });
}

export function useAdminUpdateDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      disputeId,
      payload,
    }: {
      disputeId: string;
      payload: AdminUpdateDisputePayload;
    }) => adminUpdateDispute(disputeId, payload),
    onSuccess: (_, { disputeId }) => {
      queryClient.invalidateQueries({ queryKey: [DISPUTES_CACHE_KEY] });
      queryClient.invalidateQueries({ queryKey: [DISPUTES_CACHE_KEY, 'detail', disputeId] });
      toast.success('Dispute updated');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Failed to update dispute');
    },
  });
}

export function useAddDisputeMessage(disputeId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { body: string; isInternal?: boolean }) =>
      addDisputeMessage(disputeId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DISPUTES_CACHE_KEY] });
      if (disputeId) {
        queryClient.invalidateQueries({ queryKey: [DISPUTES_CACHE_KEY, 'detail', disputeId] });
      }
      toast.success('Message sent');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Failed to send message');
    },
  });
}
