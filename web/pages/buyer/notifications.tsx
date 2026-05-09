import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import apiClient from '../../lib/api/client';
import { tokenManager, userManager } from '../../lib/auth';
import {
  Bell,
  CheckCheck,
  Loader2,
  Package,
  Shield,
  Inbox,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link?: string;
  action?: string;
  read: boolean;
  createdAt: string;
  type: string;
}

type InboxFilter = 'all' | 'unread';

export default function BuyerNotificationsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<InboxFilter>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!tokenManager.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    const user = userManager.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (user.role && user.role !== 'BUYER' && user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [mounted, router]);

  const fetchNotifications = async () => {
    try {
      const user = userManager.getUser();
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      const params =
        filter === 'unread' ? { limit: 200, unreadOnly: true } : { limit: 200 };
      const [listRes, countRes] = await Promise.all([
        apiClient.get<NotificationItem[]>('/notifications', { params }),
        apiClient.get<{ count: number }>('/notifications/unread-count'),
      ]);

      const listData = listRes.data;
      setNotifications(Array.isArray(listData) ? listData : []);
      const raw = countRes.data?.count ?? 0;
      const num = typeof raw === 'number' && !Number.isNaN(raw) ? Math.max(0, Math.floor(raw)) : 0;
      setUnreadCount(num);
    } catch (err: unknown) {
      console.error('Failed to fetch notifications', err);
      type AxiosLikeError = { response?: { data?: { message?: string } } };
      type ErrorWithMessage = { message?: string };
      const message =
        (err as AxiosLikeError)?.response?.data?.message ||
        (err as ErrorWithMessage)?.message ||
        'Unable to fetch notifications right now.';
      setError(
        message.includes('Network Error')
          ? 'Unable to reach notifications service. Please check your connection.'
          : message
      );
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    if (!tokenManager.isAuthenticated() || !userManager.getUser()) return;
    const user = userManager.getUser();
    if (user?.role && user.role !== 'BUYER' && user.role !== 'ADMIN') return;
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when filter changes
  }, [mounted, filter]);

  const markAllAsRead = async () => {
    try {
      await apiClient.put('/notifications/mark-as-read', {});
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark notifications as read', err);
    }
  };

  const markSingleAsRead = async (notificationId: string) => {
    try {
      await apiClient.put(`/notifications/${notificationId}/mark-as-read`);
      setNotifications((prev) =>
        prev.map((item) => (item.id === notificationId ? { ...item, read: true } : item))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const renderIcon = (type: string, read: boolean) => {
    const baseClasses = read ? 'text-[#ffcc99]/50' : 'text-[#ff6600]';
    switch (type) {
      case 'ORDER':
        return <Package className={`w-5 h-5 ${baseClasses}`} />;
      case 'PRODUCT':
        return <Package className={`w-5 h-5 ${baseClasses}`} />;
      case 'SECURITY':
        return <Shield className={`w-5 h-5 ${baseClasses}`} />;
      case 'SYSTEM':
        return <AlertCircle className={`w-5 h-5 ${baseClasses}`} />;
      default:
        return <Inbox className={`w-5 h-5 ${baseClasses}`} />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) return 'Just now';
    if (diff < hour) {
      const minutes = Math.floor(diff / minute);
      return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
    }
    if (diff < day) {
      const hours = Math.floor(diff / hour);
      return `${hours} hr${hours === 1 ? '' : 's'} ago`;
    }
    const days = Math.floor(diff / day);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  if (!mounted) {
    return null;
  }

  if (!tokenManager.isAuthenticated() || !userManager.getUser()) {
    return null;
  }

  const user = userManager.getUser();
  if (user?.role && user.role !== 'BUYER' && user.role !== 'ADMIN') {
    return null;
  }

  return (
    <>
      <Head>
        <title>Notifications | Carryofy</title>
        <meta
          name="description"
          content="Read and manage your Carryofy notifications in one place."
        />
      </Head>
      <BuyerLayout>
        <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
          <Link
            href="/buyer"
            className="inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-primary mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Notifications
              </h1>
              <p className="text-foreground/60 text-sm mt-1">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : 'You are caught up on everything we have sent you.'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-primary/40 text-primary text-sm font-semibold hover:bg-primary/10 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </button>
            )}
          </div>

          <div className="flex gap-2 mb-6">
            {(['all', 'unread'] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  filter === id
                    ? 'bg-primary text-black'
                    : 'bg-card border border-border-custom text-foreground/70 hover:text-foreground'
                }`}
              >
                {id === 'all' ? 'All' : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-border-custom bg-card overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-foreground/60">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading notifications…
              </div>
            ) : error ? (
              <div className="px-6 py-12 text-center text-foreground/70 text-sm">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Bell className="w-12 h-12 text-primary/30 mx-auto mb-3" />
                <p className="text-foreground font-medium">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="text-foreground/60 text-sm mt-1">
                  We will notify you about orders, deliveries, and account updates here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border-custom">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`px-4 sm:px-6 py-5 ${!notification.read ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex gap-4">
                      <div className="mt-0.5 shrink-0">
                        {renderIcon(notification.type, notification.read)}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h2 className="text-base font-semibold text-foreground leading-snug">
                            {notification.title}
                          </h2>
                          {!notification.read && (
                            <button
                              type="button"
                              onClick={() => markSingleAsRead(notification.id)}
                              className="text-primary text-xs font-semibold hover:underline shrink-0"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-foreground/70 whitespace-pre-wrap wrap-break-word leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground/50">
                          <span>{formatTimeAgo(notification.createdAt)}</span>
                          {notification.link && (
                            <Link
                              href={notification.link}
                              className="text-primary font-semibold hover:underline"
                              onClick={() => {
                                if (!notification.read) void markSingleAsRead(notification.id);
                              }}
                            >
                              {notification.action || 'Open link'}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-center text-sm text-foreground/50 mt-8">
            <Link href="/buyer/help" className="text-primary hover:underline">
              Need help? Visit support
            </Link>
          </p>
        </div>
      </BuyerLayout>
    </>
  );
}
