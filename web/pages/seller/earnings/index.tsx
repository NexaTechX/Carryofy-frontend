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
      const response = await fetch(getApiUrl('/payouts'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const payoutsData = result.data || result;
        const payoutsList = Array.isArray(payoutsData) ? payoutsData : [];

        setPayouts(payoutsList);

        // Calculate available for withdrawal (pending payouts)
        const pendingTotal = payoutsList
          .filter((p: Payout) => p.status === 'PENDING')
          .reduce((sum: number, p: Payout) => sum + p.net, 0);
        setAvailableForWithdrawal(pendingTotal);
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'REQUESTED':
      case 'PROCESSING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'PAID':
      case 'APPROVED':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'REFUNDED':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'CANCELLED':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-[#1a1a1a] text-white border-[#ff6600]/30';
    }
  };

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#ffcc99]">Loading...</p>
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
            <div>
              <p className="text-white tracking-light text-[32px] font-bold leading-tight min-w-72">
                Earnings
              </p>
              <p className="text-[#ffcc99] text-sm font-normal leading-normal mt-1">
                Track your sales revenue and payouts
              </p>
              <p className="text-[#ffcc99]/90 text-sm mt-1">
                Earnings released after successful delivery.
              </p>
            </div>
            {/* Segmented Time Filter */}
            <div className="flex bg-[#1A1A1A] p-1 rounded-[6px]">
              {(['all', 'month', 'quarter', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded-[5px] text-sm font-medium transition-colors ${
                    dateRange === range
                      ? 'bg-[#FF6B00] text-white'
                      : 'text-[#ffcc99] hover:bg-white/5'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Summary Cards */}
          {loading ? (
            <div className="px-4 py-8 text-center text-white">Loading...</div>
          ) : earningsReport ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 py-3">
              {/* Top-left: Total Revenue (largest, orange accent) */}
              <div className="bg-[#1a1a1a] border border-[#FF6B00]/40 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-[#FF6B00]/20 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-[#FF6B00]" />
                  </div>
                </div>
                <p className="text-[#ffcc99] text-sm font-medium mb-1">Total Revenue</p>
                <p className="text-white text-2xl font-bold">
                  {formatPrice(earningsReport.totalGross)}
                </p>
                <p className="text-[#ffcc99] text-xs mt-2">
                  {earningsReport.totalOrders} orders
                </p>
              </div>

              {/* Top-right: Net Earnings (green left border) */}
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 border-l-4 border-l-[#22C55E]">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <p className="text-[#ffcc99] text-sm font-medium mb-1">Net Earnings</p>
                <p className="text-white text-2xl font-bold">
                  {formatPrice(earningsReport.totalNet)}
                </p>
                <p className="text-[#ffcc99] text-xs mt-2">
                  After commission
                </p>
              </div>

              {/* Bottom-left: Platform Commission (neutral) */}
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-[#2a2a2a] rounded-xl">
                    <TrendingDown className="w-6 h-6 text-[#ffcc99]" />
                  </div>
                </div>
                <p className="text-[#ffcc99] text-sm font-medium mb-1">Platform Commission</p>
                <p className="text-white text-2xl font-bold">
                  {formatPrice(earningsReport.totalCommission)}
                </p>
                <p className={`text-xs mt-2 ${earningsReport.totalGross > 0 ? 'text-[#ffcc99]' : 'text-[#A0A0A0]'}`}>
                  {earningsReport.totalGross > 0
                    ? `${((earningsReport.totalCommission / earningsReport.totalGross) * 100).toFixed(1)}% of revenue`
                    : '— % of revenue'}
                </p>
              </div>

              {/* Bottom-right: Available Balance (special styling) */}
              <div className="p-6" style={{ backgroundColor: '#FF6B0010', border: '1px solid #FF6B0040', borderRadius: '12px' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: '#FF6B0020' }}>
                    <Wallet className="w-6 h-6" style={{ color: '#FF6B00' }} />
                  </div>
                </div>
                <p className="text-[#ffcc99] text-sm font-medium mb-1">Available Balance</p>
                <p className="text-white text-2xl font-bold font-dm-mono" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {formatPrice(availableForWithdrawal)}
                </p>
                <p className="text-[#A0A0A0] text-xs mt-1">Minimum payout: ₦1,000</p>
                <button
                  onClick={handleRequestPayout}
                  disabled={availableForWithdrawal < MIN_PAYOUT_AMOUNT}
                  title={availableForWithdrawal < MIN_PAYOUT_AMOUNT ? 'Minimum payout is ₦1,000' : undefined}
                  className={`mt-4 w-full px-4 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                    availableForWithdrawal >= MIN_PAYOUT_AMOUNT
                      ? 'bg-[#FF6B00] text-white hover:bg-[#FF6B00]/90 animate-glow-pulse'
                      : 'bg-[#2a2a2a] text-[#A0A0A0] cursor-not-allowed'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Request Payout
                </button>
              </div>
            </div>
          ) : null}

          {/* Earnings Breakdown */}
          {earningsReport && (
            <div className="px-4 py-3">
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                <h3 className="text-white text-lg font-bold mb-4">Earnings Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[#ffcc99]">Gross Revenue</span>
                    <span className="text-white font-semibold text-right">
                      {formatPrice(earningsReport.totalGross)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#ffcc99] flex items-center gap-1.5">
                      Platform Commission ({earningsReport.totalGross > 0
                        ? ((earningsReport.totalCommission / earningsReport.totalGross) * 100).toFixed(0)
                        : '—'}%)
                      <span
                        className="inline-flex text-[#A0A0A0] cursor-help"
                        title="Commission rate depends on your product category (8–15%)"
                      >
                        <Info className="w-4 h-4" />
                      </span>
                    </span>
                    <span className="text-[#FF6B00] font-semibold text-right">
                      -{formatPrice(earningsReport.totalCommission)}
                    </span>
                  </div>
                  <div className="h-px bg-[#2A2A2A]"></div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-white font-bold text-base">Net Earnings</span>
                    <span className="text-[#22C55E] font-bold text-base text-right">
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
              <h3 className="text-white text-lg font-bold mb-4">Payout Requests</h3>
              <div className="flex overflow-hidden rounded-xl border border-[#ff6600]/30 bg-black">
                <table className="flex-1">
                  <thead>
                    <tr className="bg-[#1a1a1a]">
                      <th className="px-4 py-3 text-left text-white text-sm font-medium leading-normal">
                        Request ID
                      </th>
                      <th className="px-4 py-3 text-left text-white text-sm font-medium leading-normal">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-white text-sm font-medium leading-normal">
                        Requested
                      </th>
                      <th className="px-4 py-3 text-left text-white text-sm font-medium leading-normal">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-white text-sm font-medium leading-normal">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payoutRequests.map((request) => (
                      <tr
                        key={request.id}
                        className="border-t border-t-[#ff6600]/30"
                      >
                        <td className="h-[72px] px-4 py-2 text-white text-sm font-normal leading-normal">
                          #{request.id.slice(0, 8)}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-white text-sm font-bold leading-normal">
                          {formatPrice(request.amount)}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-[#ffcc99] text-sm font-normal leading-normal">
                          {formatDate(request.requestedAt)}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-sm font-normal leading-normal">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${getStatusBadgeColor(
                              request.status
                            )}`}
                          >
                            {request.status}
                          </span>
                        </td>
                        <td className="h-[72px] px-4 py-2 text-sm font-normal leading-normal">
                          {request.status === 'REQUESTED' && (
                            <button
                              onClick={() => handleCancelPayoutRequest(request.id)}
                              disabled={cancelling === request.id}
                              className="flex items-center gap-1 px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
                            >
                              <X className="w-4 h-4" />
                              {cancelling === request.id ? 'Cancelling...' : 'Cancel'}
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

          {/* Payout History Table */}
          <div className="px-4 py-3">
            <h3 className="text-white text-lg font-bold mb-4">Payout History</h3>
            <div className="overflow-x-auto rounded-xl border border-[#ff6600]/30 bg-black">
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
                  <tr className="bg-[#1a1a1a]">
                    <th className="px-4 py-3 text-left text-white text-sm font-medium leading-normal">Order ID</th>
                    <th className="px-4 py-3 text-left text-white text-sm font-medium leading-normal">Date</th>
                    <th className="px-4 py-3 text-left text-white text-sm font-medium leading-normal">Gross</th>
                    <th className="px-4 py-3 text-left text-white text-sm font-medium leading-normal">Commission</th>
                    <th className="px-4 py-3 text-left text-white text-sm font-medium leading-normal">Rate</th>
                    <th className="px-4 py-3 text-left text-white text-sm font-medium leading-normal">Net Amount</th>
                    <th className="px-4 py-3 text-left text-white text-sm font-medium leading-normal">Refunded</th>
                    <th className="px-4 py-3 text-left text-white text-sm font-medium leading-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12">
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="w-10 h-10 mb-3 flex items-center justify-center rounded-full" style={{ backgroundColor: '#FF6B0020' }}>
                            <Wallet className="w-10 h-10" style={{ color: '#FF6B00' }} />
                          </div>
                          <p className="text-white font-semibold mb-1">No payouts yet</p>
                          <p className="text-[#A0A0A0] text-sm">Payouts will appear here once you request your first payout</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    payouts.map((payout) => (
                      <tr
                        key={payout.id}
                        className="border-t border-t-[#ff6600]/30"
                      >
                        <td className="h-[72px] px-4 py-2 text-white text-sm font-normal leading-normal">
                          #{payout.orderId.slice(0, 8)}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-[#ffcc99] text-sm font-normal leading-normal">
                          {formatDate(payout.createdAt)}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-[#ffcc99] text-sm font-normal leading-normal">
                          {formatPrice(payout.gross)}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-[#FF6B00] text-sm font-normal leading-normal">
                          -{formatPrice(payout.commission)}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-[#ffcc99] text-sm font-normal leading-normal">
                          {payout.commissionRate ? `${payout.commissionRate}%` : '—'}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-white text-sm font-bold leading-normal">
                          {formatPrice(payout.net)}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-sm font-normal leading-normal">
                          {payout.refundedAmount && payout.refundedAmount > 0 ? (
                            <span className="text-yellow-400 font-medium">
                              {formatPrice(payout.refundedAmount)}
                            </span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-sm font-normal leading-normal">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${getStatusBadgeColor(
                                payout.status
                              )}`}
                            >
                              {payout.status}
                            </span>
                            {payout.isReversed ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border bg-red-500/20 text-red-400 border-red-500/30">
                                Reversed
                              </span>
                            ) : null}
                            {!payout.isReversed && (payout.refundedAmount ?? 0) > 0 ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                Refunded
                              </span>
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
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-[#1a1a1a] border border-[#FF6B00]/50 rounded-xl p-6 max-w-md w-full">
                <h2 className="text-white text-2xl font-bold mb-4">Request Payout</h2>
                <p className="text-[#22C55E] text-sm font-medium mb-6">
                  Available balance: {formatPrice(availableForWithdrawal)}
                </p>

                <div className="mb-5">
                  <label className="block text-white text-sm font-medium mb-2">
                    Amount to withdraw
                  </label>
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    max={(availableForWithdrawal / 100).toString()}
                    className="form-input flex w-full resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#ff6600]/30 bg-black focus:border-[#FF6B00] h-14 placeholder:text-[#ffcc99] p-4 text-base font-normal leading-normal"
                  />
                </div>

                {bankAccount ? (
                  <div className="mb-5 p-4 rounded-xl bg-black/50 border border-[#2A2A2A]">
                    <p className="text-[#ffcc99] text-xs font-medium mb-1">Your payout account details</p>
                    <p className="text-white text-sm">{bankAccount.bankName}</p>
                    <p className="text-[#ffcc99] text-sm font-mono">
                      {bankAccount.accountNumber ? bankAccount.accountNumber.replace(/\d(?=\d{4})/g, '*') : 'N/A'}
                    </p>
                  </div>
                ) : (
                  <div className="mb-5 p-4 rounded-xl bg-black/50 border border-[#2A2A2A]">
                    <p className="text-[#A0A0A0] text-sm">Add your payout account in Settings to receive payouts</p>
                  </div>
                )}

                <p className="text-[#A0A0A0] text-xs mb-5">
                  Payouts are processed within 1–3 business days
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleSubmitPayoutRequest}
                    disabled={requesting || !bankAccount}
                    className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90 disabled:bg-[#FF6B00]/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition"
                  >
                    {requesting ? 'Submitting...' : 'Confirm Payout'}
                  </button>
                  <button
                    onClick={handlePayoutModalClose}
                    disabled={requesting}
                    className="text-[#ffcc99] hover:text-white text-sm font-medium transition disabled:opacity-50"
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

