import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import SellerLayout from '../../components/seller/SellerLayout';
import DashboardStats from '../../components/seller/DashboardStats';
import SalesTrend from '../../components/seller/SalesTrend';
import OrderDistribution from '../../components/seller/OrderDistribution';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useAuth, tokenManager } from '../../lib/auth';

export default function SellerDashboard() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  const [kycStatus, setKycStatus] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (isLoading) return;

    // Check authentication
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    if (user.role && user.role !== 'SELLER' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    // Fetch KYC status
    fetchKycStatus();
  }, [router, isLoading, isAuthenticated, user]);

  const fetchKycStatus = async () => {
    try {
      const token = tokenManager.getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/sellers/kyc`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const responseData = data.data || data;
        setKycStatus(responseData.status);
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error);
    }
  };

  // Show loading state while auth is initializing
  if (isLoading) {
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
        <title>Dashboard - Seller Portal | Carryofy</title>
        <meta
          name="description"
          content="Seller dashboard for managing products, orders, and earnings on Carryofy."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SellerLayout>
        <div>
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <p className="text-white tracking-light text-[32px] font-bold leading-tight min-w-72">
              Dashboard
            </p>
          </div>

          {/* KYC Status Widget */}
          {kycStatus && (
            <div className={`mx-4 mb-6 p-4 rounded-xl flex items-center justify-between ${kycStatus === 'APPROVED'
                ? 'bg-green-900/30 border border-green-500/30'
                : kycStatus === 'PENDING'
                  ? 'bg-yellow-900/30 border border-yellow-500/30'
                  : kycStatus === 'REJECTED'
                    ? 'bg-red-900/30 border border-red-500/30'
                    : 'bg-blue-900/30 border border-blue-500/30'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${kycStatus === 'APPROVED' ? 'bg-green-500/20'
                    : kycStatus === 'PENDING' ? 'bg-yellow-500/20'
                      : kycStatus === 'REJECTED' ? 'bg-red-500/20'
                        : 'bg-blue-500/20'
                  }`}>
                  <svg className={`w-6 h-6 ${kycStatus === 'APPROVED' ? 'text-green-400'
                      : kycStatus === 'PENDING' ? 'text-yellow-400'
                        : kycStatus === 'REJECTED' ? 'text-red-400'
                          : 'text-blue-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold">
                    {kycStatus === 'APPROVED'
                      ? 'Identity Verified'
                      : kycStatus === 'PENDING'
                        ? 'Verification Under Review'
                        : kycStatus === 'REJECTED'
                          ? 'Verification Rejected'
                          : 'Identity Verification Required'}
                  </h3>
                  <p className={`text-sm ${kycStatus === 'APPROVED' ? 'text-green-200'
                      : kycStatus === 'PENDING' ? 'text-yellow-200'
                        : kycStatus === 'REJECTED' ? 'text-red-200'
                          : 'text-blue-200'
                    }`}>
                    {kycStatus === 'APPROVED'
                      ? 'Your account is fully verified. Your KYC never expires.'
                      : kycStatus === 'PENDING'
                        ? 'Your verification is under review. You will be able to upload products once approved.'
                        : kycStatus === 'REJECTED'
                          ? 'Your KYC was rejected. Please resubmit with corrected documents.'
                          : 'Complete your KYC verification to start selling on Carryofy.'}
                  </p>
                </div>
              </div>
              <Link
                href="/seller/settings?tab=kyc"
                className={`px-4 py-2 text-white text-sm font-bold rounded-lg transition ${kycStatus === 'APPROVED' ? 'bg-green-600 hover:bg-green-700'
                    : kycStatus === 'PENDING' ? 'bg-yellow-600 hover:bg-yellow-700'
                      : kycStatus === 'REJECTED' ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {kycStatus === 'APPROVED' ? 'View Status'
                  : kycStatus === 'PENDING' ? 'View Status'
                    : kycStatus === 'REJECTED' ? 'Resubmit KYC'
                      : 'Verify Now'}
              </Link>
            </div>
          )}

          {/* Stats Cards */}
          <DashboardStats />

          {/* Charts */}
          <div className="flex flex-wrap gap-4 px-4 py-6">
            <SalesTrend />
            <OrderDistribution />
          </div>
        </div>

        {/* Floating Action Button — only enabled for KYC-approved sellers */}
        {kycStatus === 'APPROVED' ? (
          <Link
            href="/seller/products/new"
            className="fixed bottom-6 right-6 bg-[#ff6600] hover:bg-[#cc5200] text-black px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 font-bold transition transform hover:scale-105 z-50"
          >
            <Plus className="w-5 h-5" />
            <span>Add Product</span>
          </Link>
        ) : (
          <button
            disabled
            title="Complete KYC verification to add products"
            className="fixed bottom-6 right-6 bg-[#333]/70 text-[#ffcc99]/30 px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 font-bold cursor-not-allowed z-50 border border-[#ff6600]/10"
          >
            <Plus className="w-5 h-5" />
            <span>Add Product</span>
          </button>
        )}
      </SellerLayout>
    </>
  );
}

