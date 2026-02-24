import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  AdminCard,
  AdminDrawer,
  AdminEmptyState,
  AdminPageHeader,
  AdminToolbar,
  AdminFilterChip,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableContainer,
  DataTableHead,
  LoadingState,
  StatusBadge,
  AdminTableToolbar,
  useColumnVisibility,
  buildCSV,
  downloadBlob,
} from '../../components/admin/ui';
import type { AdminCardTrend } from '../../components/admin/ui';
import {
  useAdminRefunds,
  useRefundDetail,
  useRefundStats,
  useUpdateRefundStatus,
  useBulkApproveRefunds,
  type RefundStatus,
} from '../../lib/admin/hooks/useRefunds';
import { useAdminPayouts } from '../../lib/admin/hooks/usePayouts';
import { usePlatformSettings } from '../../lib/admin/hooks/useSettings';
import { useTableKeyboardNav } from '../../lib/admin/hooks/useTableKeyboardNav';
import { getStatusTone } from '../../lib/admin/statusTones';
import apiClient from '../../lib/api/client';
import { toast } from 'react-hot-toast';
import { formatNgnFromKobo } from '../../lib/api/utils';
import clsx from 'clsx';

const REFUND_FILTERS: Array<'ALL' | RefundStatus> = [
  'ALL',
  'REQUESTED',
  'APPROVED',
  'PROCESSING',
  'COMPLETED',
  'REJECTED',
];

const REFUND_TABLE_COLUMNS = [
  { id: 'refundId', label: 'Refund ID' },
  { id: 'orderId', label: 'Order ID' },
  { id: 'customer', label: 'Customer' },
  { id: 'seller', label: 'Seller' },
  { id: 'amount', label: 'Amount (₦)' },
  { id: 'reason', label: 'Reason' },
  { id: 'dateRequested', label: 'Date Requested' },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions' },
];

const STATUS_LABEL: Record<RefundStatus, string> = {
  REQUESTED: 'Requested',
  APPROVED: 'Approved',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
};

