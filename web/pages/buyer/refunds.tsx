import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import { Gift, ArrowLeft, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { getUserRefunds, Refund } from '../../lib/api/refunds';

export default function RefundsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Check authentication
    if (!tokenManager.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    const user = userManager.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role && user.role !== 'BUYER' && user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    if (mounted) {
      fetchRefunds();
    }
  }, [mounted]);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserRefunds();
      setRefunds(data);
    } catch (err: any) {
      console.error('Error fetching refunds:', err);
      setError(err.response?.data?.message || 'Failed to load refunds');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceInKobo: number) => {
    return `₦${(priceInKobo / 100).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: React.ReactElement }> = {
      REQUESTED: {
        label: 'Requested',
        className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
        icon: <Clock className="w-3 h-3" />,
      },
      APPROVED: {
        label: 'Approved',
        className: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        icon: <CheckCircle2 className="w-3 h-3" />,
      },
      PROCESSING: {
        label: 'Processing',
        className: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        icon: <AlertCircle className="w-3 h-3" />,
      },
      COMPLETED: {
        label: 'Completed',
        className: 'bg-green-500/10 text-green-400 border-green-500/30',
        icon: <CheckCircle2 className="w-3 h-3" />,
      },
      REJECTED: {
        label: 'Rejected',
        className: 'bg-red-500/10 text-red-400 border-red-500/30',
        icon: <XCircle className="w-3 h-3" />,
      },
    };

    const config = statusConfig[status] || {
      label: status,
      className: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
      icon: <Clock className="w-3 h-3" />,
    };

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${config.className}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>My Refunds - Buyer | Carryofy</title>
        <meta
          name="description"
          content="View and track your refund requests on Carryofy."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <BuyerLayout>
        <div>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Link
                href="/buyer/orders"
                className="inline-flex items-center gap-2 text-[#ffcc99]/80 hover:text-[#ffcc99] transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Orders
              </Link>
            </div>
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <Gift className="w-8 h-8 text-[#ff6600]" />
              My Refunds
            </h1>
            <p className="text-[#ffcc99] text-lg">
              Track the status of your refund requests
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6600]"></div>
              <p className="text-[#ffcc99] mt-4">Loading refunds...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchRefunds}
                className="px-6 py-2 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Refunds Content */}
          {!loading && !error && (
            <>
              {refunds.length === 0 ? (
                // Empty State
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-2xl p-12 text-center">
                  <Gift className="w-20 h-20 text-[#ffcc99]/50 mx-auto mb-4" />
                  <h2 className="text-white text-2xl font-bold mb-2">No refund requests</h2>
                  <p className="text-[#ffcc99] mb-6">
                    You haven't requested any refunds yet.
                  </p>
                  <Link
                    href="/buyer/orders"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition"
                  >
                    View Orders
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {refunds.map((refund) => (
                    <div
                      key={refund.id}
                      className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 hover:border-[#ff6600] transition"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            {getStatusBadge(refund.status)}
                            <span className="text-[#ffcc99]/70 text-sm">
                              Requested: {formatDate(refund.createdAt)}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <p className="text-[#ffcc99]/70 text-sm">Order ID</p>
                              <Link
                                href={`/buyer/orders/${refund.orderId}`}
                                className="text-[#ff6600] hover:underline font-medium"
                              >
                                {refund.orderId.slice(0, 8)}...
                              </Link>
                            </div>
                            
                            <div>
                              <p className="text-[#ffcc99]/70 text-sm">Refund Amount</p>
                              <p className="text-[#ff6600] text-2xl font-bold">
                                {formatPrice(refund.amount)}
                              </p>
                            </div>

                            <div>
                              <p className="text-[#ffcc99]/70 text-sm mb-1">Reason</p>
                              <p className="text-white">{refund.reason}</p>
                            </div>

                            {refund.adminNotes && (
                              <div>
                                <p className="text-[#ffcc99]/70 text-sm mb-1">Admin Notes</p>
                                <p className="text-[#ffcc99]">{refund.adminNotes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </BuyerLayout>
    </>
  );
}

