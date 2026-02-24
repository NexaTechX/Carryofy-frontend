import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import { AdminPageHeader, LoadingState, AdminEmptyState } from '../../components/admin/ui';
import {
  getBroadcastHistory,
  getBroadcastDetails,
  getBroadcastStats,
  cancelBroadcast,
  bulkDeleteBroadcasts,
} from '../../lib/admin/api';
import type {
  BroadcastHistoryQuery,
  BroadcastListItem,
  BroadcastStatus,
  BroadcastType,
} from '../../lib/admin/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Bell,
  X,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Ban,
  FileText,
  Copy,
  Trash2,
  Download,
  SendIcon,
  Megaphone,
  Zap,
  Info,
  Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDateTime, formatDate } from '../../lib/api/utils';

const STATUS_CONFIG: Record<BroadcastStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  DRAFT: { label: 'Draft', color: 'text-gray-400', bg: 'bg-gray-500/10', icon: FileText },
  SCHEDULED: { label: 'Scheduled', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Clock },
  SENDING: { label: 'Sending', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Send },
  SENT: { label: 'Sent', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  FAILED: { label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertCircle },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-500', bg: 'bg-gray-500/10', icon: Ban },
};

const TYPE_LABELS: Record<BroadcastType, string> = {
  PRODUCT_LAUNCH: 'Product Launch',
  PROMOTION: 'Promotion',
  SYSTEM_UPDATE: 'System Update',
  OPERATIONAL_NOTICE: 'Operational Notice',
  URGENT_ALERT: 'Urgent Alert',
};

const TYPE_ICONS: Record<BroadcastType, typeof Megaphone> = {
  PRODUCT_LAUNCH: Megaphone,
  PROMOTION: Tag,
  SYSTEM_UPDATE: Info,
  OPERATIONAL_NOTICE: Zap,
  URGENT_ALERT: AlertCircle,
};

const AUDIENCE_OPTIONS = [
  { value: '', label: 'All audiences' },
  { value: 'BUYER', label: 'Buyers' },
  { value: 'SELLER', label: 'Sellers' },
  { value: 'RIDER', label: 'Riders' },
];

