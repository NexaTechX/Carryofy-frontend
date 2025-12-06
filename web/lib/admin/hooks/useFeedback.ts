import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { fetchFeedbacks, deleteFeedbackRequest } from '../api';
import { Feedback } from '../types';

const feedbackKeys = {
  all: ['admin', 'feedback'] as const,
};

export function useFeedbacks() {
  return useQuery<Feedback[]>({
    queryKey: feedbackKeys.all,
    queryFn: fetchFeedbacks,
    staleTime: 0, // Always consider data stale to refetch
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes (formerly cacheTime)
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function useDeleteFeedbackMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (feedbackId: string) => deleteFeedbackRequest(feedbackId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: feedbackKeys.all });
      toast.success('Feedback deleted successfully.');
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error('Failed to delete feedback.');
    },
  });
}

