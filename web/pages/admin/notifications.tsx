import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Check, Trash2 } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  AdminEmptyState,
  AdminPageHeader,
  LoadingState,
  StatusBadge,
} from '../../components/admin/ui';
import {
  useAdminNotifications,
  useDeleteNotificationMutation,
  useMarkNotificationReadMutation,
  useMarkNotificationsReadMutation,
  useUnreadNotificationCount,
} from '../../lib/admin/hooks/useNotifications';
import type { AdminNotification, NotificationType } from '../../lib/admin/types';
import { formatDateTime } from '../../lib/api/utils';

const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  ORDER: 'Order',
  PRODUCT: 'Product',
  PAYOUT: 'Payout',
  SYSTEM: 'System',
  KYC: 'KYC',
};

const NOTIFICATION_TONE: Record<NotificationType, 'info' | 'warning' | 'success' | 'danger' | 'neutral'> =
  {
    ORDER: 'info',
    PRODUCT: 'info',
    PAYOUT: 'success',
    SYSTEM: 'neutral',
    KYC: 'warning',
  };

const LIST_LIMIT = 200;

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: notifications = [], isLoading } = useAdminNotifications({
    limit: LIST_LIMIT,
    unreadOnly: filter === 'unread',
  });
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkNotificationsReadMutation();
  const deleteNotification = useDeleteNotificationMutation();

  const handleOpen = async (notification: AdminNotification) => {
    if (!notification.read) {
      try {
        await markRead.mutateAsync(notification.id);
      } catch {
        /* still allow navigation */
      }
    }
    if (notification.link) {
      await router.push(notification.link);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <AdminPageHeader
          title="Notifications"
          subtitle="Your full inbox for system alerts, orders, payouts, and KYC updates. Open an item to mark it read and jump to the linked page when a link is available."
          actions={
            notifications.length > 0 ? (
              <button
                type="button"
                onClick={() => markAllRead.mutate(undefined)}
                disabled={markAllRead.isPending}
                className="inline-flex items-center gap-2 rounded-full border border-border-custom bg-[#151515] px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-primary hover:text-white disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Mark all read
              </button>
            ) : null
          }
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              filter === 'all' ? 'bg-primary text-black' : 'bg-[#151515] text-gray-400 hover:bg-[#1a1a1a]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              filter === 'unread' ? 'bg-primary text-black' : 'bg-[#151515] text-gray-400 hover:bg-[#1a1a1a]'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <span className="text-xs text-gray-500 ml-2">Showing up to {LIST_LIMIT} items</span>
        </div>

        {isLoading ? (
          <LoadingState label="Loading notifications…" />
        ) : notifications.length === 0 ? (
          <AdminEmptyState
            title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            description="When something needs your attention, it will appear here with the full message."
          />
        ) : (
          <ul className="space-y-3">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`group relative rounded-2xl border px-4 py-4 transition sm:px-5 sm:py-5 ${
                  !notification.read ? 'border-primary/40 bg-[#181818]' : 'border-[#1f1f1f] bg-[#151515]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleOpen(notification)}
                  className="w-full text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      tone={NOTIFICATION_TONE[notification.type]}
                      label={NOTIFICATION_TYPE_LABEL[notification.type]}
                    />
                    {!notification.read && (
                      <span className="inline-block h-2 w-2 rounded-full bg-primary" aria-hidden />
                    )}
                    <span className="text-[11px] uppercase tracking-[0.14em] text-gray-500">
                      {formatDateTime(notification.createdAt)}
                    </span>
                  </div>
                  <h2 className="mt-2 text-base font-semibold text-white leading-snug">
                    {notification.title}
                  </h2>
                  <p className="mt-2 text-sm text-gray-400 whitespace-pre-wrap wrap-break-word leading-relaxed">
                    {notification.message}
                  </p>
                  {notification.action && (
                    <span className="mt-3 inline-block rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {notification.action}
                    </span>
                  )}
                  {notification.link && (
                    <p className="mt-2 text-xs text-primary/80 truncate" title={notification.link}>
                      {notification.link}
                    </p>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => deleteNotification.mutate(notification.id)}
                  className="absolute right-3 top-3 rounded-full bg-[#1a1a1a] p-2 text-gray-400 opacity-0 transition hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100 sm:right-4 sm:top-4"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="text-center text-sm text-gray-500">
          <Link href="/admin/support" className="text-primary hover:underline">
            Support center
          </Link>
          {' · '}
          <span>To broadcast to users, use </span>
          <Link href="/admin/broadcast" className="text-primary hover:underline">
            Broadcast
          </Link>
        </p>
      </div>
    </AdminLayout>
  );
}