export default function AdminRefunds() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | RefundStatus>('REQUESTED');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRefundId, setSelectedRefundId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const queryParams = {
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
  };

  const { data, isLoading, isError, error, refetch, dataUpdatedAt } = useAdminRefunds(queryParams);
  const [tableColumns, setTableColumns] = useColumnVisibility(REFUND_TABLE_COLUMNS);
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const { data: stats } = useRefundStats();
  const { data: refundDetail } = useRefundDetail(selectedRefundId);
  const updateStatus = useUpdateRefundStatus();
  const bulkApprove = useBulkApproveRefunds();
  const { data: platformSettings } = usePlatformSettings();
  const { data: payoutRequests } = useAdminPayouts();

  const refunds = data?.refunds || [];
  const visibleCols = tableColumns.filter((c) => c.visible);
  const openDrawer = (refundId: string) => {
    setSelectedRefundId(refundId);
    setAdminNotes('');
  };
  const { getRowProps } = useTableKeyboardNav({
    rowCount: refunds.length,
    selectedIndex: selectedRowIndex,
    onSelectIndex: setSelectedRowIndex,
    onOpenRow: (index) => openDrawer(refunds[index]?.id ?? ''),
    enabled: refunds.length > 0,
  });

  const handleExportRefundsCSV = () => {
    const cols = visibleCols.filter((c) => c.id !== 'actions').map((c) => ({ id: c.id, label: c.label }));
    const rows = refunds.map((r) => ({
      refundId: r.id,
      orderId: r.orderId,
      customer: r.customerName ?? '',
      seller: r.sellerName ?? '—',
      amount: formatNgnFromKobo(r.amount),
      reason: r.reason,
      dateRequested: new Date(r.createdAt).toLocaleDateString(),
      status: STATUS_LABEL[r.status],
    }));
    const csv = buildCSV(cols, rows);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `refunds-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const refundThresholdKobo = platformSettings?.refundAutoApproveThresholdKobo ?? 50000;
  const refundThresholdNaira = refundThresholdKobo / 100;

  const paidOrderIds = useMemo(() => {
    const set = new Set<string>();
    for (const payout of payoutRequests ?? []) {
      if (payout.status !== 'PAID') continue;
      for (const earning of payout.earnings ?? []) {
        if (earning?.orderId) set.add(earning.orderId);
      }
    }
    return set;
  }, [payoutRequests]);

  const { data: refundOrder } = useQuery({
    queryKey: ['admin', 'order', refundDetail?.orderId],
    queryFn: async () => {
      if (!refundDetail?.orderId) return null;
      const { data } = await apiClient.get(`/orders/${refundDetail.orderId}`);
      return data as { id: string; paystackReference?: string | null };
    },
    enabled: Boolean(refundDetail?.orderId),
  });

  const pagination = data
    ? {
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
      }
    : undefined;

  const handleStatusUpdate = (refundId: string, status: RefundStatus, notes?: string) => {
    if ((status === 'APPROVED' || status === 'REJECTED') && !(notes || adminNotes).trim()) {
      toast.error('Please add notes before approving or rejecting.');
      return;
    }
    updateStatus.mutate(
      {
        refundId,
        status,
        adminNotes: notes || adminNotes || undefined,
      },
      {
        onSuccess: () => {
          setAdminNotes('');
          if (selectedRefundId === refundId) {
            setSelectedRefundId(null);
          }
        },
      }
    );
  };

  const formatResolutionTime = (hours: number | null) => {
    if (hours == null) return '—';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Refund Management"
            tag="Order Returns"
            subtitle="Review refund requests, approve or reject claims, and track payment processing."
          />

          {/* Stats Cards — 5 cards with trends; Pending has amber pulse when > 0 */}
          <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <AdminCard
              title="Total Refunds"
              description="Last 30 days"
              trend={
                stats
                  ? ({
                      change: stats.totalTrend,
                      positiveIsGood: true,
                      suffix: '%',
                    } satisfies AdminCardTrend)
                  : undefined
              }
            >
              <p className="text-3xl font-semibold text-white">{stats?.total ?? '—'}</p>
            </AdminCard>
            <AdminCard
              title="Pending Review"
              description="Awaiting approval"
              pulseBorder={Boolean(stats && stats.pending > 0)}
              trend={
                stats
                  ? ({
                      change: stats.pendingTrend,
                      positiveIsGood: false,
                      suffix: '%',
                    } satisfies AdminCardTrend)
                  : undefined
              }
            >
              <p className="text-3xl font-semibold text-[#ffb955]">{stats?.pending ?? '—'}</p>
            </AdminCard>
            <AdminCard
              title="Approved"
              description="Ready for processing"
              trend={
                stats
                  ? ({
                      change: stats.approvedTrend,
                      positiveIsGood: true,
                      suffix: '%',
                    } satisfies AdminCardTrend)
                  : undefined
              }
            >
              <p className="text-3xl font-semibold text-primary">{stats?.approved ?? '—'}</p>
            </AdminCard>
            <AdminCard
              title="Total Refunded"
              description="Completed (30d)"
              trend={
                stats
                  ? ({
                      change: stats.totalRefundedTrend,
                      positiveIsGood: false,
                      suffix: '%',
                    } satisfies AdminCardTrend)
                  : undefined
              }
            >
              <p className="text-3xl font-semibold text-green-500">
                {stats != null ? formatNgnFromKobo(stats.totalRefundedKobo) : '—'}
              </p>
            </AdminCard>
            <AdminCard title="Avg. Resolution Time" description="Request to completion">
              <p className="text-3xl font-semibold text-white">
                {stats != null ? formatResolutionTime(stats.avgResolutionHours) : '—'}
              </p>
            </AdminCard>
          </section>

          {/* Filter tabs */}
          <AdminToolbar className="mb-4 flex-wrap gap-4 justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Status:</span>
              {REFUND_FILTERS.map((status) => (
                <AdminFilterChip
                  key={status}
                  active={statusFilter === status}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'ALL' ? 'All Refunds' : STATUS_LABEL[status]}
                </AdminFilterChip>
              ))}
            </div>
          </AdminToolbar>

          {/* Search: Order ID, Customer, Seller, or Amount (₦) */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <input
              type="search"
              placeholder="Search by Order ID, Customer name, Seller name, or refund amount (₦)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-xl rounded-full border border-[#1f2432] bg-[#0e131d] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
            />
            {statusFilter === 'REQUESTED' && (
              <button
                type="button"
                onClick={() => bulkApprove.mutate({ thresholdKobo: refundThresholdKobo })}
                disabled={bulkApprove.isPending}
                className="rounded-full border border-amber-500/50 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-400 transition hover:bg-amber-500/20 disabled:opacity-50"
              >
                {bulkApprove.isPending ? 'Approving…' : `Bulk approve under ₦${refundThresholdNaira.toLocaleString()}`}
              </button>
            )}
          </div>

          {/* Refunds Table */}
          {isLoading ? (
            <LoadingState fullscreen />
          ) : isError ? (
            <AdminEmptyState
              title="Unable to load refunds"
              description={error instanceof Error ? error.message : 'Please try again later.'}
              action={
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="rounded-full border border-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:bg-primary hover:text-black"
                >
                  Retry
                </button>
              }
            />
          ) : refunds.length === 0 ? (
            <AdminEmptyState
              title="No refunds found"
              description={search ? 'Try adjusting your search query.' : 'No refunds match the selected filter.'}
            />
          ) : (
            <>
              <AdminTableToolbar
                columns={tableColumns}
                onColumnsChange={setTableColumns}
                onExportCSV={handleExportRefundsCSV}
                lastUpdatedAt={dataUpdatedAt}
                onRefresh={() => refetch()}
                isRefreshing={isLoading}
                className="mb-4"
              />
              <DataTableContainer>
                <DataTable>
                  <DataTableHead>
                    <tr>
                      {visibleCols.map((c) => (
                        <th
                          key={c.id}
                          className={c.id === 'actions' ? 'px-6 py-4 text-right text-gray-500' : 'px-6 py-4 text-left text-white'}
                        >
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {refunds.map((refund, index) => {
                      const rowProps = getRowProps(index);
                      const isSelected = rowProps['data-selected'];
                      return (
                        <tr
                          key={refund.id}
                          {...rowProps}
                          onClick={() => {
                            setSelectedRowIndex(index);
                            openDrawer(refund.id);
                          }}
                          className={clsx(
                            'cursor-pointer transition hover:bg-[#10151d]',
                            isSelected && 'bg-[#10151d] ring-1 ring-inset ring-primary/50'
                          )}
                        >
                          {visibleCols.some((c) => c.id === 'refundId') && (
                            <DataTableCell>
                              <span className="font-mono text-sm text-gray-300">
                                #{refund.id.slice(0, 8)}
                              </span>
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'orderId') && (
                            <DataTableCell>
                              <span className="font-mono text-sm text-white">
                                #{refund.orderId.slice(0, 8)}
                              </span>
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'customer') && (
                            <DataTableCell>
                              <div className="flex flex-col">
                                <span className="text-sm text-gray-200">{refund.customerName}</span>
                                <span className="text-xs text-gray-500">{refund.customerEmail}</span>
                              </div>
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'seller') && (
                            <DataTableCell>
                              <span className="text-sm text-gray-300">
                                {refund.sellerName ?? '—'}
                              </span>
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'amount') && (
                            <DataTableCell>
                              <span className="text-sm font-semibold text-primary">
                                {formatNgnFromKobo(refund.amount)}
                              </span>
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'reason') && (
                            <DataTableCell>
                              <p
                                title={refund.reason}
                                className="line-clamp-2 max-w-[200px] cursor-help text-sm text-gray-300"
                              >
                                {refund.reason}
                              </p>
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'dateRequested') && (
                            <DataTableCell>
                              <span className="text-sm text-gray-400">
                                {new Date(refund.createdAt).toLocaleDateString()}
                              </span>
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'status') && (
                            <DataTableCell>
                              <StatusBadge
                                tone={getStatusTone(refund.status)}
                                label={STATUS_LABEL[refund.status]}
                              />
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'actions') && (
                            <DataTableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openDrawer(refund.id)}
                              className="rounded-full border border-gray-700 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary"
                            >
                              Review
                            </button>
                            {refund.status === 'REQUESTED' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStatusUpdate(refund.id, 'APPROVED')}
                                  disabled={updateStatus.isPending}
                                  className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusUpdate(refund.id, 'REJECTED')}
                                  disabled={updateStatus.isPending}
                                  className="rounded-full border border-[#3a1f1f] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#ff9aa8] transition hover:border-[#ff9aa8] hover:text-[#ffb8c6] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {refund.status === 'APPROVED' && (
                              <button
                                type="button"
                                onClick={() => handleStatusUpdate(refund.id, 'PROCESSING')}
                                disabled={updateStatus.isPending}
                                className="rounded-full border border-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:bg-primary hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Mark Processing
                              </button>
                            )}
                            {refund.status === 'PROCESSING' && (
                              <button
                                type="button"
                                onClick={() => handleStatusUpdate(refund.id, 'COMPLETED')}
                                disabled={updateStatus.isPending}
                                className="rounded-full bg-green-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Mark Completed
                              </button>
                            )}
                          </div>
                            </DataTableCell>
                          )}
                        </tr>
                      );
                    })}
                  </DataTableBody>
                </DataTable>
              </DataTableContainer>

              {pagination && pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-gray-400">
                    Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, pagination.total)} of{' '}
                    {pagination.total} refunds
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-white transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === pagination.totalPages}
                      className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-white transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Refund Detail Drawer: order details, buyer reason + evidence, seller response, mandatory notes, actions */}
      <AdminDrawer
        open={Boolean(selectedRefundId)}
        onClose={() => {
          setSelectedRefundId(null);
          setAdminNotes('');
        }}
        title={refundDetail ? `Refund #${refundDetail.id.slice(0, 8)}` : 'Refund Details'}
        description={refundDetail ? STATUS_LABEL[refundDetail.status] : ''}
        footer={
          refundDetail && refundDetail.status === 'REQUESTED' ? (
            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={() => handleStatusUpdate(refundDetail.id, 'REJECTED', adminNotes)}
                disabled={updateStatus.isPending || !adminNotes.trim()}
                className="rounded-full border border-[#3a1f1f] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#ff9aa8] transition hover:border-[#ff9aa8] hover:text-[#ffb8c6] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => handleStatusUpdate(refundDetail.id, 'APPROVED', adminNotes)}
                disabled={updateStatus.isPending || !adminNotes.trim()}
                className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
              >
                Approve Refund
              </button>
            </div>
          ) : null
        }
      >
        {refundDetail ? (
          <div className="space-y-6 text-sm text-gray-300">
            {/* Original order details */}
            <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Original Order
              </p>
              <div className="mt-2 space-y-2">
                <p className="font-mono text-sm text-white">Order ID: {refundDetail.orderId}</p>
                <p className="text-white">
                  Amount: {refundDetail.orderAmount != null ? formatNgnFromKobo(refundDetail.orderAmount) : '—'}
                </p>
                {refundDetail.order?.items?.length ? (
                  <ul className="mt-2 space-y-1">
                    {refundDetail.order.items.map((item: any, idx: number) => (
                      <li key={idx} className="flex items-center gap-2 text-gray-200">
                        <span className="flex-1">{item.product?.title ?? 'Product'}</span>
                        <span className="text-gray-400">×{item.quantity}</span>
                        <span className="text-primary">{formatNgnFromKobo(item.price * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>

            {/* Buyer reason + evidence photos placeholder */}
            <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Buyer&apos;s Reason
              </p>
              <p className="mt-2 text-gray-200">{refundDetail.reason}</p>
              {/* Evidence photos: schema doesn't have yet — placeholder */}
              <p className="mt-2 text-xs text-gray-500">Evidence photos (when supported) will appear here.</p>
            </div>

            {/* Seller response placeholder */}
            <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Seller Response
              </p>
              <p className="mt-2 text-gray-500 italic">
                {refundDetail.sellerName ? 'No seller response yet.' : 'N/A'}
              </p>
            </div>

            {/* Status & amounts */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Refund Amount</p>
                <p className="mt-2 text-2xl font-bold text-primary">
                  {formatNgnFromKobo(refundDetail.amount)}
                </p>
              </div>
              <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Status</p>
                <StatusBadge
                  tone={getStatusTone(refundDetail.status)}
                  label={STATUS_LABEL[refundDetail.status]}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Paystack Reference */}
            <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Paystack Reference</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="font-mono text-sm text-white">
                  {refundOrder?.paystackReference ?? 'Not available yet'}
                </p>
                {refundOrder?.paystackReference ? (
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(refundOrder.paystackReference as string)}
                    className="rounded-full border border-gray-700 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary"
                  >
                    Copy
                  </button>
                ) : null}
              </div>
            </div>

            {/* Customer */}
            <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Customer</p>
              <p className="mt-2 text-sm font-semibold text-white">{refundDetail.customerName}</p>
              <p className="text-xs text-gray-400">{refundDetail.customerEmail}</p>
            </div>

            {/* Mandatory admin notes before Approve/Reject */}
            <div>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Admin Notes <span className="text-amber-400">(required to approve or reject)</span>
                </span>
                <textarea
                  value={adminNotes || (refundDetail.status !== 'REQUESTED' ? refundDetail.adminNotes || '' : '')}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes before approving or rejecting..."
                  disabled={refundDetail.status === 'COMPLETED' || refundDetail.status === 'REJECTED'}
                  className="min-h-[100px] rounded-lg border border-gray-700 bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none disabled:opacity-50"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div>
                <span className="font-semibold uppercase tracking-[0.16em]">Requested</span>
                <p className="mt-1 text-sm text-white">
                  {new Date(refundDetail.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="font-semibold uppercase tracking-[0.16em]">Updated</span>
                <p className="mt-1 text-sm text-white">
                  {new Date(refundDetail.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <LoadingState label="Loading refund details..." />
        )}
      </AdminDrawer>
    </AdminLayout>
  );
}
