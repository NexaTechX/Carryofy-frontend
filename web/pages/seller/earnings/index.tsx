import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import SellerLayout from '../../../components/seller/SellerLayout';
import { useAuth, tokenManager } from '../../../lib/auth';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Download } from 'lucide-react';

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
  net: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function EarningsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [earningsReport, setEarningsReport] = useState<EarningsReport | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [availableForWithdrawal, setAvailableForWithdrawal] = useState(0);
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'quarter' | 'year'>('all');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [requesting, setRequesting] = useState(false);

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
  }, [router, dateRange, authLoading, isAuthenticated, user]);

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
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const { startDate, endDate } = getDateRangeParams();
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`${apiUrl}/reports/earnings?${params.toString()}`, {
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
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/payouts`, {
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

  const formatPrice = (priceInKobo: number) => {
    return `₦${(priceInKobo / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'APPROVED':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'PAID':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-[#1a1a1a] text-white border-[#ff6600]/30';
    }
  };

  const handleRequestPayout = () => {
    if (availableForWithdrawal === 0) {
      toast.error('No funds available for withdrawal');
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
    
    if (amountInKobo > availableForWithdrawal) {
      toast.error('Amount exceeds available balance');
      return;
    }

    setRequesting(true);
    try {
      const token = tokenManager.getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/payouts/request`, {
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
          {/* Title Section */}
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <div>
              <p className="text-white tracking-light text-[32px] font-bold leading-tight min-w-72">
                Earnings
              </p>
              <p className="text-[#ffcc99] text-sm font-normal leading-normal mt-1">
                Track your sales revenue and payouts
              </p>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="px-4 py-3">
            <div className="flex gap-2">
              {(['all', 'month', 'quarter', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    dateRange === range
                      ? 'bg-[#ff6600] text-black'
                      : 'bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] hover:bg-[#ff6600]/10'
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 py-3">
              {/* Total Revenue Card */}
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-[#ff6600]/20 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-[#ff6600]" />
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

              {/* Commission Card */}
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-500/20 rounded-xl">
                    <TrendingDown className="w-6 h-6 text-red-400" />
                  </div>
                </div>
                <p className="text-[#ffcc99] text-sm font-medium mb-1">Commission</p>
                <p className="text-white text-2xl font-bold">
                  {formatPrice(earningsReport.totalCommission)}
                </p>
                <p className="text-[#ffcc99] text-xs mt-2">
                  {((earningsReport.totalCommission / earningsReport.totalGross) * 100).toFixed(1)}% of revenue
                </p>
              </div>

              {/* Net Earnings Card */}
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
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

              {/* Available for Withdrawal Card */}
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Wallet className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <p className="text-[#ffcc99] text-sm font-medium mb-1">Available</p>
                <p className="text-white text-2xl font-bold">
                  {formatPrice(availableForWithdrawal)}
                </p>
                <button
                  onClick={handleRequestPayout}
                  disabled={availableForWithdrawal === 0}
                  className="mt-3 w-full px-4 py-2 bg-[#ff6600] text-black text-sm font-bold rounded-xl hover:bg-[#cc5200] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                    <span className="text-white font-semibold">
                      {formatPrice(earningsReport.totalGross)}
                    </span>
                  </div>
                  <div className="h-px bg-[#ff6600]/30"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#ffcc99]">Platform Commission</span>
                    <span className="text-red-400 font-semibold">
                      -{formatPrice(earningsReport.totalCommission)}
                    </span>
                  </div>
                  <div className="h-px bg-[#ff6600]/30"></div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-white font-bold text-lg">Net Earnings</span>
                    <span className="text-[#ff6600] font-bold text-lg">
                      {formatPrice(earningsReport.totalNet)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payout History Table */}
          <div className="px-4 py-3">
            <h3 className="text-white text-lg font-bold mb-4">Payout History</h3>
            <div className="flex overflow-hidden rounded-xl border border-[#ff6600]/30 bg-black">
              <table className="flex-1">
                <thead>
                  <tr className="bg-[#1a1a1a]">
                    <th className="px-4 py-3 text-left text-white text-sm font-medium leading-normal">
                      Order ID
                    </th>
                    <th className="px-4 py-3 text-left text-white text-sm font-medium leading-normal">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-white text-sm font-medium leading-normal">
                      Gross
                    </th>
                    <th className="px-4 py-3 text-left text-white text-sm font-medium leading-normal">
                      Commission
                    </th>
                    <th className="px-4 py-3 text-left text-white text-sm font-medium leading-normal">
                      Net Amount
                    </th>
                    <th className="px-4 py-3 text-left text-white text-sm font-medium leading-normal">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-white">
                        No payout history available
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
                        <td className="h-[72px] px-4 py-2 text-red-400 text-sm font-normal leading-normal">
                          -{formatPrice(payout.commission)}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-white text-sm font-bold leading-normal">
                          {formatPrice(payout.net)}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-sm font-normal leading-normal">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${getStatusBadgeColor(
                              payout.status
                            )}`}
                          >
                            {payout.status}
                          </span>
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
              <div className="bg-[#1a1a1a] border border-[#ff6600]/50 rounded-xl p-6 max-w-md w-full">
                <h2 className="text-white text-2xl font-bold mb-4">Request Payout</h2>
                <p className="text-[#ffcc99] text-sm mb-6">
                  Enter the amount you want to withdraw. Available balance: {formatPrice(availableForWithdrawal)}
                </p>
                
                <div className="mb-6">
                  <label className="block text-white text-sm font-medium mb-2">
                    Amount (₦) *
                  </label>
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    max={(availableForWithdrawal / 100).toString()}
                    className="form-input flex w-full resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#ff6600]/30 bg-black focus:border-[#ff6600] h-14 placeholder:text-[#ffcc99] p-4 text-base font-normal leading-normal"
                  />
                  <p className="text-[#ffcc99] text-xs mt-2">
                    Maximum: ₦{(availableForWithdrawal / 100).toFixed(2)}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitPayoutRequest}
                    disabled={requesting}
                    className="flex-1 bg-[#ff6600] hover:bg-[#cc5200] disabled:bg-[#ff6600]/50 disabled:cursor-not-allowed text-black px-6 py-3 rounded-xl font-semibold transition"
                  >
                    {requesting ? 'Submitting...' : 'Submit Request'}
                  </button>
                  <button
                    onClick={handlePayoutModalClose}
                    disabled={requesting}
                    className="px-6 py-3 bg-black border border-[#ff6600]/30 text-[#ffcc99] rounded-xl font-semibold hover:bg-[#ff6600]/10 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SellerLayout>
    </>
  );
}

