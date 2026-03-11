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
import Sparkline from '../../components/admin/charts/Sparkline';
import { useAdminDashboard } from '../../lib/admin/hooks/useAdminDashboard';
import {
  useAdminPayouts,
  useApprovePayoutMutation,
  useProcessPayoutMutation,
  useRejectPayoutMutation,
} from '../../lib/admin/hooks/usePayouts';
import { useAdminRefunds } from '../../lib/admin/hooks/useRefunds';
import { AdminPayout, ProcessPayoutPayload, PayoutStatus } from '../../lib/admin/types';
import { formatNgnFromKobo } from '../../lib/api/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Search, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

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

type FinancePeriod = 'TODAY' | 'WEEK' | 'MONTH' | 'ALL_TIME';

const PAYOUT_FILTERS: Array<'ALL' | PayoutStatus> = [
  'ALL',
  'REQUESTED',
  'APPROVED',
  'PROCESSING',
  'PAID',
  'REJECTED',
  'CANCELLED',
];

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
}

function last7Days(): Array<{ date: string; value: number }> {
  const out: Array<{ date: string; value: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({
      date: d.toISOString().slice(0, 10),
      value: 0,
    });
  }
  return out;
}

function buildSparklineFromTrend(
  trend: Array<{ date: string; amount: number }>,
  key: 'amount'
): Array<{ date: string; value: number }> {
  const base = last7Days();
  const byDate: Record<string, number> = {};
  base.forEach((b) => (byDate[b.date] = 0));
  trend.forEach((t) => {
    const d = t.date.slice(0, 10);
    if (byDate[d] !== undefined) byDate[d] += t[key] ?? 0;
  });
  return base.map((b) => ({ date: b.date, value: byDate[b.date] ?? 0 }));
}

function buildPayoutCountSparkline(payouts: AdminPayout[]): Array<{ date: string; value: number }> {
  const base = last7Days();
  const byDate: Record<string, number> = {};
  base.forEach((b) => (byDate[b.date] = 0));
  payouts.forEach((p) => {
    const d = p.requestedAt.slice(0, 10);
    if (byDate[d] !== undefined) byDate[d] += 1;
  });
  return base.map((b) => ({ date: b.date, value: byDate[b.date] ?? 0 }));
}

function filterByPeriod(
  period: FinancePeriod,
  trend: Array<{ date: string; amount: number }>,
  key: 'amount'
): number {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 6);
  const monthStart = new Date(now);
  monthStart.setMonth(monthStart.getMonth() - 1);

  const sum = (arr: Array<{ date: string; amount: number }>) =>
    arr.reduce((acc, t) => acc + (t[key] ?? 0), 0);

  if (period === 'TODAY') {
    return sum(trend.filter((t) => t.date.slice(0, 10) === today));
  }
  if (period === 'WEEK') {
    const weekStr = weekStart.toISOString().slice(0, 10);
    return sum(trend.filter((t) => t.date.slice(0, 10) >= weekStr && t.date.slice(0, 10) <= today));
  }
  if (period === 'MONTH') {
    const monthStr = monthStart.toISOString().slice(0, 10);
    return sum(trend.filter((t) => t.date.slice(0, 10) >= monthStr && t.date.slice(0, 10) <= today));
  }
  return sum(trend);
}

