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
} from '../../components/admin/ui';
import {
  useAdminRefunds,
  useRefundDetail,
  useUpdateRefundStatus,
  type AdminRefund,
  type RefundStatus,
} from '../../lib/admin/hooks/useRefunds';
import { useAdminPayouts } from '../../lib/admin/hooks/usePayouts';
import apiClient from '../../lib/api/client';
import { toast } from 'react-hot-toast';
import { formatNgnFromKobo } from '../../lib/api/utils';

const REFUND_FILTERS: Array<'ALL' | RefundStatus> = [
  'ALL',
  'REQUESTED',
  'APPROVED',
  'PROCESSING',
  'COMPLETED',
  'REJECTED',
];

const STATUS_TONE: Record<RefundStatus, 'warning' | 'info' | 'success' | 'danger'> = {
  REQUESTED: 'warning',
  APPROVED: 'info',
  PROCESSING: 'info',
  COMPLETED: 'success',
  REJECTED: 'danger',
};

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

  const { data, isLoading, isError, error, refetch } = useAdminRefunds(queryParams);
  const { data: refundDetail } = useRefundDetail(selectedRefundId);
  const updateStatus = useUpdateRefundStatus();
  const { data: payoutRequests } = useAdminPayouts();

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

  const refunds = data?.refunds || [];
  const pagination = data
    ? {
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
      }
    : undefined;

  // Calculate stats
  const totalRefunds = pagination?.total || 0;
  const pendingRefunds = refunds.filter((r) => r.status === 'REQUESTED').length;
  const approvedRefunds = refunds.filter((r) => r.status === 'APPROVED').length;
  const totalRefundedAmount = refunds
    .filter((r) => r.status === 'COMPLETED')
    .reduce((sum, r) => sum + r.amount, 0);

  const handleStatusUpdate = (refundId: string, status: RefundStatus, notes?: string) => {
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

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Refund Management"
            tag="Order Returns"
            subtitle="Review refund requests, approve or reject claims, and track payment processing."
          />

          {/* Stats Cards */}
          <section className="mb-10 grid gap-4 sm:grid-cols-4">
            <AdminCard title="Total Refunds" description="All refund requests">
              <p className="text-3xl font-semibold text-white">{totalRefunds}</p>
            </AdminCard>
            <AdminCard title="Pending Review" description="Awaiting approval">
              <p className="text-3xl font-semibold text-[#ffb955]">{pendingRefunds}</p>
            </AdminCard>
            <AdminCard title="Approved" description="Ready for processing">
              <p className="text-3xl font-semibold text-primary">{approvedRefunds}</p>
            </AdminCard>
            <AdminCard title="Total Refunded" description="Completed refunds">
              <p className="text-3xl font-semibold text-green-500">
                {formatNgnFromKobo(totalRefundedAmount)}
              </p>
            </AdminCard>
          </section>

          {/* Filters and Search */}
          <AdminToolbar className="mb-6 flex-wrap gap-4 justify-between">
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
            <input
              type="search"
              placeholder="Search by order ID or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-full border border-[#1f2432] bg-[#0e131d] px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
            />
          </AdminToolbar>

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
              <DataTableContainer>
                <DataTable>
                  <DataTableHead>
                    <tr>
                      <th className="px-6 py-4 text-left text-white">Order</th>
                      <th className="px-6 py-4 text-left text-white">Customer</th>
                      <th className="px-6 py-4 text-left text-white">Amount</th>
                      <th className="px-6 py-4 text-left text-white">Reason</th>
                      <th className="px-6 py-4 text-left text-white">Status</th>
                      <th className="px-6 py-4 text-left text-white">Impact</th>
                      <th className="px-6 py-4 text-right text-gray-500">Actions</th>
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {refunds.map((refund) => (
                      <tr key={refund.id} className="transition hover:bg-[#10151d]">
                        <DataTableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">
                              #{refund.orderId.slice(0, 8)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(refund.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </DataTableCell>
                        <DataTableCell>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-200">{refund.customerName}</span>
                            <span className="text-xs text-gray-500">{refund.customerEmail}</span>
                          </div>
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-sm font-semibold text-primary">
                            {formatNgnFromKobo(refund.amount)}
                          </span>
                        </DataTableCell>
                        <DataTableCell>
                          <p className="line-clamp-2 max-w-xs text-sm text-gray-300">{refund.reason}</p>
                        </DataTableCell>
                        <DataTableCell>
                          <StatusBadge
                            tone={STATUS_TONE[refund.status]}
                            label={STATUS_LABEL[refund.status]}
                          />
                        </DataTableCell>
                        <DataTableCell>
                          {refund.status === 'COMPLETED' ? (
                            paidOrderIds.has(refund.orderId) ? (
                              <StatusBadge tone="danger" label="Reversal" />
                            ) : (
                              <StatusBadge tone="info" label="Adjusts earnings" />
                            )
                          ) : (
                            <span className="text-xs text-gray-500">—</span>
                          )}
                        </DataTableCell>
                        <DataTableCell className="text-right">
                          <div className="flex justify-end gap-2">
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
                            <button
                              type="button"
                              onClick={() => setSelectedRefundId(refund.id)}
                              className="rounded-full border border-gray-700 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary"
                            >
                              View
                            </button>
                          </div>
                        </DataTableCell>
                      </tr>
                    ))}
                  </DataTableBody>
                </DataTable>
              </DataTableContainer>

              {/* Pagination */}
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

      {/* Refund Detail Drawer */}
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
                disabled={updateStatus.isPending}
                className="rounded-full border border-[#3a1f1f] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#ff9aa8] transition hover:border-[#ff9aa8] hover:text-[#ffb8c6] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => handleStatusUpdate(refundDetail.id, 'APPROVED', adminNotes)}
                disabled={updateStatus.isPending}
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
            {/* Refund Info */}
            <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Status</p>
              <StatusBadge
                tone={STATUS_TONE[refundDetail.status]}
                label={STATUS_LABEL[refundDetail.status]}
                className="mt-2"
              />
            </div>

            {/* Amount Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Refund Amount
                </p>
                <p className="mt-2 text-2xl font-bold text-primary">
                  {formatNgnFromKobo(refundDetail.amount)}
                </p>
              </div>
              <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Order Amount
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {refundDetail.orderAmount ? formatNgnFromKobo(refundDetail.orderAmount) : '—'}
                </p>
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

            {/* Customer Info */}
            <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Customer</p>
              <p className="mt-2 text-sm font-semibold text-white">{refundDetail.customerName}</p>
              <p className="text-xs text-gray-400">{refundDetail.customerEmail}</p>
            </div>

            {/* Order ID */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Order ID</p>
              <p className="mt-1 font-mono text-sm text-white">{refundDetail.orderId}</p>
            </div>

            {/* Reason */}
            <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Customer Reason
              </p>
              <p className="mt-2 text-sm text-gray-200">{refundDetail.reason}</p>
            </div>

            {/* Admin Notes */}
            <div>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Admin Notes
                </span>
                <textarea
                  value={adminNotes || refundDetail.adminNotes || ''}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  disabled={refundDetail.status === 'COMPLETED' || refundDetail.status === 'REJECTED'}
                  className="min-h-[100px] rounded-lg border border-gray-700 bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none disabled:opacity-50"
                />
              </label>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div>
                <span className="font-semibold uppercase tracking-[0.16em]">Created</span>
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

