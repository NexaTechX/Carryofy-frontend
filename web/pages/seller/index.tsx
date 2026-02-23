import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import SellerLayout from '../../components/seller/SellerLayout';
import DashboardStats from '../../components/seller/DashboardStats';
import SalesTrend from '../../components/seller/SalesTrend';
import OrderDistribution from '../../components/seller/OrderDistribution';
import { Plus, Share2, Eye, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth, tokenManager } from '../../lib/auth';

const KYC_BANNER_DISMISSED_KEY = 'seller-kyc-banner-dismissed';

export default function SellerDashboard() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [kycBannerDismissed, setKycBannerDismissed] = useState(false);
  const [sellerId, setSellerId] = useState<string | null>(null);

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

    // Fetch KYC status and seller profile
    fetchKycStatus();
    fetchSellerProfile();
    if (typeof window !== 'undefined') {
      setKycBannerDismissed(!!sessionStorage.getItem(KYC_BANNER_DISMISSED_KEY));
    }
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

  const fetchSellerProfile = async () => {
    try {
      const token = tokenManager.getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/sellers/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        const seller = result.data || result;
        setSellerId(seller?.id ?? null);
      }
    } catch (error) {
      console.error('Error fetching seller profile:', error);
    }
  };

  const dismissKycBanner = () => {
    setKycBannerDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(KYC_BANNER_DISMISSED_KEY, '1');
    }
  };

  const handleShareStore = async () => {
    if (!sellerId) return;
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/buyer/products?seller=${sellerId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Store link copied!');
    } catch {
      window.open(url, '_blank');
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
        <div className="mx-auto max-w-[1200px] px-8 flex flex-col gap-6">
          {/* KYC Status Toast — slim 40px dismissible bar */}
          {kycStatus && !kycBannerDismissed && (
            <div
              className={`h-10 flex items-center justify-between gap-3 rounded-lg px-4 ${
                kycStatus === 'APPROVED'
                  ? 'bg-green-900/40 border border-green-500/30'
                  : kycStatus === 'PENDING'
                    ? 'bg-yellow-900/40 border border-yellow-500/30'
                    : kycStatus === 'REJECTED'
                      ? 'bg-red-900/40 border border-red-500/30'
                      : 'bg-blue-900/40 border border-blue-500/30'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-white text-sm font-medium truncate">
                  {kycStatus === 'APPROVED'
                    ? 'Identity Verified — Your account is fully verified'
                    : kycStatus === 'PENDING'
                      ? 'Verification Under Review'
                      : kycStatus === 'REJECTED'
                        ? 'Verification Rejected — Please resubmit'
                        : 'Complete your KYC verification to start selling'}
                </span>
                <Link
                  href="/seller/settings?tab=kyc"
                  className={`shrink-0 text-xs font-bold px-3 py-1 rounded-md transition ${
                    kycStatus === 'APPROVED'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : kycStatus === 'PENDING'
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : kycStatus === 'REJECTED'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {kycStatus === 'REJECTED' ? 'Resubmit' : 'View'}
                </Link>
              </div>
              <button
                onClick={dismissKycBanner}
                className="shrink-0 p-1 rounded hover:bg-white/10 text-white/80 hover:text-white transition"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <p className="text-white tracking-light text-[32px] font-bold leading-tight">Dashboard</p>

          {/* Stats Cards */}
          <DashboardStats />

          {/* Quick Actions */}
          <div className="flex items-center gap-3 h-10 px-4 rounded-[12px] bg-[#1A1A1A] border border-[#2A2A2A]">
            <Link
              href="/seller/products/new"
              className="flex items-center gap-2 text-[#FF6B00] hover:text-[#FF6B00]/80 transition"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className="text-[13px] font-medium text-white">Add Product</span>
            </Link>
            <span className="w-px h-5 bg-[#2A2A2A]" />
            <button
              onClick={handleShareStore}
              disabled={!sellerId}
              className="flex items-center gap-2 text-[#FF6B00] hover:text-[#FF6B00]/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Share2 className="h-4 w-4 shrink-0" />
              <span className="text-[13px] font-medium text-white">Share Store Link</span>
            </button>
            <span className="w-px h-5 bg-[#2A2A2A]" />
            <Link
              href={sellerId ? `/buyer/products?seller=${sellerId}` : '#'}
              className={`flex items-center gap-2 ${sellerId ? 'text-[#FF6B00] hover:text-[#FF6B00]/80' : 'text-[#A0A0A0] cursor-not-allowed pointer-events-none'} transition`}
            >
              <Eye className="h-4 w-4 shrink-0" />
              <span className="text-[13px] font-medium text-white">View Store</span>
            </Link>
          </div>

          {/* Charts */}
          <div className="flex flex-wrap gap-6">
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