export default function AdminFinance() {
  const [filter, setFilter] = useState<'ALL' | PayoutStatus>('REQUESTED');
  const [period, setPeriod] = useState<FinancePeriod>('WEEK');
  const [selectedPayout, setSelectedPayout] = useState<AdminPayout | null>(null);
  const [processForm, setProcessForm] = useState<ProcessPayoutPayload>({
    bankAccount: '',
    bankCode: '',
    accountName: '',
  });
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkModal, setBulkModal] = useState<'approve' | 'reject' | null>(null);

  const { data: dashboardData, isLoading: metricsLoading } = useAdminDashboard();
  const { data: payouts, isLoading: payoutsLoading, isError: payoutsError, error: payoutsErrorObj, refetch } =
    useAdminPayouts();
  const { data: refundsData } = useAdminRefunds({ limit: 500 });

  const approvePayout = useApprovePayoutMutation();
  const rejectPayout = useRejectPayoutMutation();
  const processPayout = useProcessPayoutMutation();

  const metrics = dashboardData?.metrics;
  const salesTrend = dashboardData?.salesTrend?.trend ?? [];
  const commissionPeriods = dashboardData?.commissionRevenue?.periods ?? [];
  const commissionTrend = commissionPeriods.map((p) => ({
    date: p.period,
    amount: p.amount ?? 0,
  }));

  const totalRefundedKobo = useMemo(() => {
    const list = refundsData?.refunds ?? [];
    return list
      .filter((r) => r.status === 'COMPLETED')
      .reduce((acc, r) => acc + (r.amount ?? 0), 0);
  }, [refundsData]);

  const grossOrderVolumeKobo = metrics?.totalRevenue ?? 0;
  const platformCommissionKobo = metrics?.totalCommissions ?? 0; // seller commissions
  const riderCommissionKobo = metrics?.riderCommissionKobo ?? 0; // 15% from delivery fees (separate)
  const netPlatformRevenueKobo = (metrics?.totalCommissions ?? 0) - totalRefundedKobo;

  const grossByPeriodKobo = useMemo(
    () => filterByPeriod(period, salesTrend, 'amount'),
    [period, salesTrend]
  );
  const commissionByPeriodKobo = useMemo(
    () => filterByPeriod(period, commissionTrend, 'amount'),
    [period, commissionTrend]
  );

  const pendingPayouts = payouts?.filter((p) => p.status === 'REQUESTED') ?? [];
  const payoutCountByPeriod = useMemo(() => {
    if (!payouts) return 0;
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    const monthStart = new Date(now);
    monthStart.setMonth(monthStart.getMonth() - 1);
    const inRange = (d: string) => {
      const ds = d.slice(0, 10);
      if (period === 'TODAY') return ds === today;
      if (period === 'WEEK') return ds >= weekStart.toISOString().slice(0, 10) && ds <= today;
      if (period === 'MONTH') return ds >= monthStart.toISOString().slice(0, 10) && ds <= today;
      return true;
    };
    return payouts.filter((p) => inRange(p.requestedAt)).length;
  }, [payouts, period]);

  const filteredPayouts = useMemo(() => {
    let list = payouts ?? [];
    if (filter !== 'ALL') list = list.filter((p) => p.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          (p.seller?.businessName ?? '').toLowerCase().includes(q) ||
          (p.seller?.user?.name ?? '').toLowerCase().includes(q) ||
          p.sellerId.toLowerCase().includes(q)
      );
    }
    if (dateFrom) list = list.filter((p) => p.requestedAt.slice(0, 10) >= dateFrom);
    if (dateTo) list = list.filter((p) => p.requestedAt.slice(0, 10) <= dateTo);
    return list;
  }, [payouts, filter, search, dateFrom, dateTo]);

  const requestedForBulk = useMemo(
    () => filteredPayouts.filter((p) => p.status === 'REQUESTED'),
    [filteredPayouts]
  );
  const selectedRequested = useMemo(
    () => requestedForBulk.filter((p) => selectedIds.has(p.id)),
    [requestedForBulk, selectedIds]
  );

  const sparklineGross = useMemo(
    () => buildSparklineFromTrend(salesTrend, 'amount'),
    [salesTrend]
  );
  const sparklineCommission = useMemo(
    () => buildSparklineFromTrend(commissionTrend, 'amount'),
    [commissionTrend]
  );
  const sparklinePayouts = useMemo(
    () => buildPayoutCountSparkline(payouts ?? []),
    [payouts]
  );

  const copyToClipboard = async (value?: string | null) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // no-op
    }
  };

  const handleProcessSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPayout) return;
    await processPayout.mutateAsync({ payoutId: selectedPayout.id, payload: processForm });
    setProcessForm({ bankAccount: '', bankCode: '', accountName: '' });
    setSelectedPayout(null);
  };

  const handleBulkApprove = async () => {
    const ids = selectedIds.size ? Array.from(selectedIds) : requestedForBulk.map((p) => p.id);
    const toApprove = (payouts ?? []).filter((p) => ids.includes(p.id) && p.status === 'REQUESTED');
    for (const p of toApprove) {
      await approvePayout.mutateAsync(p.id);
    }
    setBulkModal(null);
    setSelectedIds(new Set());
  };

  const handleBulkReject = async () => {
    const ids = Array.from(selectedIds);
    const toReject = (payouts ?? []).filter((p) => ids.includes(p.id) && p.status === 'REQUESTED');
    for (const p of toReject) {
      await rejectPayout.mutateAsync(p.id);
    }
    setBulkModal(null);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllRequested = () => {
    if (selectedRequested.length === requestedForBulk.length) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        requestedForBulk.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        requestedForBulk.forEach((p) => next.add(p.id));
        return next;
      });
    }
  };

  const financeSummaryDonut = useMemo(() => {
    const sellerCommissionKobo = metrics?.totalCommissions ?? 0;
    const riderCommissionKobo = metrics?.riderCommissionKobo ?? 0;
    const refundsKobo = totalRefundedKobo;
    const pendingKobo = pendingPayouts.reduce((acc, p) => acc + p.amount, 0);
    return [
      { name: 'Seller Commission', value: Math.max(0, sellerCommissionKobo), color: '#FF6B00' },
      { name: 'Rider Commission', value: Math.max(0, riderCommissionKobo), color: '#6ce7a2' },
      { name: 'Refunds', value: Math.max(0, refundsKobo), color: '#ff8484' },
      { name: 'Pending', value: Math.max(0, pendingKobo), color: '#ffb169' },
    ].filter((d) => d.value > 0);
  }, [metrics?.totalCommissions, metrics?.riderCommissionKobo, totalRefundedKobo, pendingPayouts]);

  const displayGrossKobo = period === 'ALL_TIME' ? grossOrderVolumeKobo : grossByPeriodKobo;
  const displayCommissionKobo = period === 'ALL_TIME' ? platformCommissionKobo : commissionByPeriodKobo;
  const displayPayoutCount = period === 'ALL_TIME' ? (payouts?.length ?? 0) : payoutCountByPeriod;

  const handleSimulatePayout = () => {
    toast.success('Simulate Payout Request: use the seller app to request a payout, or add a backend test endpoint for live testing.');
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Finance"
            tag="Marketplace Earnings"
            subtitle="Track revenue, commissions, and manage seller payouts."
          />

          {metricsLoading ? (
            <LoadingState fullscreen />
          ) : metrics ? (
            <div className="mb-10 flex flex-col gap-6 lg:flex-row">
              <section className="flex-1 space-y-4">
                <div className="flex items-center justify-end">
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as FinancePeriod)}
                    className="flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm font-medium text-gray-300 focus:border-primary focus:outline-none"
                  >
                    <option value="TODAY">Today</option>
                    <option value="WEEK">Week</option>
                    <option value="MONTH">Month</option>
                    <option value="ALL_TIME">All Time</option>
                  </select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  <AdminCard
                    title="Gross Order Volume"
                    description="Total value of paid orders (before commissions)."
                  >
                    <p className="text-3xl font-semibold text-white">{formatNgnFromKobo(displayGrossKobo)}</p>
                    <Sparkline data={sparklineGross} color="#e5e7eb" height={44} />
                  </AdminCard>
                  <AdminCard
                    title="Platform Commission Revenue"
                    description="Commissions from seller orders (product sales)."
                  >
                    <p className="text-3xl font-semibold text-primary">{formatNgnFromKobo(displayCommissionKobo)}</p>
                    <Sparkline data={sparklineCommission} color="#FF6B00" height={44} />
                  </AdminCard>
                  <AdminCard
                    title="Rider Commission"
                    description="15% from delivery fees (separate from seller commissions)."
                  >
                    <p className="text-3xl font-semibold text-[#6ce7a2]">{formatNgnFromKobo(riderCommissionKobo)}</p>
                    <div className="h-11 flex items-center text-xs text-gray-500">
                      From rider delivery fees
                    </div>
                  </AdminCard>
                  <AdminCard
                    title="Payout Operations"
                    description="Review and process seller payout requests."
                  >
                    <p className="text-3xl font-semibold text-[#6ce7a2]">{displayPayoutCount}</p>
                    <Sparkline data={sparklinePayouts} color="#6ce7a2" height={44} />
                  </AdminCard>
                  <AdminCard
                    title="Net Platform Revenue"
                    description="Seller commission revenue minus refunds issued."
                  >
                    <p className="text-3xl font-semibold text-white">{formatNgnFromKobo(netPlatformRevenueKobo)}</p>
                    <div className="h-11 flex items-center text-xs text-gray-500">
                      Commissions − Refunds
                    </div>
                  </AdminCard>
                </div>
              </section>

              <aside className="w-full rounded-2xl border border-[#1f1f1f] bg-[#111111] p-4 lg:w-72 lg:flex-shrink-0">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">
                  Finance Summary
                </h3>
                <div className="mt-3 h-[180px] w-full">
                  {financeSummaryDonut.length === 0 ? (
                    <p className="flex h-full items-center justify-center text-xs text-gray-500">No data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={financeSummaryDonut}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={64}
                          paddingAngle={2}
                          stroke="transparent"
                        >
                          {financeSummaryDonut.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#111',
                            border: '1px solid #2a2a2a',
                            borderRadius: 8,
                            color: '#fff',
                            fontSize: 12,
                          }}
                          formatter={(value: number, name: string) => [
                            formatNgnFromKobo(value),
                            name,
                          ] as [string, string]}
                        />
                        <Legend
                          layout="vertical"
                          align="right"
                          verticalAlign="middle"
                          formatter={(value) => <span className="text-xs text-gray-400">{value}</span>}
                          iconSize={8}
                          iconType="circle"
                          wrapperStyle={{ fontSize: 11 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </aside>
            </div>
          ) : null}

          <section className="mb-8 rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6">
            <h2 className="text-lg font-semibold text-white">Payouts queue</h2>
            <p className="mt-1 text-sm text-gray-400">
              Approve seller withdrawals once balances are reconciled. Pending: {pendingPayouts.length}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by seller name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] py-2 pl-9 pr-3 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
                <span className="text-gray-500">–</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <AdminToolbar className="mt-4 gap-2">
              {PAYOUT_FILTERS.map((status) => (
                <AdminFilterChip key={status} active={filter === status} onClick={() => setFilter(status)}>
                  {status === 'ALL' ? 'All payouts' : payoutStatusLabel[status]}
                </AdminFilterChip>
              ))}
            </AdminToolbar>

            {requestedForBulk.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBulkModal('approve')}
                  className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light"
                >
                  Approve All
                </button>
                <button
                  type="button"
                  onClick={() => setBulkModal('reject')}
                  disabled={selectedIds.size === 0}
                  className="rounded-full border border-[#3a1f1f] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#ff9aa8] transition hover:border-[#ff9aa8] hover:text-[#ffb8c6] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject Selected
                </button>
                <span className="text-xs text-gray-500">
                  {selectedIds.size ? `${selectedIds.size} selected` : `${requestedForBulk.length} requested`}
                </span>
              </div>
            )}

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
              <AdminEmptyState
                title="Nothing here"
                description="No payouts for the selected filters."
                action={
                  <button
                    type="button"
                    onClick={handleSimulatePayout}
                    className="rounded-full border border-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:bg-primary hover:text-black"
                  >
                    Simulate Payout Request
                  </button>
                }
              />
            ) : (
              <DataTableContainer className="mt-4">
                <DataTable>
                  <DataTableHead>
                    <tr>
                      <th className="w-10 px-4 py-4">
                        {requestedForBulk.length > 0 ? (
                          <input
                            type="checkbox"
                            checked={selectedRequested.length === requestedForBulk.length && requestedForBulk.length > 0}
                            onChange={toggleSelectAllRequested}
                            className="rounded border-[#2a2a2a] bg-[#151515] text-primary focus:ring-primary"
                          />
                        ) : null}
                      </th>
                      <th className="px-6 py-4 text-white">Seller</th>
                      <th className="px-6 py-4 text-white">Bank details</th>
                      <th className="px-6 py-4 text-white">Amount</th>
                      <th className="px-6 py-4 text-white">Date requested</th>
                      <th className="px-6 py-4 text-white">Status</th>
                      <th className="px-6 py-4 text-right text-gray-500">Actions</th>
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {filteredPayouts.map((payout) => {
                      const name = payout.seller?.user?.name ?? payout.seller?.businessName ?? `Seller ${payout.sellerId.slice(0, 8)}`;
                      const isRequested = payout.status === 'REQUESTED';
                      return (
                        <tr key={payout.id} className="transition hover:bg-[#10151d]">
                          <DataTableCell className="w-10 px-4">
                            {isRequested ? (
                              <input
                                type="checkbox"
                                checked={selectedIds.has(payout.id)}
                                onChange={() => toggleSelect(payout.id)}
                                className="rounded border-[#2a2a2a] bg-[#151515] text-primary focus:ring-primary"
                              />
                            ) : null}
                          </DataTableCell>
                          <DataTableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#1f2534] text-xs font-semibold text-primary">
                                {getInitials(name)}
                              </div>
                              <span className="text-sm font-semibold text-white">{name}</span>
                            </div>
                          </DataTableCell>
                          <DataTableCell>
                            <span className="text-sm text-gray-400">
                              {payout.paystackRecipientCode
                                ? `••••${payout.paystackRecipientCode.slice(-6)}`
                                : '—'}
                            </span>
                          </DataTableCell>
                          <DataTableCell>
                            <span className="text-sm font-semibold text-primary">{formatNgnFromKobo(payout.amount)}</span>
                          </DataTableCell>
                          <DataTableCell>
                            <span className="text-sm text-gray-300">
                              {new Date(payout.requestedAt).toLocaleDateString()}
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
                              {isRequested ? (
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
                      );
                    })}
                  </DataTableBody>
                </DataTable>
              </DataTableContainer>
            )}
          </section>
        </div>
      </div>

      {bulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setBulkModal(null)}>
          <div
            className="w-full max-w-sm rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white">
              {bulkModal === 'approve' ? 'Approve payouts' : 'Reject payouts'}
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              {bulkModal === 'approve'
                ? `Approve ${requestedForBulk.length} payout(s)?`
                : `Reject ${selectedIds.size} selected payout(s)?`}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setBulkModal(null)}
                className="flex-1 rounded-full border border-[#2a2a2a] px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-[#1a1a1a]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={bulkModal === 'approve' ? handleBulkApprove : handleBulkReject}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${
                  bulkModal === 'approve'
                    ? 'bg-primary text-black hover:bg-primary-light'
                    : 'bg-[#3a1f1f] text-[#ff9aa8] hover:bg-[#4a2f2f]'
                }`}
              >
                {bulkModal === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

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
