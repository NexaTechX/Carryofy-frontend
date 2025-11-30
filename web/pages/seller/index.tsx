import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import SellerLayout from '../../components/seller/SellerLayout';
import DashboardStats from '../../components/seller/DashboardStats';
import SalesTrend from '../../components/seller/SalesTrend';
import OrderDistribution from '../../components/seller/OrderDistribution';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { tokenManager, userManager } from '../../lib/auth';

export default function SellerDashboard() {
  const router = useRouter();

  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [kycExpiresAt, setKycExpiresAt] = useState<string | null>(null);

  useEffect(() => {
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

    if (user.role && user.role !== 'SELLER' && user.role !== 'ADMIN') {
      router.push('/');
    }

    // Fetch KYC status
    fetchKycStatus();
  }, [router]);

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
        setKycExpiresAt(responseData.expiresAt || null);
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error);
    }
  };

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
            <div className={`mx-4 mb-6 p-4 rounded-xl flex items-center justify-between ${
              kycStatus === 'APPROVED' && kycExpiresAt
                ? (() => {
                    const expirationDate = new Date(kycExpiresAt);
                    const now = new Date();
                    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    return daysUntilExpiration <= 30 
                      ? 'bg-yellow-900/30 border border-yellow-500/30' 
                      : 'bg-green-900/30 border border-green-500/30';
                  })()
                : kycStatus === 'APPROVED'
                  ? 'bg-green-900/30 border border-green-500/30'
                  : 'bg-blue-900/30 border border-blue-500/30'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  kycStatus === 'APPROVED' && kycExpiresAt
                    ? (() => {
                        const expirationDate = new Date(kycExpiresAt);
                        const now = new Date();
                        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        return daysUntilExpiration <= 30 
                          ? 'bg-yellow-500/20' 
                          : 'bg-green-500/20';
                      })()
                    : kycStatus === 'APPROVED'
                      ? 'bg-green-500/20'
                      : 'bg-blue-500/20'
                }`}>
                  <svg className={`w-6 h-6 ${
                    kycStatus === 'APPROVED' && kycExpiresAt
                      ? (() => {
                          const expirationDate = new Date(kycExpiresAt);
                          const now = new Date();
                          const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          return daysUntilExpiration <= 30 
                            ? 'text-yellow-400' 
                            : 'text-green-400';
                        })()
                      : kycStatus === 'APPROVED'
                        ? 'text-green-400'
                        : 'text-blue-400'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold">
                    {kycStatus === 'APPROVED' 
                      ? kycExpiresAt && (() => {
                          const expirationDate = new Date(kycExpiresAt);
                          const now = new Date();
                          const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          return daysUntilExpiration <= 30 
                            ? 'KYC Expiring Soon' 
                            : 'Identity Verified';
                        })()
                      : 'Identity Verification Required'}
                  </h3>
                  <p className={`text-sm ${
                    kycStatus === 'APPROVED' && kycExpiresAt
                      ? (() => {
                          const expirationDate = new Date(kycExpiresAt);
                          const now = new Date();
                          const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          return daysUntilExpiration <= 30 
                            ? 'text-yellow-200' 
                            : 'text-green-200';
                        })()
                      : kycStatus === 'APPROVED'
                        ? 'text-green-200'
                        : 'text-blue-200'
                  }`}>
                    {kycStatus === 'APPROVED' && kycExpiresAt
                      ? (() => {
                          const expirationDate = new Date(kycExpiresAt);
                          const now = new Date();
                          const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          return daysUntilExpiration <= 30 
                            ? `Your KYC expires in ${daysUntilExpiration} day${daysUntilExpiration !== 1 ? 's' : ''}. Please complete re-verification.`
                            : 'Your account is fully verified and active.';
                        })()
                      : kycStatus === 'PENDING'
                        ? 'Your verification is under review. You will be able to upload products once approved.'
                        : 'Complete your KYC verification to start selling on Carryofy.'}
                  </p>
                </div>
              </div>
              <Link
                href="/seller/settings?tab=kyc"
                className={`px-4 py-2 text-white text-sm font-bold rounded-lg transition ${
                  kycStatus === 'APPROVED' && kycExpiresAt
                    ? (() => {
                        const expirationDate = new Date(kycExpiresAt);
                        const now = new Date();
                        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        return daysUntilExpiration <= 30 
                          ? 'bg-yellow-600 hover:bg-yellow-700' 
                          : 'bg-green-600 hover:bg-green-700';
                      })()
                    : kycStatus === 'APPROVED'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {kycStatus === 'APPROVED' && kycExpiresAt
                  ? (() => {
                      const expirationDate = new Date(kycExpiresAt);
                      const now = new Date();
                      const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      return daysUntilExpiration <= 30 ? 'Re-verify Now' : 'View Status';
                    })()
                  : kycStatus === 'PENDING' ? 'View Status' : 'Verify Now'}
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

        {/* Floating Action Button */}
        <Link
          href="/seller/products/new"
          className="fixed bottom-6 right-6 bg-[#ff6600] hover:bg-[#cc5200] text-black px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 font-bold transition transform hover:scale-105 z-50"
        >
          <Plus className="w-5 h-5" />
          <span>Add Product</span>
        </Link>
      </SellerLayout>
    </>
  );
}

