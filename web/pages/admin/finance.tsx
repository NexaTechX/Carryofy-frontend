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

export default function AdminFinance() {
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

  const pendingPayouts = payouts?.filter((payout) => payout.status === 'PENDING') ?? [];

  const handleProcessSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPayout) return;
    await processPayout.mutateAsync({ payoutId: selectedPayout.id, payload: processForm });
    setProcessForm({ bankAccount: '', bankCode: '', accountName: '' });
    setSelectedPayout(null);
  };

  const metrics = dashboardData?.metrics;
  const totalRevenue = metrics ? metrics.totalRevenue / 100 : 0;
  const totalCommission = metrics ? metrics.totalCommissions / 100 : 0;
  const netRevenue = totalRevenue - totalCommission;

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
              <AdminCard title="Gross Revenue" description="Lifetime order revenue.">
                <p className="text-3xl font-semibold text-white">{NGN.format(totalRevenue)}</p>
              </AdminCard>
              <AdminCard title="Carryofy Commission" description="Fees collected by Carryofy.">
                <p className="text-3xl font-semibold text-primary">{NGN.format(totalCommission)}</p>
              </AdminCard>
              <AdminCard title="Net Marketplace Earnings" description="Gross minus commission.">
                <p className="text-3xl font-semibold text-[#6ce7a2]">{NGN.format(netRevenue)}</p>
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
                      <th className="px-6 py-4 text-white">Order</th>
                      <th className="px-6 py-4 text-white">Net amount</th>
                      <th className="px-6 py-4 text-white">Status</th>
                      <th className="px-6 py-4 text-right text-gray-500">Actions</th>
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {filteredPayouts.map((payout) => (
                      <tr key={payout.id} className="transition hover:bg-[#10151d]">
                        <DataTableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">Seller #{payout.sellerId.slice(0, 8)}</span>
                            <span className="text-xs text-gray-500">Created {new Date(payout.createdAt).toLocaleString()}</span>
                          </div>
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-sm text-gray-300">#{payout.orderId.slice(0, 8)}</span>
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-sm font-semibold text-primary">{NGN.format(payout.net / 100)}</span>
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
        description={selectedPayout ? `Net ${NGN.format(selectedPayout.net / 100)}` : ''}
      >
        {selectedPayout ? (
          <form className="space-y-4" onSubmit={handleProcessSubmit}>
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

