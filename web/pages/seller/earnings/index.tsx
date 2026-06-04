import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import SellerLayout from '../../../components/seller/SellerLayout';
import { useAuth, tokenManager } from '../../../lib/auth';
import { apiClient } from '../../../lib/api/client';
import { formatDate, formatNgnFromKobo, getApiUrl } from '../../../lib/api/utils';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Download, X, Info } from 'lucide-react';
import { useConfirmation } from '../../../lib/hooks/useConfirmation';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import StatusBadge from '../../../components/ui/StatusBadge';

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

/** Payout-context tone: here PAID/APPROVED means the money was sent (success). */
function payoutTone(status: string): BadgeTone {
  switch (status) {
    case 'PAID':
    case 'APPROVED':
      return 'success';
    case 'PENDING':
    case 'REQUESTED':
    case 'PROCESSING':
      return 'warning';
    case 'REFUNDED':
      return 'warning';
    case 'REJECTED':
      return 'danger';
    case 'CANCELLED':
      return 'neutral';
    default:
      return 'neutral';
  }
}

interface EarningsReport {
  totalGross: number;
  totalCommission: number;
  totalNet: number;
  totalOrders: number;
  startDate: string;
  endDate: string;
}

interface Payout {
  id: string;
  sellerId: string;
  orderId: string;
  gross: number;
  commission: number;
  commissionRate?: string; // percentage snapshot, e.g. "15.00"
  net: number;
  refundedAmount?: number; // in kobo
  isReversed?: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface PayoutRequest {
  id: string;
  sellerId: string;
  amount: number;
  status: string;
  requestedAt: string;
  approvedAt?: string;
  processedAt?: string;
  paidAt?: string;
  cancelledAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export default function EarningsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const MIN_PAYOUT_AMOUNT = 100000; // 1,000 NGN in kobo
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [earningsReport, setEarningsReport] = useState<EarningsReport | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [availableForWithdrawal, setAvailableForWithdrawal] = useState(0);
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'quarter' | 'year'>('all');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [bankAccount, setBankAccount] = useState<{
    accountName: string;
    accountNumber: string;
    bankCode: string;
    bankName: string;
  } | null>(null);
  const confirmation = useConfirmation();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // Check authentication
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    if (user.role && user.role !== 'SELLER' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    // Fetch earnings data
    fetchEarningsData();
    fetchPayouts();
    fetchPayoutRequests();
    fetchBankAccount();
  }, [router, dateRange, authLoading, isAuthenticated, user]);

  const fetchBankAccount = async () => {
    try {
      const res = await apiClient.get('/sellers/me/bank-account');
      const payload = res.data as { data?: { accountName: string; accountNumber: string; bankCode: string; bankName: string } } | { accountName: string; accountNumber: string; bankCode: string; bankName: string };
      const raw = 'data' in payload ? payload.data : payload;
      const account =
        raw &&
        'accountName' in raw &&
        'accountNumber' in raw &&
        'bankCode' in raw &&
        'bankName' in raw
          ? {
              accountName: raw.accountName,
              accountNumber: raw.accountNumber,
              bankCode: raw.bankCode,
              bankName: raw.bankName,
            }
          : null;
      setBankAccount(account);
    } catch {
      setBankAccount(null);
    }
  };

