import { useMemo, useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  AdminCard,
  AdminEmptyState,
  AdminPageHeader,
  AdminToolbar,
  LoadingState,
  StatusBadge,
} from '../../components/admin/ui';
import { useSupportTickets, useSupportTicketStatusMutation } from '../../lib/admin/hooks/useSupportTickets';
import {
  useAdminNotifications,
  useCreateNotificationMutation,
  useDeleteNotificationMutation,
  useMarkNotificationReadMutation,
  useMarkNotificationsReadMutation,
  useUnreadNotificationCount,
} from '../../lib/admin/hooks/useNotifications';
import {
  AdminNotification,
  CreateNotificationPayload,
  NotificationType,
  SupportTicket,
  SupportTicketPriority,
  SupportTicketStatus,
} from '../../lib/admin/types';

const SUPPORT_FILTERS: Array<{ id: 'all' | SupportTicketStatus | 'pending'; label: string }> = [
  { id: 'all', label: 'All Tickets' },
  { id: 'OPEN', label: 'Open' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'RESOLVED', label: 'Resolved' },
  { id: 'CLOSED', label: 'Closed' },
  { id: 'pending', label: 'Needs Reply' },
];

const SUPPORT_STATUS_LABEL: Record<SupportTicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

const SUPPORT_STATUS_TONE: Record<SupportTicketStatus, 'warning' | 'info' | 'success' | 'neutral'> = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

const PRIORITY_TONE: Record<SupportTicketPriority, 'neutral' | 'warning' | 'danger' | 'success' | 'info'> = {
  LOW: 'neutral',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'danger',
};

const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  ORDER: 'Order',
  PRODUCT: 'Product',
  PAYOUT: 'Payout',
  SYSTEM: 'System',
  KYC: 'KYC',
};

const NOTIFICATION_TONE: Record<NotificationType, 'info' | 'warning' | 'success' | 'danger' | 'neutral'> = {
  ORDER: 'info',
  PRODUCT: 'info',
  PAYOUT: 'success',
  SYSTEM: 'neutral',
  KYC: 'warning',
};

const SUPPORT_STATUS_OPTIONS: SupportTicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const notificationTypeOptions: NotificationType[] = ['SYSTEM', 'ORDER', 'PRODUCT', 'PAYOUT', 'KYC'];

const formatDateTime = (iso: string) => new Date(iso).toLocaleString();

