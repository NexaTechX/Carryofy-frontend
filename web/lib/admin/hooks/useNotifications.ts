import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  createNotificationRequest,
  deleteNotificationRequest,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationReadRequest,
  markNotificationsReadRequest,
} from '../../admin/api';
import { AdminNotification, CreateNotificationPayload } from '../../admin/types';

const notificationKeys = {
  list: (params?: { limit?: number; unreadOnly?: boolean }) => ['admin', 'notifications', params] as const,
  unreadCount: ['admin', 'notifications', 'unread-count'] as const,
};

export function useAdminNotifications(params?: { limit?: number; unreadOnly?: boolean }) {
  return useQuery<AdminNotification[]>({
    queryKey: notificationKeys.list(params),
    queryFn: () => fetchNotifications(params),
  });
}

export function useUnreadNotificationCount() {
  return useQuery<number>({
    queryKey: notificationKeys.unreadCount,
    queryFn: fetchUnreadNotificationCount,
  });
}

export function useCreateNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateNotificationPayload) => createNotificationRequest(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount }),
      ]);
      toast.success('Notification sent.');
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error('Failed to send notification.');
    },
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationReadRequest(notificationId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount }),
      ]);
    },
  });
}

export function useMarkNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationIds?: string[]) => markNotificationsReadRequest(notificationIds),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount }),
      ]);
    },
  });
}

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => deleteNotificationRequest(notificationId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount }),
      ]);
      toast.success('Notification deleted.');
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error('Failed to delete notification.');
    },
  });
}