  const getDateRangeParams = () => {
    const now = new Date();
    let startDate: string | undefined;
    let endDate: string | undefined;

    switch (dateRange) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0).toISOString().split('T')[0];
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
        break;
      default:
        break;
    }

    return { startDate, endDate };
  };

  const fetchEarningsData = async () => {
    try {
      const token = tokenManager.getAccessToken();
      const { startDate, endDate } = getDateRangeParams();
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(getApiUrl(`/reports/earnings?${params.toString()}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data || result;
        setEarningsReport(data);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayouts = async () => {
    try {
      const token = tokenManager.getAccessToken();
      const [listRes, balanceRes] = await Promise.all([
        fetch(getApiUrl('/payouts'), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(getApiUrl('/payouts/available-balance'), {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (listRes.ok) {
        const result = await listRes.json();
        const payoutsData = result.data || result;
        const payoutsList = Array.isArray(payoutsData) ? payoutsData : [];
        setPayouts(payoutsList);
      }

      if (balanceRes.ok) {
        const result = await balanceRes.json();
        const payload = result.data || result;
        // Withdrawable balance is computed server-side: only delivered + credited +
        // unreversed earnings. This matches the dashboard KPI and what a payout
        // request will actually allow — do NOT sum all PENDING earnings client-side,
        // which over-counts not-yet-delivered orders.
        setAvailableForWithdrawal(Number(payload?.availableBalanceKobo) || 0);
      }
    } catch (error) {
      console.error('Error fetching payouts:', error);
    }
  };

  const fetchPayoutRequests = async () => {
    try {
      const token = tokenManager.getAccessToken();
      const response = await fetch(getApiUrl('/payouts/requests'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const requestsData = result.data || result;
        const requestsList = Array.isArray(requestsData) ? requestsData : [];
        setPayoutRequests(requestsList);
      }
    } catch (error) {
      console.error('Error fetching payout requests:', error);
    }
  };

  const handleCancelPayoutRequest = async (requestId: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Cancel Payout Request',
      message: 'Are you sure you want to cancel this payout request?',
      confirmText: 'Cancel Request',
      cancelText: 'Keep Request',
      variant: 'warning',
    });

    if (!confirmed) return;

    setCancelling(requestId);
    confirmation.setLoading(true);
    try {
      const token = tokenManager.getAccessToken();
      const response = await fetch(getApiUrl(`/payouts/requests/${requestId}/cancel`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Payout request cancelled successfully');
        fetchPayoutRequests();
        fetchEarningsData(); // Refresh available balance
        fetchPayouts();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to cancel payout request');
      }
    } catch (error) {
      console.error('Error cancelling payout request:', error);
      toast.error('Failed to cancel payout request');
    } finally {
      setCancelling(null);
      confirmation.setLoading(false);
    }
  };

  const formatPrice = (priceInKobo: number) => formatNgnFromKobo(priceInKobo);

  const handleRequestPayout = () => {
    if (availableForWithdrawal === 0) {
      toast.error('No funds available for withdrawal');
      return;
    }
    if (availableForWithdrawal < MIN_PAYOUT_AMOUNT) {
      toast.error('Minimum payout is ₦1,000');
      return;
    }
    // Set default amount to available balance
    setPayoutAmount((availableForWithdrawal / 100).toFixed(2));
    setShowPayoutModal(true);
  };

  const handlePayoutModalClose = () => {
    setShowPayoutModal(false);
    setPayoutAmount('');
  };

  const handleSubmitPayoutRequest = async () => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amountInKobo = Math.round(parseFloat(payoutAmount) * 100);

    if (amountInKobo < MIN_PAYOUT_AMOUNT) {
      toast.error('Minimum payout is ₦1,000');
      return;
    }
    
    if (amountInKobo > availableForWithdrawal) {
      toast.error('Amount exceeds available balance');
      return;
    }

    setRequesting(true);
    try {
      const token = tokenManager.getAccessToken();
      const response = await fetch(getApiUrl('/payouts/request'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: amountInKobo }),
      });

      if (response.ok) {
        toast.success(`Payout request submitted for ${formatPrice(amountInKobo)}`);
        handlePayoutModalClose();
        // Refresh data
        fetchEarningsData();
        fetchPayouts();
      } else {
        const error = await response.json();
        toast.error(`Failed to request payout: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast.error('Failed to request payout. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading…</p>
        </div>
      </div>
    );
  }

  // Don't render until auth check is complete
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Earnings - Seller Portal | Carryofy</title>
        <meta
          name="description"
          content="View your earnings and manage payouts on Carryofy."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SellerLayout>
        <div>
          {/* Title Section + Time Filter */}
          <div className="flex flex-wrap justify-between items-start gap-3 p-4">
            <div className="reveal-up">
              <h1 className="font-display tracking-tight text-[32px] font-bold leading-tight text-foreground">
                Earnings
              </h1>
              <p className="text-foreground/60 text-sm mt-1">
                Track your sales revenue and payouts · released after successful delivery.
              </p>
            </div>
            {/* Segmented Time Filter */}
            <div className="flex rounded-lg bg-[var(--color-surface-2)] p-1">
              {(['all', 'month', 'quarter', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                    dateRange === range
                      ? 'bg-primary text-black shadow-sm'
                      : 'text-foreground/60 hover:text-foreground'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Summary Cards */}
          {loading ? (
            <div className="grid grid-cols-1 gap-4 px-4 py-3 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="surface-card h-[168px] animate-pulse" />
              ))}
            </div>
          ) : earningsReport ? (
            <div className="grid grid-cols-1 gap-4 px-4 py-3 reveal-stagger md:grid-cols-2">
              {/* Total Revenue (orange accent) */}
              <div className="surface-card border-l-2 border-l-primary p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/55">Total Revenue</p>
                <p className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground tabular-nums">
                  {formatPrice(earningsReport.totalGross)}
                </p>
                <p className="mt-2 text-xs text-foreground/45">{earningsReport.totalOrders} orders</p>
              </div>

              {/* Net Earnings (success) */}
              <div className="surface-card border-l-2 border-l-success p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-success-soft text-success">
                  <DollarSign className="h-5 w-5" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/55">Net Earnings</p>
                <p className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground tabular-nums">
                  {formatPrice(earningsReport.totalNet)}
                </p>
                <p className="mt-2 text-xs text-foreground/45">After commission</p>
              </div>

              {/* Platform Commission (neutral) */}
              <div className="surface-card p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-surface-2)] text-foreground/60">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/55">Platform Commission</p>
                <p className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground tabular-nums">
                  {formatPrice(earningsReport.totalCommission)}
                </p>
                <p className="mt-2 text-xs text-foreground/45">
                  {earningsReport.totalGross > 0
                    ? `${((earningsReport.totalCommission / earningsReport.totalGross) * 100).toFixed(1)}% of revenue`
                    : '— % of revenue'}
                </p>
              </div>

              {/* Available Balance (primary tint + CTA) */}
              <div className="rounded-2xl border border-primary/40 bg-primary/[0.06] p-6 shadow-[var(--shadow-card)]">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/20 text-primary">
                  <Wallet className="h-5 w-5" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/55">Available Balance</p>
                <p className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground tabular-nums">
                  {formatPrice(availableForWithdrawal)}
                </p>
                <p className="mt-1 text-xs text-foreground/45">Minimum payout: ₦1,000</p>
                <button
                  onClick={handleRequestPayout}
                  disabled={availableForWithdrawal < MIN_PAYOUT_AMOUNT}
                  title={availableForWithdrawal < MIN_PAYOUT_AMOUNT ? 'Minimum payout is ₦1,000' : undefined}
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                    availableForWithdrawal >= MIN_PAYOUT_AMOUNT
                      ? 'bg-primary text-black hover:bg-primary-dark shadow-[var(--shadow-primary-glow)]'
                      : 'cursor-not-allowed bg-[var(--color-surface-2)] text-foreground/40'
                  }`}
                >
                  <Download className="h-4 w-4" />
                  Request Payout
                </button>
              </div>
            </div>
          ) : null}

          {/* Earnings Breakdown */}
          {earningsReport && (
            <div className="px-4 py-3">
              <div className="surface-card p-6">
                <h3 className="mb-4 font-display text-lg font-bold text-foreground">Earnings Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/60">Gross Revenue</span>
                    <span className="text-right font-semibold text-foreground tabular-nums">
                      {formatPrice(earningsReport.totalGross)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-foreground/60">
                      Platform Commission ({earningsReport.totalGross > 0
                        ? ((earningsReport.totalCommission / earningsReport.totalGross) * 100).toFixed(0)
                        : '—'}%)
                      <span
                        className="inline-flex cursor-help text-foreground/40"
                        title="Commission rate depends on your product category (8–15%)"
                      >
                        <Info className="h-4 w-4" />
                      </span>
                    </span>
                    <span className="text-right font-semibold text-primary tabular-nums">
                      -{formatPrice(earningsReport.totalCommission)}
                    </span>
                  </div>
                  <div className="h-px bg-border-custom"></div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-base font-bold text-foreground">Net Earnings</span>
                    <span className="text-right text-base font-bold text-success tabular-nums">
                      {formatPrice(earningsReport.totalNet)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payout Requests Table */}
          {payoutRequests.length > 0 && (
            <div className="px-4 py-3">
              <h3 className="mb-4 font-display text-lg font-bold text-foreground">Payout Requests</h3>
              <div className="surface-card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-custom bg-[var(--color-surface-2)]">
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground/55">Request ID</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground/55">Amount</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground/55">Requested</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground/55">Status</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground/55">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payoutRequests.map((request) => (
                      <tr key={request.id} className="border-t border-border-custom">
                        <td className="h-[72px] px-4 py-2 font-dm-mono text-sm text-foreground/70">
                          #{request.id.slice(0, 8)}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-sm font-bold text-foreground tabular-nums">
                          {formatPrice(request.amount)}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-sm text-foreground/55">
                          {formatDate(request.requestedAt)}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-sm">
                          <StatusBadge status={request.status} tone={payoutTone(request.status)} />
                        </td>
                        <td className="h-[72px] px-4 py-2 text-sm">
                          {request.status === 'REQUESTED' && (
                            <button
                              onClick={() => handleCancelPayoutRequest(request.id)}
                              disabled={cancelling === request.id}
                              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger-soft disabled:opacity-50"
                            >
                              <X className="h-4 w-4" />
                              {cancelling === request.id ? 'Cancelling…' : 'Cancel'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 4.2 — resolved: per-order payout line items (table below) */}
          {/* Payout History Table */}
          <div className="px-4 py-3">
            <h3 className="mb-4 font-display text-lg font-bold text-foreground">Payout History</h3>
            <div className="surface-card overflow-x-auto">
              <table className="w-full table-fixed min-w-[800px]">
                <colgroup>
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '10%' }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-border-custom bg-[var(--color-surface-2)]">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground/55">Order ID</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground/55">Date</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground/55">Gross</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground/55">Commission</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground/55">Rate</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground/55">Net Amount</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground/55">Refunded</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground/55">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12">
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/12 text-primary ring-1 ring-primary/20">
                            <Wallet className="h-6 w-6" />
                          </div>
                          <p className="mb-1 font-semibold text-foreground">No payouts yet</p>
                          <p className="text-sm text-foreground/50">Payouts will appear here once you request your first payout</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    payouts.map((payout) => (
                      <tr key={payout.id} className="border-t border-border-custom">
                        <td className="h-[72px] px-4 py-2 font-dm-mono text-sm text-foreground/70">
                          #{payout.orderId.slice(0, 8)}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-sm text-foreground/55">
                          {formatDate(payout.createdAt)}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-sm text-foreground/70 tabular-nums">
                          {formatPrice(payout.gross)}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-sm text-primary tabular-nums">
                          -{formatPrice(payout.commission)}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-sm text-foreground/55 tabular-nums">
                          {payout.commissionRate ? `${payout.commissionRate}%` : '—'}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-sm font-bold text-foreground tabular-nums">
                          {formatPrice(payout.net)}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-sm">
                          {payout.refundedAmount && payout.refundedAmount > 0 ? (
                            <span className="font-medium text-warning tabular-nums">
                              {formatPrice(payout.refundedAmount)}
                            </span>
                          ) : (
                            <span className="text-foreground/40">—</span>
                          )}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={payout.status} tone={payoutTone(payout.status)} />
                            {payout.isReversed ? (
                              <StatusBadge tone="danger" label="Reversed" dot={false} />
                            ) : null}
                            {!payout.isReversed && (payout.refundedAmount ?? 0) > 0 ? (
                              <StatusBadge tone="warning" label="Refunded" dot={false} />
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payout Request Modal */}
          {showPayoutModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
              <div className="surface-card w-full max-w-md p-6 shadow-[var(--shadow-elevated)] reveal-up">
                <h2 className="mb-1 font-display text-2xl font-bold text-foreground">Request Payout</h2>
                <p className="mb-6 text-sm font-medium text-success">
                  Available balance: {formatPrice(availableForWithdrawal)}
                </p>

                <div className="mb-5">
                  <label className="mb-2 block text-sm font-medium text-foreground">Amount to withdraw</label>
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    max={(availableForWithdrawal / 100).toString()}
                    className="h-14 w-full rounded-xl border border-border-custom bg-[var(--color-surface-2)] p-4 text-base text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none"
                  />
                </div>

                {bankAccount ? (
                  <div className="mb-5 rounded-xl border border-border-custom bg-[var(--color-surface-2)] p-4">
                    <p className="mb-1 text-xs font-medium text-foreground/55">Your payout account details</p>
                    <p className="text-sm text-foreground">{bankAccount.bankName}</p>
                    <p className="font-dm-mono text-sm text-foreground/70">
                      {bankAccount.accountNumber ? bankAccount.accountNumber.replace(/\d(?=\d{4})/g, '*') : 'N/A'}
                    </p>
                  </div>
                ) : (
                  <div className="mb-5 rounded-xl border border-border-custom bg-[var(--color-surface-2)] p-4">
                    <p className="text-sm text-foreground/50">Add your payout account in Settings to receive payouts</p>
                  </div>
                )}

                <p className="mb-5 text-xs text-foreground/45">Payouts are processed within 1–3 business days</p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleSubmitPayoutRequest}
                    disabled={requesting || !bankAccount}
                    className="w-full rounded-xl bg-primary px-6 py-3 font-semibold text-black transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {requesting ? 'Submitting…' : 'Confirm Payout'}
                  </button>
                  <button
                    onClick={handlePayoutModalClose}
                    disabled={requesting}
                    className="text-sm font-medium text-foreground/60 transition hover:text-foreground disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SellerLayout>
      <ConfirmationDialog
        open={confirmation.open}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        variant={confirmation.variant}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
        loading={confirmation.loading}
      />
    </>
  );
}

