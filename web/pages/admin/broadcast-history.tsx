import { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import { AdminPageHeader, LoadingState } from '../../components/admin/ui';
import {
  getBroadcastHistory,
  getBroadcastDetails,
  cancelBroadcast,
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
  Calendar,
  Users,
  TrendingUp,
  X,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Ban,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDateTime } from '../../lib/api/utils';

const STATUS_CONFIG: Record<BroadcastStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  DRAFT: { label: 'Draft', color: 'text-gray-400', icon: FileText },
  SCHEDULED: { label: 'Scheduled', color: 'text-blue-400', icon: Clock },
  SENDING: { label: 'Sending', color: 'text-amber-400', icon: Send },
  SENT: { label: 'Sent', color: 'text-emerald-400', icon: CheckCircle2 },
  FAILED: { label: 'Failed', color: 'text-red-400', icon: AlertCircle },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-500', icon: Ban },
};

const TYPE_LABELS: Record<BroadcastType, string> = {
  PRODUCT_LAUNCH: 'Product Launch',
  PROMOTION: 'Promotion',
  SYSTEM_UPDATE: 'System Update',
  OPERATIONAL_NOTICE: 'Operational Notice',
  URGENT_ALERT: 'Urgent Alert',
};

export default function BroadcastHistoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<BroadcastHistoryQuery>({
    page: 1,
    limit: 20,
  });
  const [selectedBroadcast, setSelectedBroadcast] = useState<string | null>(null);

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
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to cancel broadcast');
    },
  });

  const handleFilterChange = (key: keyof BroadcastHistoryQuery, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Broadcast History"
            subtitle="View and manage all broadcast messages"
          />

          {/* Filters */}
          <div className="mb-6 grid gap-4 sm:grid-cols-4">
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
              placeholder="Start date"
            />
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-gray-100 focus:border-primary/60 focus:outline-none"
              placeholder="End date"
            />
          </div>

          {/* Table */}
          {isLoading ? (
            <LoadingState label="Loading broadcast history…" />
          ) : !history?.broadcasts.length ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] py-12 text-center">
              <Mail className="mb-2 h-8 w-8 text-gray-600" />
              <p className="text-sm text-gray-500">No broadcasts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <table className="w-full">
                <thead className="border-b border-white/[0.06]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Audience</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Channels</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Recipients</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Performance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Sent At</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {history.broadcasts.map((broadcast) => {
                    const statusConfig = STATUS_CONFIG[broadcast.status];
                    const StatusIcon = statusConfig.icon;
                    const emailOpenRate =
                      broadcast.sentEmail > 0 && broadcast.emailOpens
                        ? ((broadcast.emailOpens / broadcast.sentEmail) * 100).toFixed(1)
                        : '0';
                    const emailClickRate =
                      broadcast.sentEmail > 0 && broadcast.emailClicks
                        ? ((broadcast.emailClicks / broadcast.sentEmail) * 100).toFixed(1)
                        : '0';

                    return (
                      <tr
                        key={broadcast.id}
                        className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                        onClick={() => setSelectedBroadcast(broadcast.id)}
                      >
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-300">
                            {TYPE_LABELS[broadcast.type] || broadcast.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                            <span className={`text-sm ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {broadcast.audience.map((role) => (
                              <span
                                key={role}
                                className="px-2 py-0.5 text-xs rounded bg-white/[0.05] text-gray-400 capitalize"
                              >
                                {role.toLowerCase()}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {broadcast.channels.email && (
                              <span title="Email">
                                <Mail className="h-4 w-4 text-gray-400" />
                              </span>
                            )}
                            {broadcast.channels.inApp && (
                              <span title="In-App">
                                <Bell className="h-4 w-4 text-gray-400" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-300">
                            {broadcast.recipientCount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {broadcast.status === 'SENT' ? (
                            <div className="text-xs text-gray-400">
                              <div>Opens: {emailOpenRate}%</div>
                              <div>Clicks: {emailClickRate}%</div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-400">
                            {broadcast.sentAt ? formatDateTime(broadcast.sentAt) : formatDateTime(broadcast.createdAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBroadcast(broadcast.id);
                              }}
                              className="p-1.5 rounded-lg hover:bg-white/[0.05] text-gray-400 hover:text-white transition-colors"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
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
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
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
          {history && history.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm text-gray-400">
                Page {history.page} of {history.totalPages} ({history.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleFilterChange('page', (filters.page || 1) - 1)}
                  disabled={history.page === 1}
                  className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-gray-300 hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('page', (filters.page || 1) + 1)}
                  disabled={history.page >= history.totalPages}
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
              {/* Basic info */}
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

              {/* Analytics */}
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