function downloadCSV(rows: BroadcastListItem[]) {
  const headers = [
    'Title',
    'Type',
    'Audience',
    'Sent date',
    'Channel',
    'Delivery count',
    'Open rate (%)',
    'Status',
  ];
  const lines = [
    headers.join(','),
    ...rows.map((b) => {
      const openRate =
        b.sentEmail > 0 && b.emailOpens != null
          ? ((b.emailOpens / b.sentEmail) * 100).toFixed(1)
          : '0';
      const channel = [b.channels?.email && 'Email', b.channels?.inApp && 'In-App']
        .filter(Boolean)
        .join(' + ');
      const sentDate = b.sentAt
        ? formatDateTime(b.sentAt)
        : b.createdAt
          ? formatDateTime(b.createdAt)
          : '';
      return [
        `"${(b.subject || '').replace(/"/g, '""')}"`,
        TYPE_LABELS[b.type] || b.type,
        `"${(b.audience || []).join(', ')}"`,
        sentDate,
        channel,
        String((b.sentEmail || 0) + (b.sentInApp || 0)),
        openRate,
        STATUS_CONFIG[b.status]?.label || b.status,
      ].join(',');
    }),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `broadcast-history-${formatDate(new Date(), { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BroadcastHistoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<BroadcastHistoryQuery>({
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState('');
  const [selectedBroadcast, setSelectedBroadcast] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'broadcast-stats'],
    queryFn: getBroadcastStats,
  });

  const { data: history, isLoading } = useQuery({
    queryKey: ['admin', 'broadcast-history', filters],
    queryFn: () => getBroadcastHistory(filters),
  });

  const { data: broadcastDetails } = useQuery({
    queryKey: ['admin', 'broadcast-details', selectedBroadcast],
    queryFn: () => getBroadcastDetails(selectedBroadcast!),
    enabled: !!selectedBroadcast,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelBroadcast(id),
    onSuccess: () => {
      toast.success('Broadcast cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'broadcast-history'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'broadcast-stats'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to cancel broadcast');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteBroadcasts(ids),
    onSuccess: (result) => {
      toast.success(`Deleted ${result.deleted} broadcast(s)`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin', 'broadcast-history'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'broadcast-stats'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Bulk delete failed');
    },
  });

  const handleFilterChange = (key: keyof BroadcastHistoryQuery, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const applySearch = () => {
    handleFilterChange('search', searchInput.trim() || undefined);
  };

  const broadcasts = history?.broadcasts ?? [];
  const total = history?.total ?? 0;
  const totalPages = history?.totalPages ?? 0;
  const page = history?.page ?? 1;
  const allSelected = broadcasts.length > 0 && selectedIds.size === broadcasts.length;
  const someSelected = selectedIds.size > 0;
  const deletableSelected = useMemo(
    () => broadcasts.filter((b) => selectedIds.has(b.id) && ['DRAFT', 'CANCELLED', 'FAILED'].includes(b.status)),
    [broadcasts, selectedIds],
  );

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(broadcasts.map((b) => b.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (deletableSelected.length === 0) {
      toast.error('Only Draft, Cancelled, or Failed broadcasts can be deleted');
      return;
    }
    if (!confirm(`Delete ${deletableSelected.length} broadcast(s)?`)) return;
    bulkDeleteMutation.mutate(deletableSelected.map((b) => b.id));
  };

  const handleExportCSV = () => {
    if (broadcasts.length === 0) {
      toast.error('No data to export');
      return;
    }
    downloadCSV(broadcasts);
    toast.success('CSV downloaded');
  };

  const handleExportPDF = () => {
    if (broadcasts.length === 0) {
      toast.error('No data to export');
      return;
    }
    window.print();
  };

  const handleResend = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toast('Resend will open in a future update', { icon: '📬' });
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push('/admin/broadcast');
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Broadcast History"
            subtitle="View and manage all broadcast messages"
          />

          {/* Summary stats bar */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 animate-pulse"
                >
                  <div className="h-4 w-20 rounded bg-white/10 mb-2" />
                  <div className="h-7 w-16 rounded bg-white/10" />
                </div>
              ))
            ) : (
              <>
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Total Broadcasts
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-white">
                    {stats?.totalBroadcasts ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Open Rate
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-white">
                    {stats?.averageOpenRate != null ? `${stats.averageOpenRate}%` : '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Delivery Success Rate
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-white">
                    {stats?.deliverySuccessRate != null ? `${stats.deliverySuccessRate}%` : '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Last Broadcast
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {stats?.lastBroadcastAt
                      ? formatDate(stats.lastBroadcastAt, { dateStyle: 'medium' })
                      : '—'}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Filters + search + bulk actions */}
          <div className="mb-4 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-gray-100 focus:border-primary/60 focus:outline-none"
              >
                <option value="">All Status</option>
                {Object.keys(STATUS_CONFIG).map((status) => (
                  <option key={status} value={status}>
                    {STATUS_CONFIG[status as BroadcastStatus].label}
                  </option>
                ))}
              </select>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-gray-100 focus:border-primary/60 focus:outline-none"
              >
                <option value="">All Types</option>
                {Object.keys(TYPE_LABELS).map((type) => (
                  <option key={type} value={type}>
                    {TYPE_LABELS[type as BroadcastType]}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-gray-100 focus:border-primary/60 focus:outline-none"
                placeholder="Start"
              />
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-gray-100 focus:border-primary/60 focus:outline-none"
                placeholder="End"
              />
              <select
                value={filters.audience || ''}
                onChange={(e) => handleFilterChange('audience', e.target.value || undefined)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-gray-100 focus:border-primary/60 focus:outline-none"
              >
                {AUDIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value || 'all'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="flex flex-1 min-w-[200px] max-w-sm">
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                  placeholder="Search title or content…"
                  className="flex-1 rounded-l-xl border border-white/[0.08] border-r-0 bg-white/[0.03] px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:border-primary/60 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={applySearch}
                  className="rounded-r-xl border border-white/[0.08] bg-white/[0.05] px-4 py-2.5 text-sm text-gray-300 hover:bg-white/[0.08]"
                >
                  Search
                </button>
              </div>
            </div>

            {someSelected && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2">
                <span className="text-sm text-gray-400">
                  {selectedIds.size} selected
                </span>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={deletableSelected.length === 0 || bulkDeleteMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Bulk delete
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Clear selection
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={broadcasts.length === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-gray-300 hover:bg-white/[0.05] disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={broadcasts.length === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-gray-300 hover:bg-white/[0.05] disabled:opacity-50"
              >
                <FileText className="h-4 w-4" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <LoadingState label="Loading broadcast history…" />
          ) : !broadcasts.length ? (
            <AdminEmptyState
              title="No broadcasts yet"
              description="Create your first broadcast to notify buyers, sellers, or riders."
              icon={<SendIcon className="h-6 w-6 text-primary" />}
              action={
                <Link
                  href="/admin/broadcast"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110"
                >
                  Create Your First Broadcast
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <table className="w-full">
                <thead className="border-b border-white/[0.06]">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/30"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Audience</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Sent date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Channel</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Delivery</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Open rate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {broadcasts.map((broadcast) => {
                    const statusConfig = STATUS_CONFIG[broadcast.status];
                    const StatusIcon = statusConfig.icon;
                    const TypeIcon = TYPE_ICONS[broadcast.type] ?? Megaphone;
                    const openRate =
                      broadcast.sentEmail > 0 && broadcast.emailOpens != null
                        ? ((broadcast.emailOpens / broadcast.sentEmail) * 100).toFixed(1)
                        : '0';
                    const deliveryCount = (broadcast.sentEmail || 0) + (broadcast.sentInApp || 0);
                    const sentDate = broadcast.sentAt ?? broadcast.createdAt;

                    return (
                      <tr
                        key={broadcast.id}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(broadcast.id)}
                            onChange={() => toggleSelect(broadcast.id)}
                            className="h-4 w-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/30"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.06] text-gray-400">
                            <TypeIcon className="h-4 w-4" />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-white line-clamp-2 max-w-[200px]">
                            {broadcast.subject || 'Untitled'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(broadcast.audience || []).map((role) => (
                              <span
                                key={role}
                                className="px-2 py-0.5 text-xs rounded-md bg-primary/10 text-primary capitalize"
                              >
                                {role.toLowerCase()}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {sentDate ? formatDateTime(sentDate) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {broadcast.channels?.email && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.06] text-xs text-gray-400">
                                <Mail className="h-3.5 w-3.5" /> Email
                              </span>
                            )}
                            {broadcast.channels?.inApp && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.06] text-xs text-gray-400">
                                <Bell className="h-3.5 w-3.5" /> In-App
                              </span>
                            )}
                            {!broadcast.channels?.email && !broadcast.channels?.inApp && '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-300">
                          {deliveryCount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-300">
                          {broadcast.status === 'SENT' ? `${openRate}%` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}
                          >
                            <StatusIcon className="h-3.5 w-3.5" />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBroadcast(broadcast.id);
                              }}
                              className="p-2 rounded-lg hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleResend(e, broadcast.id)}
                              className="p-2 rounded-lg hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors"
                              title="Resend"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={handleDuplicate}
                              className="p-2 rounded-lg hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors"
                              title="Duplicate"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            {broadcast.status === 'SCHEDULED' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Cancel this scheduled broadcast?')) {
                                    cancelMutation.mutate(broadcast.id);
                                  }
                                }}
                                className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm text-gray-400">
                Page {page} of {totalPages} ({total} total)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleFilterChange('page', (filters.page || 1) - 1)}
                  disabled={page === 1}
                  className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-gray-300 hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('page', (filters.page || 1) + 1)}
                  disabled={page >= totalPages}
                  className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-gray-300 hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedBroadcast && broadcastDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-2xl border border-white/[0.08] bg-[#0e1117] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Broadcast Details</h3>
              <button
                type="button"
                onClick={() => setSelectedBroadcast(null)}
                className="text-gray-500 hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Type</span>
                  <p className="font-medium text-white mt-0.5">
                    {TYPE_LABELS[broadcastDetails.type as BroadcastType] ?? broadcastDetails.type}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Status</span>
                  <p className="font-medium text-white mt-0.5">{broadcastDetails.status}</p>
                </div>
                <div>
                  <span className="text-gray-500">Subject</span>
                  <p className="text-white mt-0.5">{broadcastDetails.subject}</p>
                </div>
                <div>
                  <span className="text-gray-500">Sent By</span>
                  <p className="text-white mt-0.5">{broadcastDetails.sentByName || '—'}</p>
                </div>
              </div>

              {broadcastDetails.analytics && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <h4 className="mb-4 text-sm font-semibold text-white">Performance Analytics</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Email Open Rate</span>
                      <p className="text-white font-medium mt-0.5">
                        {broadcastDetails.analytics.emailOpenRate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Email Click Rate</span>
                      <p className="text-white font-medium mt-0.5">
                        {broadcastDetails.analytics.emailClickRate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">In-App Read Rate</span>
                      <p className="text-white font-medium mt-0.5">
                        {broadcastDetails.analytics.inAppReadRate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Failed</span>
                      <p className="text-white font-medium mt-0.5">
                        {broadcastDetails.analytics.failed}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
