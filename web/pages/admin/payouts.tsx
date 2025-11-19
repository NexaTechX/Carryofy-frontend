import { useMemo, useState } from 'react';
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
import { useAdminDashboard } from '../../lib/admin/hooks/useAdminDashboard';
import {
  useAdminPayouts,
  useApprovePayoutMutation,
  useProcessPayoutMutation,
  useRejectPayoutMutation,
} from '../../lib/admin/hooks/usePayouts';
import { AdminPayout, ProcessPayoutPayload, PayoutStatus } from '../../lib/admin/types';
import { toast } from 'react-hot-toast';

const payoutStatusTone: Record<PayoutStatus, 'warning' | 'success' | 'danger' | 'neutral'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  PAID: 'success',
  REJECTED: 'danger',
};

const payoutStatusLabel: Record<PayoutStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  PAID: 'Paid',
  REJECTED: 'Rejected',
};

const NGN = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

const PAYOUT_FILTERS: Array<'ALL' | PayoutStatus> = ['ALL', 'PENDING', 'APPROVED', 'PAID', 'REJECTED'];

export default function AdminPayouts() {
  const [filter, setFilter] = useState<'ALL' | PayoutStatus>('PENDING');
  const [selectedPayout, setSelectedPayout] = useState<AdminPayout | null>(null);
  const [processForm, setProcessForm] = useState<ProcessPayoutPayload>({
    bankAccount: '',
    bankCode: '',
    accountName: '',
  });

  const { data: dashboardData, isLoading: metricsLoading } = useAdminDashboard();
  const { data: payouts, isLoading: payoutsLoading, isError: payoutsError, error: payoutsErrorObj, refetch } =
    useAdminPayouts();

  const approvePayout = useApprovePayoutMutation();
  const rejectPayout = useRejectPayoutMutation();
  const processPayout = useProcessPayoutMutation();

  const filteredPayouts = useMemo(() => {
    if (!payouts) return [];
    if (filter === 'ALL') return payouts;
    return payouts.filter((payout) => payout.status === filter);
  }, [payouts, filter]);

  const metrics = dashboardData?.metrics;
  const totalRevenue = metrics ? metrics.totalRevenue / 100 : 0;
  const totalCommission = metrics ? metrics.totalCommissions / 100 : 0;
  const totalPayouts = payouts
    ?.filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + p.net / 100, 0) ?? 0;
  const pendingPayouts = payouts?.filter((p) => p.status === 'PENDING' || p.status === 'APPROVED') ?? [];
  const totalPendingAmount = pendingPayouts.reduce((sum, p) => sum + p.net / 100, 0);

  const handleApprove = (payout: AdminPayout) => {
    approvePayout.mutate(payout.id, {
      onSuccess: () => {
        toast.success('Payout approved successfully');
        setSelectedPayout((current) =>
          current && current.id === payout.id ? { ...current, status: 'APPROVED' } : current
        );
      },
    });
  };

  const handleReject = (payout: AdminPayout) => {
    rejectPayout.mutate(payout.id, {
      onSuccess: () => {
        toast.success('Payout rejected');
        setSelectedPayout((current) =>
          current && current.id === payout.id ? { ...current, status: 'REJECTED' } : current
        );
      },
    });
  };

  const handleProcessSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPayout) return;
    await processPayout.mutateAsync({ payoutId: selectedPayout.id, payload: processForm });
    setProcessForm({ bankAccount: '', bankCode: '', accountName: '' });
    setSelectedPayout(null);
  };

  const exportCsv = () => {
    if (!payouts || payouts.length === 0) {
      toast.error('No payout data to export');
      return;
    }

    const headers = ['Seller ID', 'Order ID', 'Gross', 'Commission', 'Net', 'Status', 'Created At'];
    const rows = payouts.map((p) => [
      p.sellerId,
      p.orderId,
      (p.gross / 100).toFixed(2),
      (p.commission / 100).toFixed(2),
      (p.net / 100).toFixed(2),
      p.status,
      new Date(p.createdAt).toLocaleString(),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payouts-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Payouts & Seller Settlements"
            tag="Marketplace Payments"
            subtitle="Track seller payouts, approve withdrawals, and manage payment processing."
          />

          {metricsLoading ? (
            <LoadingState fullscreen />
          ) : metrics ? (
            <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <AdminCard title="Total Sales" description="Lifetime order revenue">
                <p className="text-3xl font-semibold text-white">{NGN.format(totalRevenue)}</p>
              </AdminCard>
              <AdminCard title="Commissions" description="Carryofy fees collected">
                <p className="text-3xl font-semibold text-primary">{NGN.format(totalCommission)}</p>
              </AdminCard>
              <AdminCard title="Payouts" description="Total paid to sellers">
                <p className="text-3xl font-semibold text-[#6ce7a2]">{NGN.format(totalPayouts)}</p>
              </AdminCard>
              <AdminCard title="Net Balance" description="Pending payouts">
                <p className="text-3xl font-semibold text-[#ffd700]">{NGN.format(totalPendingAmount)}</p>
              </AdminCard>
            </section>
          ) : null}

          <section className="mb-8 rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Payout Requests</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Pending: {pendingPayouts.length} • Total pending amount: {NGN.format(totalPendingAmount)}
                </p>
              </div>
              <button
                onClick={exportCsv}
                disabled={!payouts || payouts.length === 0}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-black transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
              >
                Export CSV
              </button>
            </div>

            <AdminToolbar className="gap-2">
              {PAYOUT_FILTERS.map((status) => (
                <AdminFilterChip key={status} active={filter === status} onClick={() => setFilter(status)}>
                  {status === 'ALL' ? 'All payouts' : payoutStatusLabel[status]}
                </AdminFilterChip>
              ))}
            </AdminToolbar>

            {payoutsLoading ? (
              <LoadingState />
            ) : payoutsError ? (
              <AdminEmptyState
                title="Unable to load payouts"
                description={payoutsErrorObj instanceof Error ? payoutsErrorObj.message : 'Please try again later.'}
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
            ) : filteredPayouts.length === 0 ? (
              <AdminEmptyState title="Nothing here" description="No payouts for the selected status." />
            ) : (
              <DataTableContainer>
                <DataTable>
                  <DataTableHead>
                    <tr>
                      <th className="px-6 py-4 text-white">Seller</th>
                      <th className="px-6 py-4 text-white">Order</th>
                      <th className="px-6 py-4 text-white">Amount</th>
                      <th className="px-6 py-4 text-white">Date</th>
                      <th className="px-6 py-4 text-white">Status</th>
                      <th className="px-6 py-4 text-right text-gray-500">Action</th>
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {filteredPayouts.map((payout) => (
                      <tr key={payout.id} className="transition hover:bg-[#10151d]">
                        <DataTableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">
                              Seller #{payout.sellerId.slice(0, 8)}
                            </span>
                            <span className="text-xs uppercase tracking-[0.16em] text-gray-500">
                              ID: {payout.id.slice(0, 8)}…
                            </span>
                          </div>
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-sm text-gray-300">#{payout.orderId.slice(0, 8)}</span>
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-sm font-semibold text-primary">{NGN.format(payout.net / 100)}</span>
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-xs text-gray-400">
                            {new Date(payout.createdAt).toLocaleDateString()}
                          </span>
                        </DataTableCell>
                        <DataTableCell>
                          <StatusBadge
                            tone={payoutStatusTone[payout.status] ?? 'neutral'}
                            label={payoutStatusLabel[payout.status]}
                          />
                        </DataTableCell>
                        <DataTableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {payout.status === 'PENDING' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(payout)}
                                  disabled={approvePayout.isPending}
                                  className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(payout)}
                                  disabled={rejectPayout.isPending}
                                  className="rounded-full border border-[#3a1f1f] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#ff9aa8] transition hover:border-[#ff9aa8] hover:text-[#ffb8c6] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Reject
                                </button>
                              </>
                            ) : null}
                            {payout.status === 'APPROVED' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPayout(payout);
                                  setProcessForm({ bankAccount: '', bankCode: '', accountName: '' });
                                }}
                                className="rounded-full border border-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:bg-primary hover:text-black"
                              >
                                Process
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => setSelectedPayout(payout)}
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
            )}
          </section>
        </div>
      </div>

      <AdminDrawer
        open={Boolean(selectedPayout)}
        onClose={() => setSelectedPayout(null)}
        title={selectedPayout ? `Payout ${selectedPayout.id.slice(0, 8)}` : 'Payout Details'}
        description={selectedPayout ? payoutStatusLabel[selectedPayout.status] : ''}
        footer={
          selectedPayout?.status === 'PENDING' ? (
            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={() => selectedPayout && handleReject(selectedPayout)}
                className="rounded-full border border-[#3a1f1f] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#ff9aa8] transition hover:border-[#ff9aa8] hover:text-[#ffb8c6]"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => selectedPayout && handleApprove(selectedPayout)}
                className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light"
              >
                Approve Payout
              </button>
            </div>
          ) : null
        }
      >
        {selectedPayout ? (
          selectedPayout.status === 'APPROVED' ? (
            <form className="space-y-4" onSubmit={handleProcessSubmit}>
              <div className="mb-4 rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Net Amount</p>
                <p className="mt-1 text-2xl font-bold text-primary">{NGN.format(selectedPayout.net / 100)}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-400">
                  <div>
                    <span className="text-gray-500">Gross:</span> {NGN.format(selectedPayout.gross / 100)}
                  </div>
                  <div>
                    <span className="text-gray-500">Commission:</span> {NGN.format(selectedPayout.commission / 100)}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Bank Account Number
                </label>
                <input
                  value={processForm.bankAccount}
                  onChange={(event) => setProcessForm((prev) => ({ ...prev, bankAccount: event.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-700 bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Bank Code</label>
                <input
                  value={processForm.bankCode}
                  onChange={(event) => setProcessForm((prev) => ({ ...prev, bankCode: event.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-700 bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Account Name
                </label>
                <input
                  value={processForm.accountName}
                  onChange={(event) => setProcessForm((prev) => ({ ...prev, accountName: event.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-700 bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={processPayout.isPending}
                className="w-full rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processPayout.isPending ? 'Processing...' : 'Process Payout'}
              </button>
            </form>
          ) : (
            <div className="space-y-6 text-sm text-gray-300">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Payout ID</p>
                <p className="mt-1 font-mono text-sm text-white">{selectedPayout.id}</p>
              </div>
              <div className="grid gap-4 rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Status</p>
                  <StatusBadge
                    tone={payoutStatusTone[selectedPayout.status]}
                    label={payoutStatusLabel[selectedPayout.status]}
                    className="mt-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                  <div>
                    <span className="font-semibold uppercase tracking-[0.16em] text-gray-500">Seller ID</span>
                    <p className="mt-1 text-sm text-white">{selectedPayout.sellerId.slice(0, 16)}…</p>
                  </div>
                  <div>
                    <span className="font-semibold uppercase tracking-[0.16em] text-gray-500">Order ID</span>
                    <p className="mt-1 text-sm text-white">{selectedPayout.orderId.slice(0, 16)}…</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Payment Details</p>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gross Amount:</span>
                    <span className="font-semibold text-white">{NGN.format(selectedPayout.gross / 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Commission:</span>
                    <span className="font-semibold text-primary">-{NGN.format(selectedPayout.commission / 100)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-700 pt-2">
                    <span className="font-semibold text-gray-400">Net Amount:</span>
                    <span className="text-lg font-bold text-[#6ce7a2]">{NGN.format(selectedPayout.net / 100)}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                <div>
                  <span className="font-semibold uppercase tracking-[0.16em] text-gray-500">Created</span>
                  <p className="mt-1 text-sm text-white">{new Date(selectedPayout.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="font-semibold uppercase tracking-[0.16em] text-gray-500">Updated</span>
                  <p className="mt-1 text-sm text-white">{new Date(selectedPayout.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )
        ) : null}
      </AdminDrawer>
    </AdminLayout>
  );
}

