import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Loader2, Package, Shield, Inbox, AlertCircle } from 'lucide-react';
import apiClient from '../../lib/api/client';
import { userManager } from '../../lib/auth';

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

interface NotificationsDropdownProps {
  className?: string;
}

export default function NotificationsDropdown({ className }: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchNotifications();
    const onDocumentClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };

    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, []);

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
      const [listRes, countRes] = await Promise.all([
        apiClient.get<NotificationItem[]>('/notifications?limit=10'),
        apiClient.get<{ count: number }>('/notifications/unread-count'),
      ]);

      const listData = listRes.data;
      const countData = countRes.data;
      setNotifications(Array.isArray(listData) ? listData : []);
      setUnreadCount(countData?.count ?? 0);
    } catch (err: unknown) {
      console.error('Failed to fetch notifications', err);
      type AxiosLikeError = { response?: { data?: { message?: string } } };
      type ErrorWithMessage = { message?: string };
      const message =
        (err as AxiosLikeError)?.response?.data?.message ||
        (err as ErrorWithMessage)?.message ||
        'Unable to fetch notifications right now.';
      setError(message.includes('Network Error') ? 'Unable to reach notifications service. Please check your connection.' : message);
    } finally {
      setLoading(false);
    }
  };

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
        prev.map((item) =>
          item.id === notificationId
            ? { ...item, read: true }
            : item
        )
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const toggleOpen = () => {
    const nextState = !open;
    setOpen(nextState);
    if (nextState) {
      fetchNotifications();
    }
  };

  const renderIcon = (type: string, read: boolean) => {
    const baseClasses = read ? 'text-[#ffcc99]/50' : 'text-[#ff6600]';
    switch (type) {
      case 'ORDER':
        return <Package className={`w-4 h-4 ${baseClasses}`} />;
      case 'PRODUCT':
        return <Package className={`w-4 h-4 ${baseClasses}`} />;
      case 'SECURITY':
        return <Shield className={`w-4 h-4 ${baseClasses}`} />;
      case 'SYSTEM':
        return <AlertCircle className={`w-4 h-4 ${baseClasses}`} />;
      default:
        return <Inbox className={`w-4 h-4 ${baseClasses}`} />;
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

  return (
    <div ref={containerRef} className={className}>
      <button
        onClick={toggleOpen}
        className="relative p-2 text-[#ffcc99] hover:text-white transition"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#ff6600] text-black text-xs font-bold rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-4 mt-2 w-80 max-h-[26rem] overflow-hidden rounded-2xl border border-[#ff6600]/30 bg-[#0d0d0d] shadow-lg shadow-black/50 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#ff6600]/20">
            <div>
              <p className="text-white text-sm font-semibold">Notifications</p>
              <p className="text-[#ffcc99]/60 text-xs">
                Stay up to date with your orders, new products, and support tickets.
              </p>
            </div>
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-[#ff6600] text-xs font-semibold hover:text-white transition"
            >
              <CheckCheck className="w-3 h-3" />
              Mark all read
            </button>
          </div>

          <div className="max-h-[18rem] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-[#ffcc99]/70">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading notifications...
              </div>
            ) : error ? (
              <div className="px-4 py-6 text-center text-[#ffcc99]/70 text-sm">
                {error}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-[#ffcc99]/70 text-sm">
                No notifications yet. We&apos;ll let you know when something important happens.
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-[#ff6600]/10 transition ${
                    notification.read ? 'bg-transparent' : 'bg-[#ff6600]/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {renderIcon(notification.type, notification.read)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-white text-sm font-semibold leading-tight">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <button
                            onClick={() => markSingleAsRead(notification.id)}
                            className="text-[#ff6600] text-xs font-semibold hover:text-white transition"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                      <p className="text-[#ffcc99]/70 text-xs mt-1 leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[#ffcc99]/50 text-xs">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        {notification.link && (
                          <Link
                            href={notification.link}
                            className="text-[#ff6600] text-xs font-semibold hover:text-white transition"
                          >
                            {notification.action || 'View'}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-3 border-t border-[#ff6600]/20 text-right">
            <Link
              href="/buyer/help"
              className="text-[#ffcc99]/70 text-xs hover:text-[#ffcc99] transition"
            >
              Need help? Visit support →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
