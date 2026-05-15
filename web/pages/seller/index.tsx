import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import SellerLayout from '../../components/seller/SellerLayout';
import DashboardStats from '../../components/seller/DashboardStats';
import SalesTrend from '../../components/seller/SalesTrend';
import OrderDistribution from '../../components/seller/OrderDistribution';
import { Plus, Share2, Eye, Rocket } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth, tokenManager } from '../../lib/auth';
import { getApiBaseUrl, getApiUrl, formatNgnFromKobo } from '../../lib/api/utils';
import { resolveSellerKycStatus } from '../../lib/seller/kyc-status';

interface RecentOrderRow {
  id: string;
  title: string;
  buyer: string;
  timeLabel: string;
  amountLabel: string;
  badgeClass: string;
  badgeLabel: string;
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 3600) return `${Math.max(1, Math.floor(sec / 60))}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 172800) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function badgeForSellerOrder(status: string, delivery?: { status?: string }): { label: string; badgeClass: string } {
  const s = (status || '').toUpperCase();
  if (delivery?.status === 'DELIVERED' || s === 'DELIVERED')
    return { label: 'Delivered', badgeClass: 'bg-emerald-500/10 text-emerald-400' };
  if (s === 'CANCELED' || s === 'CANCELLED')
    return { label: 'Cancelled', badgeClass: 'bg-red-500/10 text-red-400' };
  if (s === 'OUT_FOR_DELIVERY' || delivery?.status === 'IN_TRANSIT' || delivery?.status === 'PICKED_UP')
    return { label: 'In transit', badgeClass: 'bg-sky-500/10 text-sky-400' };
  if (s === 'PENDING_PAYMENT')
    return { label: 'Awaiting payment', badgeClass: 'bg-gray-500/10 text-gray-400' };
  if (s === 'PAID' || s === 'PROCESSING')
    return { label: 'Prepare order', badgeClass: 'bg-orange-500/10 text-orange-500' };
  return { label: s.replace(/_/g, ' ') || 'Pending', badgeClass: 'bg-orange-500/10 text-orange-500' };
}

export default function SellerDashboard() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrderRow[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    if (user.role && user.role !== 'SELLER' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchKycStatus();
    fetchSellerProfile();
  }, [router, isLoading, isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const loadRecent = async () => {
      setRecentLoading(true);
      try {
        const token = tokenManager.getAccessToken();
        if (!token) return;
        const res = await fetch(getApiUrl('/orders'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setRecentOrders([]);
          return;
        }
        const result = await res.json();
        const data = result.data || result;
        const orders = Array.isArray(data?.orders) ? data.orders : Array.isArray(data) ? data : [];
        const rows: RecentOrderRow[] = orders.slice(0, 3).map((o: any) => {
          const first = o.items?.[0];
          const product = first?.product;
          const title = product?.title ?? 'Order';
          const buyer = o.user?.name ?? o.user?.email ?? 'Customer';
          const { label, badgeClass } = badgeForSellerOrder(o.status, o.delivery);
          const amount = o.amount ?? o.totalAmount ?? 0;
          return {
            id: o.id,
            title,
            buyer,
            timeLabel: o.createdAt ? formatRelativeTime(o.createdAt) : '',
            amountLabel: formatNgnFromKobo(typeof amount === 'number' ? amount : 0),
            badgeClass,
            badgeLabel: label,
          };
        });
        setRecentOrders(rows);
      } catch {
        setRecentOrders([]);
      } finally {
        setRecentLoading(false);
      }
    };
    loadRecent();
  }, [isAuthenticated, user]);

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
        setKycStatus(
          resolveSellerKycStatus(responseData.status, responseData.kyc),
        );
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
        setBusinessName(seller?.businessName ?? null);
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

  const storeHeading = businessName || `${user?.name?.split(/\s+/)[0] ?? 'Your'}'s Store`;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#ff6600]/30 border-t-[#ff6600]"></div>
          <p className="text-[#ffcc99]">Loading...</p>
        </div>
      </div>
    );
  }

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
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-2.5 lg:gap-6 lg:px-8">
          <div className="flex flex-col gap-2.5 lg:hidden">
            <div>
              <p className="text-[10px] text-gray-500">Good morning 👋</p>
              <p className="mt-0.5 text-[15px] font-extrabold leading-tight text-white">{storeHeading}</p>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-orange-500/30 bg-[#1a1d27] p-3">
              <div className="flex w-full items-start justify-between gap-2">
                <div>
                  <p className="text-[13px] font-extrabold leading-snug text-white">
                    Complete your
                    <br />
                    store setup
                  </p>
                  <p className="mt-0.5 text-[9px] text-gray-500">Add 5 products to go live</p>
                </div>
                <Rocket className="h-8 w-8 shrink-0 text-orange-500/40" aria-hidden />
              </div>
              <Link
                href="/seller/products/new"
                className="mt-1 inline-flex w-fit items-center gap-1 rounded-md bg-orange-500 px-2.5 py-1.5"
              >
                <Plus className="h-3 w-3 text-white" />
                <span className="text-[9px] font-bold text-white">Add product</span>
              </Link>
            </div>
          </div>

          <p className="hidden text-[32px] font-bold leading-tight tracking-light text-white lg:block">Dashboard</p>

          <DashboardStats />

          <div className="flex flex-col gap-2.5 lg:hidden">
          <div className="mb-2.5 flex gap-1">
            <Link
              href="/seller/products/new"
              className="flex flex-1 items-center justify-center rounded-lg border border-orange-500/30 bg-orange-500 py-2"
            >
              <span className="text-[9px] font-semibold text-white">+ Add Product</span>
            </Link>
            <button
              type="button"
              onClick={handleShareStore}
              disabled={!sellerId}
              className="flex flex-1 items-center justify-center rounded-lg border border-orange-500/30 bg-[#1a1d27] py-2 disabled:opacity-40"
            >
              <span className="text-[9px] font-semibold text-orange-500">Share Store</span>
            </button>
            <Link
              href={sellerId ? `/buyer/products?seller=${sellerId}` : '#'}
              className={`flex flex-1 items-center justify-center rounded-lg border border-orange-500/30 bg-[#1a1d27] py-2 ${sellerId ? '' : 'pointer-events-none opacity-40'}`}
            >
              <span className="text-[9px] font-semibold text-orange-500">View Store</span>
            </Link>
          </div>

          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-white">Recent orders</span>
            <Link href="/seller/orders" className="text-[9px] font-medium text-orange-500">
              See all
            </Link>
          </div>

          {recentLoading ? (
            <div className="space-y-1.5">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-[10px] text-gray-500">No orders yet.</p>
          ) : (
            recentOrders.map((o) => (
              <Link
                key={o.id}
                href={`/seller/orders/${o.id}`}
                className="mb-1.5 flex items-start justify-between rounded-[10px] border border-white/[0.06] bg-[#1a1d27] px-2.5 py-2"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-[10px] font-semibold text-white">{o.title}</p>
                  <p className="mt-0.5 text-[8px] text-gray-500">
                    {o.buyer} · {o.timeLabel}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] font-bold text-white">{o.amountLabel}</p>
                  <span className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[7px] font-bold ${o.badgeClass}`}>
                    {o.badgeLabel}
                  </span>
                </div>
              </Link>
            ))
          )}
          </div>

          <div className="hidden flex-col gap-6 lg:flex">
          <div className="flex h-10 items-center gap-3 rounded-[12px] border border-[#2A2A2A] bg-[#1A1A1A] px-4">
            <Link
              href="/seller/products/new"
              className="flex items-center gap-2 text-[#FF6B00] transition hover:text-[#FF6B00]/80"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className="text-[13px] font-medium text-white">Add Product</span>
            </Link>
            <span className="h-5 w-px bg-[#2A2A2A]" />
            <button
              onClick={handleShareStore}
              disabled={!sellerId}
              className="flex items-center gap-2 text-[#FF6B00] transition hover:text-[#FF6B00]/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Share2 className="h-4 w-4 shrink-0" />
              <span className="text-[13px] font-medium text-white">Share Store Link</span>
            </button>
            <span className="h-5 w-px bg-[#2A2A2A]" />
            <Link
              href={sellerId ? `/buyer/products?seller=${sellerId}` : '#'}
              className={`flex items-center gap-2 transition ${sellerId ? 'text-[#FF6B00] hover:text-[#FF6B00]/80' : 'pointer-events-none cursor-not-allowed text-[#A0A0A0]'}`}
            >
              <Eye className="h-4 w-4 shrink-0" />
              <span className="text-[13px] font-medium text-white">View Store</span>
            </Link>
          </div>

          <div className="flex flex-wrap gap-6">
            <SalesTrend />
            <OrderDistribution />
          </div>
          </div>
        </div>

        {kycStatus === 'APPROVED' ? (
          <Link
            href="/seller/products/new"
            className="fixed bottom-6 right-6 z-50 hidden transform items-center space-x-2 rounded-xl bg-[#ff6600] px-6 py-3 font-bold text-black shadow-lg transition hover:scale-105 hover:bg-[#cc5200] lg:flex"
          >
            <Plus className="h-5 w-5" />
            <span>Add Product</span>
          </Link>
        ) : (
          <button
            disabled
            title="Complete KYC verification to add products"
            className="fixed bottom-6 right-6 z-50 hidden cursor-not-allowed items-center space-x-2 rounded-xl border border-[#ff6600]/10 bg-[#333]/70 px-6 py-3 font-bold text-[#ffcc99]/30 shadow-lg lg:flex"
          >
            <Plus className="h-5 w-5" />
            <span>Add Product</span>
          </button>
        )}
      </SellerLayout>
    </>
  );
}
