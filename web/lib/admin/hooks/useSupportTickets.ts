import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { fetchSupportTickets, updateSupportTicketStatusRequest } from '../../admin/api';
import { SupportTicket, SupportTicketStatus } from '../../admin/types';

const supportKeys = {
  all: ['admin', 'support', 'tickets'] as const,
};

export function useSupportTickets() {
  return useQuery<SupportTicket[]>({
    queryKey: supportKeys.all,
    queryFn: fetchSupportTickets,
  });
}

export function useSupportTicketStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      status,
      adminNotes,
    }: {
      ticketId: string;
      status: SupportTicketStatus;
      adminNotes?: string;
    }) => updateSupportTicketStatusRequest(ticketId, status, adminNotes),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: supportKeys.all });
      toast.success('Support ticket updated.');
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error('Failed to update ticket.');
    },
  });
}


