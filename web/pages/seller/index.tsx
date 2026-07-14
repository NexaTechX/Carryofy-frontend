import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import SellerLayout from '../../components/seller/SellerLayout';
import DashboardStats from '../../components/seller/DashboardStats';
import SellerKycBanner from '../../components/seller/SellerKycBanner';
import SellerPathToSaleChecklist from '../../components/seller/SellerPathToSaleChecklist';
import SalesTrend from '../../components/seller/SalesTrend';
import OrderDistribution from '../../components/seller/OrderDistribution';
import { Plus, Share2, Eye } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth, tokenManager } from '../../lib/auth';
import { sellerGet } from '../../lib/seller/http';
import { parseSellerOrdersList } from '../../lib/seller/orders';
import { unwrapSellerMePayload } from '../../lib/seller/onboarding';
import { resolveSellerKycStatus } from '../../lib/seller/kyc-status';
import { formatSellerPayoutLabel } from '../../lib/seller/order-payout';
import { KYC_ONBOARDING_HREF, kycAddProductBlockedReason } from '../../lib/seller/kyc-copy';

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
  const [kycRejection, setKycRejection] = useState<{
    reason: string | null;
    reasonCode: string | null;
  }>({ reason: null, reasonCode: null });
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrderRow[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [productCount, setProductCount] = useState(0);
  const [hasActiveProduct, setHasActiveProduct] = useState(false);
  const [hasPendingProduct, setHasPendingProduct] = useState(false);

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
    fetchProductPath();
  }, [router, isLoading, isAuthenticated, user]);

  const fetchProductPath = async () => {
    try {
      const seller = unwrapSellerMePayload(await sellerGet('/sellers/me'));
      const sid = seller?.id;
      if (!sid) return;
      const raw = await sellerGet<{
        products?: Array<{ status?: string }>;
        data?: Array<{ status?: string }>;
      } | Array<{ status?: string }>>(`/products?sellerId=${sid}&limit=100&inStockOnly=false`);
      let list: Array<{ status?: string }> = [];
      if (Array.isArray(raw)) list = raw;
      else if (raw && Array.isArray(raw.products)) list = raw.products;
      else if (raw && Array.isArray(raw.data)) list = raw.data;
      setProductCount(list.length);
      setHasActiveProduct(list.some((p) => String(p.status || '').toUpperCase() === 'ACTIVE'));
      setHasPendingProduct(list.some((p) => String(p.status || '').toUpperCase() === 'PENDING_APPROVAL'));
    } catch {
      /* non-fatal for checklist */
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const loadRecent = async () => {
      setRecentLoading(true);
      try {
        if (!tokenManager.getAccessToken()) return;
        const data = await sellerGet<unknown>('/orders');
        if (!data) {
          setRecentOrders([]);
          return;
        }
        const orders = parseSellerOrdersList(data);
        const rows: RecentOrderRow[] = orders.slice(0, 3).map((o: any) => {
          const first = o.items?.[0];
          const product = first?.product;
          const title = product?.title ?? 'Order';
          const buyer = o.user?.name ?? o.user?.email ?? 'Customer';
          const { label, badgeClass } = badgeForSellerOrder(o.status, o.delivery);
          return {
            id: o.id,
            title,
            buyer,
            timeLabel: o.createdAt ? formatRelativeTime(o.createdAt) : '',
            amountLabel: formatSellerPayoutLabel(o),
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
    const kyc = await sellerGet<{
      status?: string;
      kyc?: Parameters<typeof resolveSellerKycStatus>[1] & {
        rejectionReason?: string | null;
        rejectionReasonCode?: string | null;
      };
    }>('/sellers/kyc');
    if (kyc) {
      setKycStatus(resolveSellerKycStatus(kyc.status, kyc.kyc));
      setKycRejection({
        reason: kyc.kyc?.rejectionReason ?? null,
        reasonCode: kyc.kyc?.rejectionReasonCode ?? null,
      });
    }
  };

  const fetchSellerProfile = async () => {
    const seller = unwrapSellerMePayload(await sellerGet('/sellers/me'));
    if (seller) {
      setSellerId(seller.id ?? null);
      setBusinessName(seller.businessName ?? null);
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary"></div>
          <p className="text-foreground/60">Loading…</p>
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
          <SellerKycBanner
            status={kycStatus}
            rejectionReason={kycRejection.reason}
            rejectionReasonCode={kycRejection.reasonCode}
          />

          <SellerPathToSaleChecklist
            kycStatus={kycStatus}
            productCount={productCount}
            hasActiveProduct={hasActiveProduct}
            hasPendingProduct={hasPendingProduct}
          />

          <div className="flex flex-col gap-3 lg:hidden">
            <div>
              <p className="text-xs font-medium text-foreground/50">Good to see you</p>
              <p className="mt-0.5 font-display text-xl font-bold leading-tight text-foreground">{storeHeading}</p>
            </div>
          </div>

          <div className="hidden reveal-up lg:block">
            <p className="text-sm font-medium text-foreground/50">
              Good to see you, {user?.name?.split(/\s+/)[0] ?? 'there'}
            </p>
            <h1 className="mt-1 font-display text-[34px] font-bold leading-tight tracking-tight text-foreground">
              {storeHeading}
            </h1>
          </div>

          <DashboardStats />

          <div className="flex flex-col gap-3 lg:hidden">
          <div className="flex gap-2">
            {kycStatus === 'APPROVED' ? (
              <Link
                href="/seller/products/new"
                className="flex flex-1 items-center justify-center rounded-lg bg-primary py-2.5"
              >
                <span className="text-xs font-bold text-black">+ Add Product</span>
              </Link>
            ) : (
              <Link
                href={KYC_ONBOARDING_HREF}
                title={kycAddProductBlockedReason(kycStatus)}
                className="flex flex-1 items-center justify-center rounded-lg border border-primary/40 bg-card py-2.5"
              >
                <span className="text-xs font-semibold text-primary">
                  {kycStatus === 'PENDING' ? 'Waiting for approval' : 'Finish verification'}
                </span>
              </Link>
            )}
            <button
              type="button"
              onClick={handleShareStore}
              disabled={!sellerId}
              className="flex flex-1 items-center justify-center rounded-lg border border-primary/40 bg-card py-2.5 disabled:opacity-40"
            >
              <span className="text-xs font-semibold text-primary">Share Store</span>
            </button>
            <Link
              href={sellerId ? `/buyer/products?seller=${sellerId}` : '#'}
              className={`flex flex-1 items-center justify-center rounded-lg border border-primary/40 bg-card py-2.5 ${sellerId ? '' : 'pointer-events-none opacity-40'}`}
            >
              <span className="text-xs font-semibold text-primary">View Store</span>
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Recent orders</span>
            <Link href="/seller/orders" className="text-xs font-semibold text-primary">
              See all
            </Link>
          </div>

          {recentLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-xs text-foreground/50">No orders yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
            {recentOrders.map((o) => (
              <Link
                key={o.id}
                href={`/seller/orders/${o.id}`}
                className="surface-card flex items-start justify-between px-3 py-2.5 transition active:scale-[0.99]"
              >
                <div className="min-w-0 pr-2">
                  <p className="truncate text-xs font-semibold text-foreground">{o.title}</p>
                  <p className="mt-0.5 text-[10px] text-foreground/50">
                    {o.buyer} · {o.timeLabel}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-bold text-foreground tabular-nums">{o.amountLabel}</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${o.badgeClass}`}>
                    {o.badgeLabel}
                  </span>
                </div>
              </Link>
            ))}
            </div>
          )}
          </div>

          <div className="hidden flex-col gap-6 lg:flex">
          <div className="surface-card flex items-center gap-1 px-2 py-1.5">
            {kycStatus === 'APPROVED' ? (
              <Link
                href="/seller/products/new"
                className="group flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-primary/10"
              >
                <Plus className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-[13px] font-semibold text-foreground">Add Product</span>
              </Link>
            ) : (
              <Link
                href={KYC_ONBOARDING_HREF}
                title={kycAddProductBlockedReason(kycStatus)}
                className="group flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-primary/10"
              >
                <Plus className="h-4 w-4 shrink-0 text-primary/50" />
                <span className="text-[13px] font-semibold text-foreground/70">
                  {kycStatus === 'PENDING' ? 'Waiting for approval' : 'Finish verification'}
                </span>
              </Link>
            )}
            <span className="h-5 w-px bg-border-custom" />
            <button
              onClick={handleShareStore}
              disabled={!sellerId}
              className="group flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <Share2 className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-[13px] font-semibold text-foreground">Share Store Link</span>
            </button>
            <span className="h-5 w-px bg-border-custom" />
            <Link
              href={sellerId ? `/buyer/products?seller=${sellerId}` : '#'}
              className={`group flex items-center gap-2 rounded-lg px-3 py-2 transition ${sellerId ? 'hover:bg-primary/10' : 'pointer-events-none cursor-not-allowed opacity-50'}`}
            >
              <Eye className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-[13px] font-semibold text-foreground">View Store</span>
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
            className="fixed bottom-6 right-6 z-50 hidden transform items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-black shadow-[var(--shadow-primary-glow)] transition hover:-translate-y-0.5 hover:bg-primary-dark lg:flex"
          >
            <Plus className="h-5 w-5" />
            <span>Add Product</span>
          </Link>
        ) : (
          <button
            disabled
            title="Complete KYC verification to add products"
            className="fixed bottom-6 right-6 z-50 hidden cursor-not-allowed items-center gap-2 rounded-xl border border-border-custom bg-[var(--color-surface-2)] px-6 py-3 font-bold text-foreground/30 shadow-lg lg:flex"
          >
            <Plus className="h-5 w-5" />
            <span>Add Product</span>
          </button>
        )}
      </SellerLayout>
    </>
  );
}