export default function AdminSupport() {
  const [activeFilter, setActiveFilter] = useState<'all' | SupportTicketStatus | 'pending'>('all');
  const [search, setSearch] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const { data: tickets, isLoading: ticketsLoading, isError: ticketsError, error: ticketsErrorObj, refetch: refetchTickets } =
    useSupportTickets();
  const updateTicketStatus = useSupportTicketStatusMutation();

  const selectedTicket = useMemo<SupportTicket | undefined>(() => {
    if (!tickets || tickets.length === 0) return undefined;
    const initial = selectedTicketId ?? tickets[0]?.id;
    return tickets.find((ticket) => ticket.id === initial);
  }, [tickets, selectedTicketId]);

  useEffect(() => {
    if (selectedTicket) {
      setNoteDraft(selectedTicket.adminNotes ?? '');
    }
  }, [selectedTicket?.id]);

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter((ticket) => {
      const matchesSearch = search
        ? ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
          ticket.message.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesFilter =
        activeFilter === 'all'
          ? true
          : activeFilter === 'pending'
            ? ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS'
            : ticket.status === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [tickets, search, activeFilter]);

  const handleStatusChange = (status: SupportTicketStatus) => {
    if (!selectedTicket) return;
    updateTicketStatus.mutate({ ticketId: selectedTicket.id, status, adminNotes: noteDraft || selectedTicket.adminNotes });
  };

  const handleSaveNotes = () => {
    if (!selectedTicket) return;
    updateTicketStatus.mutate({ ticketId: selectedTicket.id, status: selectedTicket.status, adminNotes: noteDraft });
  };

  const [notificationForm, setNotificationForm] = useState<CreateNotificationPayload>({
    type: 'SYSTEM',
    title: '',
    message: '',
    link: '',
    action: '',
  });

  const { data: notifications, isLoading: notificationsLoading } = useAdminNotifications({ limit: 20 });
  const { data: unreadCount } = useUnreadNotificationCount();
  const createNotification = useCreateNotificationMutation();
  const markNotificationRead = useMarkNotificationReadMutation();
  const markAllNotificationsRead = useMarkNotificationsReadMutation();
  const deleteNotification = useDeleteNotificationMutation();

  const handleSendNotification = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!notificationForm.title.trim() || !notificationForm.message.trim()) {
      return;
    }
    createNotification.mutate({
      ...notificationForm,
      link: notificationForm.link?.trim() || undefined,
      action: notificationForm.action?.trim() || undefined,
    });
    setNotificationForm({ type: notificationForm.type, title: '', message: '', link: '', action: '' });
  };

  const unreadNotificationIds = notifications?.filter((notification) => !notification.read).map((notification) => notification.id) ?? [];

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Support & Notifications"
            tag="Operations"
            subtitle="Respond to marketplace issues and broadcast updates to the team."
          />

          <section className="mb-10 grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-4">
              <AdminToolbar className="mb-4">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search tickets"
                  className="w-full rounded-full border border-[#2a2a2a] bg-[#151515] px-4 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
              </AdminToolbar>
              <div className="flex flex-wrap gap-2 pb-4">
                {SUPPORT_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                      activeFilter === filter.id
                        ? 'bg-primary text-black'
                        : 'border border-[#2a2a2a] bg-[#151515] text-gray-300 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {ticketsLoading ? (
                <LoadingState />
              ) : ticketsError ? (
                <AdminEmptyState
                  title="Unable to load tickets"
                  description={ticketsErrorObj instanceof Error ? ticketsErrorObj.message : 'Please try again later.'}
                  action={
                    <button
                      type="button"
                      onClick={() => refetchTickets()}
                      className="rounded-full border border-primary px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:bg-primary hover:text-black"
                    >
                      Retry
                    </button>
                  }
                />
              ) : filteredTickets.length === 0 ? (
                <AdminEmptyState
                  title="No tickets match"
                  description="Adjust your filters or wait for new submissions."
                />
              ) : (
                <div className="space-y-3 overflow-y-auto">
                  {filteredTickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => {
                        setSelectedTicketId(ticket.id);
                        setNoteDraft(ticket.adminNotes ?? '');
                      }}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        selectedTicket?.id === ticket.id
                          ? 'border-primary/40 bg-[#151515]'
                          : 'border-[#1f1f1f] bg-[#111111] hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white">{ticket.subject}</p>
                        <StatusBadge
                          tone={SUPPORT_STATUS_TONE[ticket.status]}
                          label={SUPPORT_STATUS_LABEL[ticket.status]}
                        />
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-gray-400">{ticket.message}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                        <span>{ticket.priority} priority</span>
                        <span>{formatDateTime(ticket.createdAt)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6">
              {ticketsLoading ? (
                <LoadingState />
              ) : !selectedTicket ? (
                <AdminEmptyState title="No ticket selected" description="Pick a ticket to view details." />
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Ticket</p>
                      <h2 className="text-2xl font-semibold text-white">{selectedTicket.subject}</h2>
                      <p className="mt-1 text-xs text-gray-500">ID {selectedTicket.id}</p>
                    </div>
                    <div className="space-y-2 text-xs text-gray-400">
                      <p>Created {formatDateTime(selectedTicket.createdAt)}</p>
                      {selectedTicket.resolvedAt ? <p>Resolved {formatDateTime(selectedTicket.resolvedAt)}</p> : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <StatusBadge tone={SUPPORT_STATUS_TONE[selectedTicket.status]} label={SUPPORT_STATUS_LABEL[selectedTicket.status]} />
                    <StatusBadge tone={PRIORITY_TONE[selectedTicket.priority]} label={`${selectedTicket.priority} priority`} />
                    <StatusBadge tone="neutral" label={selectedTicket.category.toUpperCase()} />
                  </div>

                  <div className="rounded-2xl border border-[#1f1f1f] bg-[#151515] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Customer message</p>
                    <p className="mt-2 text-sm text-gray-200">{selectedTicket.message}</p>
                  </div>

                  <div className="space-y-3">
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Status</span>
                      <select
                        value={selectedTicket.status}
                        onChange={(event) => handleStatusChange(event.target.value as SupportTicketStatus)}
                        className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                      >
                        {SUPPORT_STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {SUPPORT_STATUS_LABEL[option]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Admin notes</span>
                      <textarea
                        value={noteDraft}
                        onChange={(event) => setNoteDraft(event.target.value)}
                        placeholder="Add context for future agents"
                        className="min-h-[120px] rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      className="rounded-full border border-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:bg-primary hover:text-black"
                    >
                      Save notes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Notifications</p>
                <h2 className="text-2xl font-semibold text-white">Inbox</h2>
                <p className="text-xs text-gray-500">Unread: {unreadCount ?? 0}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => markAllNotificationsRead.mutate(unreadNotificationIds.length ? unreadNotificationIds : undefined)}
                  disabled={unreadNotificationIds.length === 0}
                  className="rounded-full border border-[#2a2a2a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Mark all read
                </button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
              <form className="space-y-3" onSubmit={handleSendNotification}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Send notification</p>
                <select
                  value={notificationForm.type}
                  onChange={(event) => setNotificationForm((prev) => ({ ...prev, type: event.target.value as NotificationType }))}
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                >
                  {notificationTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {NOTIFICATION_TYPE_LABEL[option]}
                    </option>
                  ))}
                </select>
                <input
                  value={notificationForm.title}
                  onChange={(event) => setNotificationForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Title"
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                  required
                />
                <textarea
                  value={notificationForm.message}
                  onChange={(event) => setNotificationForm((prev) => ({ ...prev, message: event.target.value }))}
                  placeholder="Message"
                  className="min-h-[120px] rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                  required
                />
                <input
                  value={notificationForm.link}
                  onChange={(event) => setNotificationForm((prev) => ({ ...prev, link: event.target.value }))}
                  placeholder="Optional link"
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
                <input
                  value={notificationForm.action}
                  onChange={(event) => setNotificationForm((prev) => ({ ...prev, action: event.target.value }))}
                  placeholder="Optional action label"
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light"
                >
                  Send notification
                </button>
              </form>

              <div className="space-y-3">
                {notificationsLoading ? (
                  <LoadingState />
                ) : !notifications || notifications.length === 0 ? (
                  <AdminEmptyState title="No notifications" description="You haven’t received any notifications yet." />
                ) : (
                  notifications.map((notification: AdminNotification) => (
                    <div
                      key={notification.id}
                      className={`rounded-2xl border px-4 py-3 ${notification.read ? 'border-[#1f1f1f] bg-[#151515]' : 'border-primary/40 bg-[#181818]'}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white">{notification.title}</h3>
                            <StatusBadge tone={NOTIFICATION_TONE[notification.type]} label={NOTIFICATION_TYPE_LABEL[notification.type]} />
                          </div>
                          <p className="text-xs text-gray-400">{notification.message}</p>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">{formatDateTime(notification.createdAt)}</p>
                          {notification.link ? (
                            <p className="text-xs text-primary">Link: {notification.link}</p>
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                          {!notification.read ? (
                            <button
                              type="button"
                              onClick={() => markNotificationRead.mutate(notification.id)}
                              className="rounded-full border border-[#2a2a2a] px-3 py-1 transition hover:border-primary hover:text-primary"
                            >
                              Mark read
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => deleteNotification.mutate(notification.id)}
                            className="rounded-full border border-[#3a1f1f] px-3 py-1 text-[#ff9aa8] transition hover:border-[#ff9aa8] hover:text-[#ffb8c6]"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}