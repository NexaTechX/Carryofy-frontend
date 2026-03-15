import { useMemo, useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, MessageSquare, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import {
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
  SupportTicketUserType,
} from '../../lib/admin/types';
import { formatDateTime, formatRelativeTime } from '../../lib/api/utils';

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

/** Priority tag for list: Urgent=red, Normal=yellow, Low=grey */
const PRIORITY_TAG: Record<SupportTicketPriority, { label: string; className: string }> = {
  URGENT: { label: 'Urgent', className: 'border-red-500/50 bg-red-500/15 text-red-400' },
  HIGH: { label: 'High', className: 'border-amber-500/50 bg-amber-500/15 text-amber-400' },
  MEDIUM: { label: 'Normal', className: 'border-yellow-500/50 bg-yellow-500/15 text-yellow-400' },
  LOW: { label: 'Low', className: 'border-[#2a2a2a] bg-[#1a1a1a] text-gray-400' },
};

const PRIORITY_TONE: Record<SupportTicketPriority, 'neutral' | 'warning' | 'danger' | 'success' | 'info'> = {
  LOW: 'neutral',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'danger',
};

const USER_TYPE_LABEL: Record<SupportTicketUserType, string> = {
  BUYER: 'Buyer',
  SELLER: 'Seller',
  RIDER: 'Rider',
};

const QUICK_REPLY_TEMPLATES = [
  { label: 'Acknowledged', text: 'Thank you for reaching out. We have received your request and will look into it shortly.' },
  { label: 'Need more info', text: 'To help you further, could you please provide more details about your issue?' },
  { label: 'Resolved', text: 'We believe this issue has been resolved. If you need anything else, please reply to this ticket.' },
  { label: 'Escalated', text: 'Your ticket has been escalated to our specialist team. You will hear back within 24 hours.' },
];

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

export default function AdminSupport() {
  const [activeFilter, setActiveFilter] = useState<'all' | SupportTicketStatus | 'pending'>('all');
  const [search, setSearch] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [quickReplyOpen, setQuickReplyOpen] = useState(false);
  const [inboxFilter, setInboxFilter] = useState<'all' | 'admin' | 'system'>('all');
  const [sendNotificationOpen, setSendNotificationOpen] = useState(false);

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

  const filteredNotifications = useMemo(() => {
    if (!notifications) return [];
    if (inboxFilter === 'all') return notifications;
    if (inboxFilter === 'system') return notifications.filter((n) => n.type === 'SYSTEM');
    return notifications.filter((n) => n.type !== 'SYSTEM');
  }, [notifications, inboxFilter]);

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
                  description="Try adjusting filters or add a test ticket to get started."
                  action={
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSearch('');
                          setActiveFilter('all');
                          toast.success('Filters cleared.');
                        }}
                        className="rounded-full border border-[#2a2a2a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary"
                      >
                        Check filters
                      </button>
                      <button
                        type="button"
                        onClick={() => toast('Create-ticket API can be wired here when available.', { icon: '🎫' })}
                        className="rounded-full border border-primary bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:bg-primary hover:text-black"
                      >
                        Create a test ticket
                      </button>
                    </div>
                  }
                />
              ) : (
                <div className="space-y-3 overflow-y-auto">
                  {filteredTickets.map((ticket) => {
                    const priorityTag = PRIORITY_TAG[ticket.priority];
                    return (
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
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${priorityTag.className}`}
                          >
                            {priorityTag.label}
                          </span>
                          {ticket.userType ? (
                            <span className="inline-flex rounded-full border border-[#2a2a2a] bg-[#151515] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-300">
                              {USER_TYPE_LABEL[ticket.userType]}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-white line-clamp-1">{ticket.subject}</p>
                          <StatusBadge
                            tone={SUPPORT_STATUS_TONE[ticket.status] ?? 'neutral'}
                            label={SUPPORT_STATUS_LABEL[ticket.status] ?? ticket.status}
                          />
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs text-gray-400">{ticket.message}</p>
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                          <span>{formatRelativeTime(ticket.createdAt)}</span>
                          <span>{formatDateTime(ticket.createdAt)}</span>
                        </div>
                      </button>
                    );
                  })}
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
                    <StatusBadge tone={SUPPORT_STATUS_TONE[selectedTicket.status] ?? 'neutral'} label={SUPPORT_STATUS_LABEL[selectedTicket.status] ?? selectedTicket.status} />
                    <StatusBadge tone={PRIORITY_TONE[selectedTicket.priority] ?? 'neutral'} label={`${selectedTicket.priority} priority`} />
                    <StatusBadge tone="neutral" label={selectedTicket.category.toUpperCase()} />
                  </div>

                  <div className="rounded-2xl border border-[#1f1f1f] bg-[#151515] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Customer message</p>
                    <p className="mt-2 text-sm text-gray-200">{selectedTicket.message}</p>
                  </div>

                  <div className="rounded-2xl border border-[#1f1f1f] bg-[#151515] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuickReplyOpen((o) => !o)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-white hover:bg-[#1a1a1a] transition"
                    >
                      <span className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                        Quick-reply templates
                      </span>
                      {quickReplyOpen ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    {quickReplyOpen ? (
                      <div className="border-t border-[#1f1f1f] p-3 space-y-2">
                        {QUICK_REPLY_TEMPLATES.map((tpl) => (
                          <button
                            key={tpl.label}
                            type="button"
                            onClick={() => {
                              setNoteDraft((prev) => (prev ? `${prev}\n\n${tpl.text}` : tpl.text));
                            }}
                            className="w-full rounded-lg border border-[#2a2a2a] bg-[#111111] px-3 py-2 text-left text-xs text-gray-300 hover:border-primary/40 hover:text-white transition"
                          >
                            {tpl.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
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

          <section className="mb-10 rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold text-white">
                  Inbox
                  {(unreadCount ?? 0) > 0 ? (
                    <span className="ml-2 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-black">
                      {unreadCount}
                    </span>
                  ) : null}
                </h2>
                <div className="flex rounded-full border border-[#2a2a2a] bg-[#151515] p-0.5">
                  {(['all', 'admin', 'system'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setInboxFilter(f)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                        inboxFilter === f
                          ? 'bg-primary text-black'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {f === 'all' ? 'All' : f === 'admin' ? 'Admin only' : 'System'}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => markAllNotificationsRead.mutate(unreadNotificationIds.length ? unreadNotificationIds : undefined)}
                disabled={unreadNotificationIds.length === 0}
                className="rounded-full border border-[#2a2a2a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Mark all read
              </button>
            </div>

            <div className="space-y-3">
              {notificationsLoading ? (
                <LoadingState />
              ) : filteredNotifications.length === 0 ? (
                <AdminEmptyState title="No notifications" description="You haven't received any notifications yet." />
              ) : (
                filteredNotifications.map((notification: AdminNotification) => (
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
          </section>

          <section className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Send notification</h2>
              <button
                type="button"
                onClick={() => setSendNotificationOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-[#2a2a2a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary"
              >
                <Send className="h-4 w-4" />
                {sendNotificationOpen ? 'Hide form' : 'Compose'}
              </button>
            </div>
            {sendNotificationOpen ? (
              <form className="space-y-3" onSubmit={handleSendNotification}>
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
            ) : null}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}