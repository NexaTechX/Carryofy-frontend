import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import SellerLayout from '../../components/seller/SellerLayout';
import DashboardStats from '../../components/seller/DashboardStats';
import SalesTrend from '../../components/seller/SalesTrend';
import OrderDistribution from '../../components/seller/OrderDistribution';
import { Plus, Share2, Eye } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth, tokenManager } from '../../lib/auth';
import { getApiBaseUrl } from '../../lib/api/utils';

export default function SellerDashboard() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  const [kycStatus, setKycStatus] = useState<string | null>(null);
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

    // Fetch KYC status and seller profile (KYC banner is in SellerLayout)
    fetchKycStatus();
    fetchSellerProfile();
  }, [router, isLoading, isAuthenticated, user]);

  const fetchKycStatus = async () => {
    try {
      const token = tokenManager.getAccessToken();
      const apiUrl = getApiBaseUrl();

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
      const apiUrl = getApiBaseUrl();

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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500"></div>
          <p className="text-sm text-gray-500">Loading...</p>
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
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Dashboard</h1>

          {/* Stats Cards */}
          <DashboardStats />

          {/* Quick Actions */}
          <div>
            <h2 className="dashboard-section-title">Quick actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Link
                href="/seller/products/new"
                className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-orange-200 hover:bg-orange-50"
              >
                <div className="rounded-lg bg-orange-100 p-2">
                  <Plus className="h-5 w-5 text-orange-500" />
                </div>
                <span className="mt-2 text-center text-xs font-medium text-gray-600">Add product</span>
              </Link>
              <button
                type="button"
                onClick={handleShareStore}
                disabled={!sellerId}
                className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="rounded-lg bg-orange-100 p-2">
                  <Share2 className="h-5 w-5 text-orange-500" />
                </div>
                <span className="mt-2 text-center text-xs font-medium text-gray-600">Share store link</span>
              </button>
              <Link
                href={sellerId ? `/buyer/products?seller=${sellerId}` : '#'}
                className={`flex flex-col items-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 ${!sellerId ? 'pointer-events-none opacity-50' : ''}`}
              >
                <div className="rounded-lg bg-orange-100 p-2">
                  <Eye className="h-5 w-5 text-orange-500" />
                </div>
                <span className="mt-2 text-center text-xs font-medium text-gray-600">View store</span>
              </Link>
            </div>
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
            className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 rounded-xl bg-orange-500 px-6 py-3 font-medium text-white shadow-lg transition hover:bg-orange-600"
          >
            <Plus className="h-5 w-5" />
            <span>Add Product</span>
          </Link>
        ) : (
          <button
            disabled
            title="Complete KYC verification to add products"
            className="fixed bottom-6 right-6 z-50 flex cursor-not-allowed items-center space-x-2 rounded-xl border border-gray-200 bg-gray-100 px-6 py-3 font-medium text-gray-400 shadow-sm"
          >
            <Plus className="h-5 w-5" />
            <span>Add Product</span>
          </button>
        )}
      </SellerLayout>
    </>
  );
}

