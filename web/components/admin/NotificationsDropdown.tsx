import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationReadRequest,
  markNotificationsReadRequest,
  deleteNotificationRequest,
} from '../../lib/admin/api';
import type { AdminNotification, NotificationType } from '../../lib/admin/types';
import { useRouter } from 'next/router';

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: notifications = [], isLoading, error: notificationsError } = useQuery({
    queryKey: ['admin', 'notifications', filter],
    queryFn: () => fetchNotifications({ unreadOnly: filter === 'unread' }),
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized) errors
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Handle errors using useEffect
  useEffect(() => {
    if (notificationsError) {
      // Silently handle 401 errors - user may not be authenticated
      if ((notificationsError as any)?.response?.status !== 401) {
        console.error('Error fetching notifications:', notificationsError);
      }
    }
  }, [notificationsError]);

  const { data: unreadCount = 0, error: unreadCountError } = useQuery({
    queryKey: ['admin', 'notifications', 'unread-count'],
    queryFn: fetchUnreadNotificationCount,
    refetchInterval: 30000,
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized) errors
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    select: (data) => {
      // Ensure we always return a number, even if data is undefined or null
      if (typeof data === 'number' && !isNaN(data)) {
        return data;
      }
      return 0;
    },
    placeholderData: 0,
  });

  // Handle errors using useEffect
  useEffect(() => {
    if (unreadCountError) {
      // Silently handle 401 errors - user may not be authenticated
      if ((unreadCountError as any)?.response?.status !== 401) {
        console.error('Error fetching unread notification count:', unreadCountError);
      }
    }
  }, [unreadCountError]);

  const markRead = useMutation({
    mutationFn: markNotificationReadRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => markNotificationsReadRequest(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: deleteNotificationRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
    },
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: AdminNotification) => {
    if (!notification.read) {
      await markRead.mutateAsync(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type: AdminNotification['type']): string => {
    // Use switch statement for type safety and completeness
    switch (type) {
      case 'ORDER':
        return '🛒';
      case 'PRODUCT':
        return '📦';
      case 'PAYOUT':
        return '💰';
      case 'SYSTEM':
        return '⚙️';
      case 'KYC':
        return '🪪';
      default:
        return '🔔';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full border border-[#1f2432] p-2 text-gray-400 transition hover:border-primary hover:text-white"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] shadow-2xl">
          {/* Header */}
          <div className="border-b border-[#1f1f1f] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-gray-500 hover:bg-[#1a1a1a] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  filter === 'all'
                    ? 'bg-primary text-black'
                    : 'bg-[#151515] text-gray-400 hover:bg-[#1a1a1a]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  filter === 'unread'
                    ? 'bg-primary text-black'
                    : 'bg-[#151515] text-gray-400 hover:bg-[#1a1a1a]'
                }`}
              >
                Unread ({unreadCount})
              </button>
              {notifications.length > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="rounded-full bg-[#151515] p-1.5 text-gray-400 hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50"
                  title="Mark all as read"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[480px] overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Bell className="mx-auto mb-2 h-12 w-12 text-gray-600" />
                <p className="text-sm text-gray-500">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#1f1f1f]">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`group relative px-4 py-3 transition ${
                      !notification.read ? 'bg-primary/5' : 'hover:bg-[#0f0f0f]'
                    }`}
                  >
                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-lg">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-white">
                              {notification.title}
                              {!notification.read && (
                                <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary" />
                              )}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-400">{notification.message}</p>
                          {notification.action && (
                            <span className="mt-2 inline-block rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                              {notification.action}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification.mutate(notification.id);
                      }}
                      className="absolute right-2 top-3 hidden rounded-full bg-[#1a1a1a] p-1.5 text-gray-400 hover:bg-red-500/20 hover:text-red-500 group-hover:block"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

