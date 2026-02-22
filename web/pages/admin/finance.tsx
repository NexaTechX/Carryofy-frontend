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

const payoutStatusTone: Record<PayoutStatus, 'warning' | 'success' | 'danger' | 'neutral'> = {
  REQUESTED: 'warning',
  APPROVED: 'success',
  PROCESSING: 'warning',
  PAID: 'success',
  CANCELLED: 'neutral',
  REJECTED: 'danger',
};

const payoutStatusLabel: Record<PayoutStatus, string> = {
  REQUESTED: 'Requested',
  APPROVED: 'Approved',
  PROCESSING: 'Processing',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
};

import { formatNgnFromKobo } from '../../lib/api/utils';

const PAYOUT_FILTERS: Array<'ALL' | PayoutStatus> = [
  'ALL',
  'REQUESTED',
  'APPROVED',
  'PROCESSING',
  'PAID',
  'REJECTED',
  'CANCELLED',
];

export default function AdminFinance() {
  const [filter, setFilter] = useState<'ALL' | PayoutStatus>('REQUESTED');
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

  const pendingPayouts = payouts?.filter((payout) => payout.status === 'REQUESTED') ?? [];

  const copyToClipboard = async (value?: string | null) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // no-op fallback; clipboard may be unavailable in some contexts
    }
  };

  const handleProcessSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPayout) return;
    await processPayout.mutateAsync({ payoutId: selectedPayout.id, payload: processForm });
    setProcessForm({ bankAccount: '', bankCode: '', accountName: '' });
    setSelectedPayout(null);
  };

  const metrics = dashboardData?.metrics;
  const grossOrderVolume = metrics ? metrics.totalRevenue / 100 : 0;
  const platformCommissionRevenue = metrics ? metrics.totalCommissions / 100 : 0;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Finance"
            tag="Marketplace Earnings"
            subtitle="Track revenue, commissions, and manage seller payouts."
          />

          {metricsLoading ? (
            <LoadingState fullscreen />
          ) : metrics ? (
            <section className="mb-10 grid gap-4 sm:grid-cols-3">
              <AdminCard title="Gross Order Volume" description="Total value of paid orders (before commissions).">
                <p className="text-3xl font-semibold text-white">{formatNgnFromKobo(grossOrderVolume)}</p>
              </AdminCard>
              <AdminCard title="Platform Commission Revenue" description="Total commissions earned across all orders.">
                <p className="text-3xl font-semibold text-primary">{formatNgnFromKobo(platformCommissionRevenue)}</p>
              </AdminCard>
              <AdminCard title="Payout Operations" description="Review and process seller payout requests.">
                <p className="text-3xl font-semibold text-[#6ce7a2]">{pendingPayouts.length}</p>
              </AdminCard>
            </section>
          ) : null}

          <section className="mb-8 rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6">
            <h2 className="text-lg font-semibold text-white">Payouts queue</h2>
            <p className="mt-1 text-sm text-gray-400">
              Approve seller withdrawals once balances are reconciled. Pending: {pendingPayouts.length}
            </p>

            <AdminToolbar className="mt-4 gap-2">
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
                      <th className="px-6 py-4 text-white">Requested</th>
                      <th className="px-6 py-4 text-white">Amount</th>
                      <th className="px-6 py-4 text-white">Status</th>
                      <th className="px-6 py-4 text-right text-gray-500">Actions</th>
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {filteredPayouts.map((payout) => (
                      <tr key={payout.id} className="transition hover:bg-[#10151d]">
                        <DataTableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">
                              {payout.seller?.businessName ?? `Seller #${payout.sellerId.slice(0, 8)}`}
                            </span>
                            <span className="text-xs text-gray-500">
                              Requested {new Date(payout.requestedAt).toLocaleString()}
                            </span>
                          </div>
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-sm text-gray-300">
                            {new Date(payout.requestedAt).toLocaleDateString()}
                          </span>
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-sm font-semibold text-primary">{formatNgnFromKobo(payout.amount)}</span>
                        </DataTableCell>
                        <DataTableCell>
                          <StatusBadge
                            tone={payoutStatusTone[payout.status] ?? 'neutral'}
                            label={payoutStatusLabel[payout.status]}
                          />
                        </DataTableCell>
                        <DataTableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {payout.status === 'REQUESTED' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => approvePayout.mutate(payout.id)}
                                  className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => rejectPayout.mutate(payout.id)}
                                  className="rounded-full border border-[#3a1f1f] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#ff9aa8] transition hover:border-[#ff9aa8] hover:text-[#ffb8c6]"
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
                            {payout.status === 'PAID' ? (
                              <button
                                type="button"
                                onClick={() => setSelectedPayout(payout)}
                                className="rounded-full border border-[#1f2534] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary"
                              >
                                View
                              </button>
                            ) : null}
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
        title={selectedPayout ? `Process payout ${selectedPayout.id.slice(0, 8)}` : 'Process payout'}
        description={selectedPayout ? `Amount ${formatNgnFromKobo(selectedPayout.amount)}` : ''}
      >
        {selectedPayout ? (
          <form className="space-y-6" onSubmit={handleProcessSubmit}>
            <div className="rounded-xl border border-[#1f2534] bg-[#0b1322] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Audit</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-400">Paystack transfer ref</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gray-200">
                      {selectedPayout.paystackTransferRef ?? 'Not available yet'}
                    </span>
                    {selectedPayout.paystackTransferRef ? (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedPayout.paystackTransferRef)}
                        className="rounded-full border border-[#1f2534] px-3 py-1 text-[11px] font-semibold text-gray-300 hover:border-primary hover:text-primary"
                      >
                        Copy
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-400">Paystack recipient code</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gray-200">
                      {selectedPayout.paystackRecipientCode ?? 'Not available yet'}
                    </span>
                    {selectedPayout.paystackRecipientCode ? (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedPayout.paystackRecipientCode)}
                        className="rounded-full border border-[#1f2534] px-3 py-1 text-[11px] font-semibold text-gray-300 hover:border-primary hover:text-primary"
                      >
                        Copy
                      </button>
                    ) : null}
                  </div>
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
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Bank Code
              </label>
              <input
                value={processForm.bankCode}
                onChange={(event) => setProcessForm((prev) => ({ ...prev, bankCode: event.target.value }))}
                required
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
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
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={selectedPayout.status !== 'APPROVED' || processPayout.isPending}
              className="w-full rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light"
            >
              Process payout
            </button>
          </form>
        ) : (
          <LoadingState label="Fetching payout…" />
        )}
      </AdminDrawer>
    </AdminLayout>
  );
}

