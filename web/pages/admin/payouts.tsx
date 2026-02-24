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
import { AdminPayout, ProcessPayoutPayload, PayoutStatus } from '../../lib/admin/types';
import { formatNgnFromKobo } from '../../lib/api/utils';
import { toast } from 'react-hot-toast';
import { Search, CheckCircle2, Inbox, XCircle, Clock, FileCheck, Ban, Loader2 } from 'lucide-react';

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

const PAYOUT_FILTERS: Array<'ALL' | PayoutStatus> = [
  'ALL',
  'REQUESTED',
  'APPROVED',
  'PROCESSING',
  'PAID',
  'REJECTED',
  'CANCELLED',
];

function last7Days(): Array<{ date: string; value: number }> {
  const out: Array<{ date: string; value: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({ date: d.toISOString().slice(0, 10), value: 0 });
  }
  return out;
}

function previous7Days(): Array<{ date: string; value: number }> {
  const out: Array<{ date: string; value: number }> = [];
  for (let i = 13; i >= 7; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({ date: d.toISOString().slice(0, 10), value: 0 });
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

function buildPayoutAmountSparkline(payouts: AdminPayout[], status: 'PAID'): Array<{ date: string; value: number }> {
  const base = last7Days();
  const byDate: Record<string, number> = {};
  base.forEach((b) => (byDate[b.date] = 0));
  payouts
    .filter((p) => p.status === status)
    .forEach((p) => {
      const d = (status === 'PAID' ? p.paidAt : p.requestedAt)?.slice(0, 10);
      if (d && byDate[d] !== undefined) byDate[d] += p.amount;
    });
  return base.map((b) => ({ date: b.date, value: byDate[b.date] ?? 0 }));
}

function buildPendingAmountSparkline(payouts: AdminPayout[]): Array<{ date: string; value: number }> {
  const base = last7Days();
  const byDate: Record<string, number> = {};
  base.forEach((b) => (byDate[b.date] = 0));
  payouts
    .filter((p) => p.status === 'REQUESTED' || p.status === 'APPROVED')
    .forEach((p) => {
      const d = p.requestedAt.slice(0, 10);
      if (byDate[d] !== undefined) byDate[d] += p.amount;
    });
  return base.map((b) => ({ date: b.date, value: byDate[b.date] ?? 0 }));
}

function sumSparkline(data: Array<{ date: string; value: number }>): number {
  return data.reduce((s, d) => s + d.value, 0);
}

function comparisonFromPeriods(current: number, previous: number): { changePercent: number; label: string } {
  if (previous === 0) return { changePercent: current > 0 ? 100 : 0, label: current > 0 ? '+100%' : '0%' };
  const changePercent = ((current - previous) / previous) * 100;
  const label = changePercent >= 0 ? `+${changePercent.toFixed(1)}%` : `${changePercent.toFixed(1)}%`;
  return { changePercent, label };
}

function averageSettlementTimeHours(payouts: AdminPayout[]): number | null {
  const paid = payouts.filter((p) => p.status === 'PAID' && p.paidAt && p.requestedAt);
  if (paid.length === 0) return null;
  const totalHours = paid.reduce((acc, p) => {
    const ms = new Date(p.paidAt!).getTime() - new Date(p.requestedAt).getTime();
    return acc + ms / (1000 * 60 * 60);
  }, 0);
  return totalHours / paid.length;
}

function formatSettlementTime(hours: number): string {
  if (hours < 24) return `${hours.toFixed(1)} hrs`;
  return `${(hours / 24).toFixed(1)} days`;
}

function getEmptyStateForFilter(
  filter: 'ALL' | PayoutStatus
): { title: string; description: string; icon: React.ReactNode } {
  switch (filter) {
    case 'REQUESTED':
      return {
        title: 'No pending requests',
        description: 'All sellers are settled. New payout requests will appear here.',
        icon: <CheckCircle2 className="h-6 w-6 text-emerald-500" />,
      };
    case 'APPROVED':
      return {
        title: 'No approved payouts',
        description: 'No payouts are currently approved and awaiting processing.',
        icon: <FileCheck className="h-6 w-6 text-gray-500" />,
      };
    case 'PROCESSING':
      return {
        title: 'None in processing',
        description: 'No payouts are currently being processed.',
        icon: <Loader2 className="h-6 w-6 text-gray-500" />,
      };
    case 'PAID':
      return {
        title: 'No paid payouts yet',
        description: 'Completed payouts will appear here.',
        icon: <CheckCircle2 className="h-6 w-6 text-gray-500" />,
      };
    case 'REJECTED':
      return {
        title: 'No rejected payouts',
        description: 'Rejected requests will appear here.',
        icon: <XCircle className="h-6 w-6 text-gray-500" />,
      };
    case 'CANCELLED':
      return {
        title: 'No cancelled payouts',
        description: 'Cancelled requests will appear here.',
        icon: <Ban className="h-6 w-6 text-gray-500" />,
      };
    case 'ALL':
    default:
      return {
        title: 'No payouts',
        description: 'No payout requests match your filters or search.',
        icon: <Inbox className="h-6 w-6 text-gray-500" />,
      };
  }
}

export default function AdminPayouts() {
  const [filter, setFilter] = useState<'ALL' | PayoutStatus>('REQUESTED');
  const [selectedPayout, setSelectedPayout] = useState<AdminPayout | null>(null);
  const [processForm, setProcessForm] = useState<ProcessPayoutPayload>({
    bankAccount: '',
    bankCode: '',
    accountName: '',
  });
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStep, setBulkStep] = useState<'select' | 'confirm' | null>(null);
  const [bulkConfirmPin, setBulkConfirmPin] = useState('');
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject'>('approve');

  const { data: dashboardData, isLoading: metricsLoading } = useAdminDashboard();
  const { data: payouts, isLoading: payoutsLoading, isError: payoutsError, error: payoutsErrorObj, refetch } =
    useAdminPayouts();

  const approvePayout = useApprovePayoutMutation();
  const rejectPayout = useRejectPayoutMutation();
  const processPayout = useProcessPayoutMutation();

  const metrics = dashboardData?.metrics;
  const salesTrend = dashboardData?.salesTrend?.trend ?? [];
  const commissionPeriods = dashboardData?.commissionRevenue?.periods ?? [];
  const commissionTrend = commissionPeriods.map((p) => ({ date: p.period, amount: p.amount ?? 0 }));

  const grossOrderVolumeKobo = metrics?.totalRevenue ?? 0;
  const platformCommissionKobo = metrics?.totalCommissions ?? 0;
  const totalPayoutsKobo =
    payouts?.filter((p) => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0) ?? 0;
  const pendingPayouts = payouts?.filter((p) => p.status === 'REQUESTED' || p.status === 'APPROVED') ?? [];
  const totalPendingAmountKobo = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);

  const last7 = useMemo(() => last7Days(), []);
  const prev7 = useMemo(() => previous7Days(), []);

  const sparklineGross = useMemo(() => buildSparklineFromTrend(salesTrend, 'amount'), [salesTrend]);
  const sparklineCommission = useMemo(() => buildSparklineFromTrend(commissionTrend, 'amount'), [commissionTrend]);
  const sparklinePayoutsAmount = useMemo(
    () => buildPayoutAmountSparkline(payouts ?? [], 'PAID'),
    [payouts]
  );
  const sparklinePending = useMemo(() => buildPendingAmountSparkline(payouts ?? []), [payouts]);

  const prev7Gross = useMemo(() => {
    const byDate: Record<string, number> = {};
    prev7.forEach((b) => (byDate[b.date] = 0));
    salesTrend.forEach((t) => {
      const d = t.date.slice(0, 10);
      if (byDate[d] !== undefined) byDate[d] += t.amount ?? 0;
    });
    return prev7.reduce((s, b) => s + (byDate[b.date] ?? 0), 0);
  }, [salesTrend, prev7]);
  const curr7Gross = useMemo(() => sumSparkline(sparklineGross), [sparklineGross]);
  const prev7Commission = useMemo(() => {
    const byDate: Record<string, number> = {};
    prev7.forEach((b) => (byDate[b.date] = 0));
    commissionTrend.forEach((t) => {
      const d = t.date.slice(0, 10);
      if (byDate[d] !== undefined) byDate[d] += t.amount ?? 0;
    });
    return prev7.reduce((s, b) => s + (byDate[b.date] ?? 0), 0);
  }, [commissionTrend, prev7]);
  const curr7Commission = useMemo(() => sumSparkline(sparklineCommission), [sparklineCommission]);
  const prev7Payouts = useMemo(() => {
    const paid = payouts?.filter((p) => p.status === 'PAID' && p.paidAt) ?? [];
    return prev7.reduce((s, b) => {
      return (
        s +
        paid.filter((p) => p.paidAt!.slice(0, 10) === b.date).reduce((sum, p) => sum + p.amount, 0)
      );
    }, 0);
  }, [payouts, prev7]);
  const curr7Payouts = useMemo(() => sumSparkline(sparklinePayoutsAmount), [sparklinePayoutsAmount]);
  const prev7Pending = useMemo(() => {
    const pending = payouts?.filter((p) => p.status === 'REQUESTED' || p.status === 'APPROVED') ?? [];
    return prev7.reduce((s, b) => {
      return (
        s +
        pending.filter((p) => p.requestedAt.slice(0, 10) === b.date).reduce((sum, p) => sum + p.amount, 0)
      );
    }, 0);
  }, [payouts, prev7]);
  const curr7Pending = useMemo(() => sumSparkline(sparklinePending), [sparklinePending]);

  const comparisonGross = useMemo(
    () => comparisonFromPeriods(curr7Gross, prev7Gross),
    [curr7Gross, prev7Gross]
  );
  const comparisonCommission = useMemo(
    () => comparisonFromPeriods(curr7Commission, prev7Commission),
    [curr7Commission, prev7Commission]
  );
  const comparisonPayouts = useMemo(
    () => comparisonFromPeriods(curr7Payouts, prev7Payouts),
    [curr7Payouts, prev7Payouts]
  );
  const comparisonPending = useMemo(
    () => comparisonFromPeriods(curr7Pending, prev7Pending),
    [curr7Pending, prev7Pending]
  );

  const averageSettlementHours = useMemo(
    () => averageSettlementTimeHours(payouts ?? []),
    [payouts]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: payouts?.length ?? 0 };
    PAYOUT_FILTERS.forEach((f) => {
      if (f === 'ALL') return;
      counts[f] = payouts?.filter((p) => p.status === f).length ?? 0;
    });
    return counts;
  }, [payouts]);

  const filteredPayouts = useMemo(() => {
    if (!payouts) return [];
    let list = filter === 'ALL' ? payouts : payouts.filter((p) => p.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const amountNum = Number.parseFloat(search.replace(/[^0-9.]/g, ''));
      list = list.filter(
        (p) =>
          (p.seller?.businessName ?? '').toLowerCase().includes(q) ||
          (p.seller?.user?.name ?? '').toLowerCase().includes(q) ||
          p.sellerId.toLowerCase().includes(q) ||
          (Number.isFinite(amountNum) && p.amount / 100 === amountNum) ||
          (Number.isFinite(amountNum) && String(p.amount / 100).includes(search.trim()))
      );
    }
    return list;
  }, [payouts, filter, search]);

  const requestedForBulk = useMemo(
    () => filteredPayouts.filter((p) => p.status === 'REQUESTED'),
    [filteredPayouts]
  );
  const selectedRequested = useMemo(
    () => requestedForBulk.filter((p) => selectedIds.has(p.id)),
    [requestedForBulk, selectedIds]
  );

  const handleApprove = (payout: AdminPayout) => {
    approvePayout.mutate(payout.id, {
      onSuccess: () => {
        toast.success('Payout approved successfully');
        setSelectedPayout((c) => (c?.id === payout.id ? { ...c, status: 'APPROVED' as const } : c));
      },
    });
  };

  const handleReject = (payout: AdminPayout) => {
    rejectPayout.mutate(payout.id, {
      onSuccess: () => {
        toast.success('Payout rejected');
        setSelectedPayout((c) => (c?.id === payout.id ? { ...c, status: 'REJECTED' as const } : c));
      },
    });
  };

  const handleProcessSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPayout) return;
    await processPayout.mutateAsync({ payoutId: selectedPayout.id, payload: processForm });
    setProcessForm({ bankAccount: '', bankCode: '', accountName: '' });
    setSelectedPayout(null);
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

  const openBulkApprove = () => {
    setBulkAction('approve');
    setBulkStep('select');
    setBulkConfirmPin('');
  };
  const openBulkReject = () => {
    setBulkAction('reject');
    setBulkStep('select');
    setBulkConfirmPin('');
  };

  const onBulkConfirmWithPin = async () => {
    if (!bulkConfirmPin.trim()) {
      toast.error('Enter PIN or password to confirm');
      return;
    }
    const toAct = bulkAction === 'approve'
      ? (selectedIds.size ? Array.from(selectedIds) : requestedForBulk.map((p) => p.id))
      : Array.from(selectedIds);
    const list = (payouts ?? []).filter((p) => toAct.includes(p.id) && p.status === 'REQUESTED');
    if (bulkAction === 'approve') {
      for (const p of list) await approvePayout.mutateAsync(p.id);
      toast.success(`${list.length} payout(s) approved`);
    } else {
      for (const p of list) await rejectPayout.mutateAsync(p.id);
      toast.success(`${list.length} payout(s) rejected`);
    }
    setBulkStep(null);
    setBulkConfirmPin('');
    setSelectedIds(new Set());
  };

  const exportCsv = () => {
    if (!payouts || payouts.length === 0) {
      toast.error('No payout data to export');
      return;
    }
    const headers = [
      'Seller Name',
      'Bank/Account',
      'Amount (NGN)',
      'Requested Date',
      'Status',
      'Paid At',
      'Paystack Transfer Ref',
      'Paystack Recipient Code',
    ];
    const rows = payouts.map((p) => [
      p.seller?.businessName ?? p.seller?.user?.name ?? p.sellerId,
      p.paystackRecipientCode ? `••••${String(p.paystackRecipientCode).slice(-6)}` : '—',
      (p.amount / 100).toFixed(2),
      new Date(p.requestedAt).toLocaleString(),
      p.status,
      p.paidAt ? new Date(p.paidAt).toLocaleString() : '',
      p.paystackTransferRef ?? '',
      p.paystackRecipientCode ?? '',
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payouts-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const exportPdf = async () => {
    const list = filter === 'ALL' ? payouts ?? [] : (payouts ?? []).filter((p) => p.status === filter);
    if (list.length === 0) {
      toast.error('No payout data to export');
      return;
    }
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Payouts & Seller Settlements', 14, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Filter: ${filter === 'ALL' ? 'All' : payoutStatusLabel[filter]}`, 14, 34);
    const docWithTable = doc as unknown as { lastAutoTable?: { finalY: number } };
    autoTable(doc, {
      startY: 42,
      head: [['Seller', 'Bank/Account', 'Amount', 'Requested', 'Status']],
      body: list.map((p) => [
        p.seller?.businessName ?? p.seller?.user?.name ?? `Seller ${p.sellerId.slice(0, 8)}`,
        p.paystackRecipientCode ? `••••${String(p.paystackRecipientCode).slice(-6)}` : '—',
        formatNgnFromKobo(p.amount),
        new Date(p.requestedAt).toLocaleDateString(),
        payoutStatusLabel[p.status],
      ]),
      theme: 'plain',
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] },
      styles: { fontSize: 9 },
    });
    const finalY = (docWithTable.lastAutoTable?.finalY ?? 42) + 10;
    if (finalY > 270) doc.addPage();
    doc.save(`payouts-${filter}-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF exported successfully');
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
            <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <AdminCard
                title="Gross Order Volume"
                description="Total value of paid orders (before commissions)"
              >
                <p className="text-3xl font-semibold text-white">{formatNgnFromKobo(grossOrderVolumeKobo)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      comparisonGross.changePercent >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    vs last period: {comparisonGross.label}
                  </span>
                </div>
                <div className="mt-2 h-11">
                  <Sparkline data={sparklineGross} color="#e5e7eb" height={44} />
                </div>
              </AdminCard>
              <AdminCard
                title="Platform Commission Revenue"
                description="Total commissions earned across all orders"
              >
                <p className="text-3xl font-semibold text-primary">{formatNgnFromKobo(platformCommissionKobo)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      comparisonCommission.changePercent >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    vs last period: {comparisonCommission.label}
                  </span>
                </div>
                <div className="mt-2 h-11">
                  <Sparkline data={sparklineCommission} color="#FF6B00" height={44} />
                </div>
              </AdminCard>
              <AdminCard title="Payouts" description="Total paid to sellers">
                <p className="text-3xl font-semibold text-[#6ce7a2]">{formatNgnFromKobo(totalPayoutsKobo)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      comparisonPayouts.changePercent >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    vs last period: {comparisonPayouts.label}
                  </span>
                </div>
                <div className="mt-2 h-11">
                  <Sparkline data={sparklinePayoutsAmount} color="#6ce7a2" height={44} />
                </div>
              </AdminCard>
              <AdminCard
                title="Pending Requests"
                description="Total requested amount pending review/processing"
              >
                <p className="text-3xl font-semibold text-[#ffd700]">{formatNgnFromKobo(totalPendingAmountKobo)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      comparisonPending.changePercent >= 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    vs last period: {comparisonPending.label}
                  </span>
                </div>
                <div className="mt-2 h-11">
                  <Sparkline data={sparklinePending} color="#ffd700" height={44} />
                </div>
              </AdminCard>
              <AdminCard
                title="Average Settlement Time"
                description="Request to payment"
              >
                <p className="text-3xl font-semibold text-white">
                  {averageSettlementHours != null ? formatSettlementTime(averageSettlementHours) : '—'}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-4 w-4" />
                  {averageSettlementHours != null
                    ? 'Based on paid payouts'
                    : 'No completed payouts yet'}
                </div>
                <div className="mt-2 h-11 flex items-center text-xs text-gray-500">
                  —
                </div>
              </AdminCard>
            </section>
          ) : null}

          <section className="mb-8 rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Payout Requests</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Pending: {pendingPayouts.length} • Total pending amount: {formatNgnFromKobo(totalPendingAmountKobo)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={exportCsv}
                  disabled={!payouts || payouts.length === 0}
                  className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export CSV
                </button>
                <button
                  onClick={exportPdf}
                  disabled={!payouts || payouts.length === 0}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export PDF
                </button>
              </div>
            </div>

            <div className="relative mb-4 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search by seller name or amount..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] py-2 pl-9 pr-3 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
              />
            </div>

            <AdminToolbar className="mb-4 gap-2">
              {PAYOUT_FILTERS.map((status) => (
                <AdminFilterChip
                  key={status}
                  active={filter === status}
                  onClick={() => setFilter(status)}
                >
                  {status === 'ALL' ? `All (${statusCounts.ALL})` : `${payoutStatusLabel[status]} (${statusCounts[status] ?? 0})`}
                </AdminFilterChip>
              ))}
            </AdminToolbar>

            {requestedForBulk.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={openBulkApprove}
                  className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light"
                >
                  Bulk Approve
                </button>
                <button
                  type="button"
                  onClick={openBulkReject}
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
              (() => {
                const empty = getEmptyStateForFilter(filter);
                return (
                  <AdminEmptyState
                    title={empty.title}
                    description={empty.description}
                    icon={empty.icon}
                  />
                );
              })()
            ) : (
              <DataTableContainer>
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
                      <th className="px-6 py-4 text-white">Seller Name</th>
                      <th className="px-6 py-4 text-white">Bank/Account</th>
                      <th className="px-6 py-4 text-white">Amount</th>
                      <th className="px-6 py-4 text-white">Requested Date</th>
                      <th className="px-6 py-4 text-white">Status</th>
                      <th className="px-6 py-4 text-right text-gray-500">Actions</th>
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {filteredPayouts.map((payout) => (
                      <tr key={payout.id} className="transition hover:bg-[#10151d]">
                        <DataTableCell className="w-10 px-4">
                          {payout.status === 'REQUESTED' ? (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(payout.id)}
                              onChange={() => toggleSelect(payout.id)}
                              className="rounded border-[#2a2a2a] bg-[#151515] text-primary focus:ring-primary"
                            />
                          ) : null}
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-sm font-semibold text-white">
                            {payout.seller?.businessName ?? payout.seller?.user?.name ?? `Seller #${payout.sellerId.slice(0, 8)}`}
                          </span>
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-sm text-gray-400">
                            {payout.paystackRecipientCode
                              ? `••••${String(payout.paystackRecipientCode).slice(-6)}`
                              : '—'}
                          </span>
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-sm font-semibold text-primary">{formatNgnFromKobo(payout.amount)}</span>
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-xs text-gray-400">
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
                            {payout.status === 'REQUESTED' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(payout)}
                                  disabled={approvePayout.isPending}
                                  className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light disabled:opacity-60"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(payout)}
                                  disabled={rejectPayout.isPending}
                                  className="rounded-full border border-[#3a1f1f] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#ff9aa8] transition hover:border-[#ff9aa8] hover:text-[#ffb8c6] disabled:opacity-60"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {payout.status === 'APPROVED' && (
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
                            )}
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

      {/* Bulk: step 1 — confirm count */}
      {bulkStep === 'select' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setBulkStep(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white">
              {bulkAction === 'approve' ? 'Bulk approve payouts' : 'Bulk reject payouts'}
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              {bulkAction === 'approve'
                ? `Approve ${selectedIds.size ? selectedIds.size : requestedForBulk.length} payout(s)? You will need to confirm with PIN or password in the next step.`
                : `Reject ${selectedIds.size} selected payout(s)? You will need to confirm with PIN or password in the next step.`}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setBulkStep(null)}
                className="flex-1 rounded-full border border-[#2a2a2a] px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-[#1a1a1a]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setBulkStep('confirm')}
                className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-black hover:bg-primary-light"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk: step 2 — PIN/password */}
      {bulkStep === 'confirm' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setBulkStep(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white">Confirm with PIN or password</h3>
            <p className="mt-2 text-sm text-gray-400">
              Enter your admin PIN or password to confirm this action.
            </p>
            <input
              type="password"
              value={bulkConfirmPin}
              onChange={(e) => setBulkConfirmPin(e.target.value)}
              placeholder="PIN or password"
              className="mt-4 w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
              autoFocus
            />
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setBulkStep('select')}
                className="flex-1 rounded-full border border-[#2a2a2a] px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-[#1a1a1a]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={onBulkConfirmWithPin}
                disabled={approvePayout.isPending || rejectPayout.isPending}
                className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-black hover:bg-primary-light disabled:opacity-60"
              >
                {bulkAction === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminDrawer
        open={Boolean(selectedPayout)}
        onClose={() => setSelectedPayout(null)}
        title={selectedPayout ? `Payout ${selectedPayout.id.slice(0, 8)}` : 'Payout Details'}
        description={selectedPayout ? payoutStatusLabel[selectedPayout.status] : ''}
        footer={
          selectedPayout?.status === 'REQUESTED' ? (
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
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Requested Amount</p>
                <p className="mt-1 text-2xl font-bold text-primary">{formatNgnFromKobo(selectedPayout.amount)}</p>
                <p className="mt-2 text-xs text-gray-400">
                  Requested {new Date(selectedPayout.requestedAt).toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Bank Account Number
                </label>
                <input
                  value={processForm.bankAccount}
                  onChange={(e) => setProcessForm((prev) => ({ ...prev, bankAccount: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-700 bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Bank Code</label>
                <input
                  value={processForm.bankCode}
                  onChange={(e) => setProcessForm((prev) => ({ ...prev, bankCode: e.target.value }))}
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
                  onChange={(e) => setProcessForm((prev) => ({ ...prev, accountName: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-700 bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={processPayout.isPending}
                className="w-full rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light disabled:opacity-60"
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
                    <span className="font-semibold uppercase tracking-[0.16em] text-gray-500">Requested</span>
                    <p className="mt-1 text-sm text-white">{new Date(selectedPayout.requestedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Amount</p>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Requested amount:</span>
                    <span className="font-semibold text-white">{formatNgnFromKobo(selectedPayout.amount)}</span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Audit</p>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Paystack transfer ref:</span>
                    <span className="font-mono text-white">{selectedPayout.paystackTransferRef ?? 'Not available yet'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Paystack recipient code:</span>
                    <span className="font-mono text-white">{selectedPayout.paystackRecipientCode ?? 'Not available yet'}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                <div>
                  <span className="font-semibold uppercase tracking-[0.16em] text-gray-500">Created</span>
                  <p className="mt-1 text-sm text-white">{new Date(selectedPayout.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="font-semibold uppercase tracking-[0.16em] text-gray-500">Paid</span>
                  <p className="mt-1 text-sm text-white">
                    {selectedPayout.paidAt ? new Date(selectedPayout.paidAt).toLocaleString() : '—'}
                  </p>
                </div>
              </div>
            </div>
          )
        ) : null}
      </AdminDrawer>
    </AdminLayout>
  );
}
