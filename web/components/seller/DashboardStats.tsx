import { useEffect, useState } from 'react';
import Link from 'next/link';
import { tokenManager } from '../../lib/auth';
import { sellerGet } from '../../lib/seller/http';
import { parseSellerOrdersList } from '../../lib/seller/orders';
import {
  Package,
  ShoppingCart,
  DollarSign,
  Wallet,
  Clock,
  FileText,
  Building2,
  LucideIcon,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  loading?: boolean;
  icon: LucideIcon;
  isRevenue?: boolean;
  href?: string;
}

function StatCard({ title, value, description, loading, icon: Icon, isRevenue, href }: StatCardProps) {
  const cardClass =
    'flex flex-col gap-2 rounded-[12px] p-[20px] bg-[#1A1A1A] border border-[#2A2A2A] relative overflow-hidden' +
    (isRevenue ? ' border-l-4 border-l-[#FF6B00]' : '');
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF6B01]/15">
          <Icon className="h-4 w-4 text-[#FF6B00]" strokeWidth={2} />
        </div>
      </div>
      {loading ? (
        <div className="h-7 w-20 bg-[#2A2A2A] animate-pulse rounded" />
      ) : (
        <p className="font-dm-mono text-[28px] font-bold leading-tight text-white">{value}</p>
      )}
      <p className="text-[11px] font-medium uppercase tracking-wider text-[#A0A0A0]">{title}</p>
      {description ? <p className="text-xs text-[#A0A0A0] leading-snug">{description}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${cardClass} hover:border-[#2A2A2A]/80 transition`}>
        {content}
      </Link>
    );
  }
  return <div className={cardClass}>{content}</div>;
}

interface DashboardKPIs {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  availableBalance: number;
  pendingPayoutRequestsCount: number;
  pendingPayoutRequestsTotal: number;
  pendingQuoteRequestsCount: number;
  b2bOrdersCount: number;
}

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      if (!tokenManager.getAccessToken()) {
        setLoading(false);
        return;
      }

      const [
        dashboardData,
        payoutRequestsList,
        salesTrendData,
        orderDistributionData,
        productCountData,
        sellerStatsData,
        ordersB2BData,
      ] = await Promise.all([
        sellerGet<Record<string, unknown>>('/reports/dashboard'),
        sellerGet<unknown[]>('/payouts/requests'),
        sellerGet<Record<string, unknown>>('/reports/sales-trend'),
        sellerGet<Record<string, unknown>>('/reports/order-distribution'),
        sellerGet<Record<string, unknown>>('/reports/seller-product-count'),
        sellerGet<Record<string, unknown>>('/sellers/me/stats'),
        sellerGet<unknown>('/orders?orderType=B2B'),
      ]);

      if (!dashboardData) {
        console.warn('[DashboardStats] Dashboard KPIs request failed');
      }

      const pendingQuoteRequestsCount =
        Number(sellerStatsData?.pendingQuoteRequestsCount) ?? 0;
      const b2bOrders = parseSellerOrdersList(ordersB2BData);
      const b2bOrdersCount = b2bOrders.length;

      type PayoutRequestRow = { status?: string; amount?: number };
      const payoutList: PayoutRequestRow[] = Array.isArray(payoutRequestsList)
        ? (payoutRequestsList as PayoutRequestRow[])
        : [];

      const availableBalance =
        Number(dashboardData?.sellerAvailableBalanceKobo) ||
        Number(dashboardData?.availableBalance) ||
        0;

      const pendingRequestStatuses = new Set(['REQUESTED', 'APPROVED', 'PROCESSING']);
      const pendingPayoutRequests = payoutList.filter((r) =>
        pendingRequestStatuses.has(r.status ?? ''),
      );
      const pendingPayoutRequestsCount = pendingPayoutRequests.length;
      const pendingPayoutRequestsTotal = pendingPayoutRequests.reduce(
        (sum, r) => sum + (r.amount || 0),
        0,
      );

      const totalProducts =
        Number(productCountData?.count) ?? Number(dashboardData?.totalProducts) ?? 0;

      const totalOrders =
        Number(orderDistributionData?.total) ?? Number(dashboardData?.totalOrders) ?? 0;
      const totalRevenue =
        Number(dashboardData?.totalRevenue) ?? Number(salesTrendData?.totalSales) ?? 0;

      setStats({
        totalProducts,
        totalOrders,
        totalRevenue,
        availableBalance,
        pendingPayoutRequestsCount,
        pendingPayoutRequestsTotal,
        pendingQuoteRequestsCount,
        b2bOrdersCount,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceInKobo: number) => {
    return `₦${(priceInKobo / 100).toFixed(2)}`;
  };

  const compactVal = (v: string) =>
    loading ? <div className="h-[17px] w-16 animate-pulse rounded bg-white/10" /> : <span className="text-[17px] font-bold leading-tight text-white">{v}</span>;

  return (
    <>
    {/* Mobile stat grid — Carryofy mobile nav reference */}
    <div className="grid grid-cols-2 gap-[7px] lg:hidden">
      <div className="rounded-xl border border-white/[0.06] bg-[#1a1d27] p-2.5">
        <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-orange-500/10">
          <Package className="h-3.5 w-3.5 text-orange-500" />
        </div>
        {compactVal(stats ? stats.totalProducts.toString() : '0')}
        <p className="mt-0.5 text-[8px] font-medium uppercase tracking-wide text-gray-500">Total products</p>
      </div>
      <div className="rounded-xl border border-white/[0.06] bg-[#1a1d27] p-2.5">
        <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-orange-500/10">
          <ShoppingCart className="h-3.5 w-3.5 text-orange-500" />
        </div>
        {compactVal(stats ? stats.totalOrders.toString() : '0')}
        <p className="mt-0.5 text-[8px] font-medium uppercase tracking-wide text-gray-500">Total orders</p>
      </div>
      <div className="rounded-xl border border-white/[0.06] bg-[#1a1d27] p-2.5">
        <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-orange-500/10">
          <DollarSign className="h-3.5 w-3.5 text-orange-500" />
        </div>
        {compactVal(stats ? formatPrice(stats.totalRevenue) : '₦0.00')}
        <p className="mt-0.5 text-[8px] font-medium uppercase tracking-wide text-gray-500">Total revenue</p>
      </div>
      <div className="rounded-xl border border-white/[0.06] bg-[#1a1d27] p-2.5">
        <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-orange-500/10">
          <Wallet className="h-3.5 w-3.5 text-orange-500" />
        </div>
        {compactVal(stats ? formatPrice(stats.availableBalance) : '₦0.00')}
        <p className="mt-0.5 text-[8px] font-medium uppercase tracking-wide text-gray-500">Available balance</p>
      </div>
      <div className="rounded-xl border border-white/[0.06] bg-[#1a1d27] p-2.5">
        <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-orange-500/10">
          <Clock className="h-3.5 w-3.5 text-orange-500" />
        </div>
        {compactVal(stats ? stats.pendingPayoutRequestsCount.toString() : '0')}
        <p className="mt-0.5 text-[8px] font-medium uppercase tracking-wide text-gray-500">Pending payouts</p>
      </div>
      <div className="rounded-xl border border-white/[0.06] bg-[#1a1d27] p-2.5">
        <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-orange-500/10">
          <FileText className="h-3.5 w-3.5 text-orange-500" />
        </div>
        {compactVal(stats ? stats.pendingQuoteRequestsCount.toString() : '0')}
        <p className="mt-0.5 text-[8px] font-medium uppercase tracking-wide text-gray-500">Quote requests</p>
      </div>
      <div className="col-span-2 rounded-xl border border-white/[0.06] bg-[#1a1d27] p-2.5">
        <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-orange-500/10">
          <Building2 className="h-3.5 w-3.5 text-orange-500" />
        </div>
        {compactVal(stats ? stats.b2bOrdersCount.toString() : '0')}
        <p className="mt-0.5 text-[8px] font-medium uppercase tracking-wide text-gray-500">B2B orders</p>
      </div>
    </div>

    {/* Desktop stat cards */}
    <div className="hidden lg:grid lg:grid-cols-4 lg:gap-4">
      <StatCard
        title="Total Products"
        value={stats ? stats.totalProducts.toString() : '0'}
        loading={loading}
        icon={Package}
        href="/seller/products"
      />
      <StatCard
        title="Total Orders"
        value={stats ? stats.totalOrders.toString() : '0'}
        loading={loading}
        icon={ShoppingCart}
        href="/seller/orders"
      />
      <StatCard
        title="Total Revenue"
        value={stats ? formatPrice(stats.totalRevenue) : '₦0.00'}
        loading={loading}
        icon={DollarSign}
        isRevenue
      />
      <StatCard
        title="Available Balance"
        value={stats ? formatPrice(stats.availableBalance) : '₦0.00'}
        loading={loading}
        icon={Wallet}
        href="/seller/earnings"
      />
      <StatCard
        title="Pending Payouts"
        value={stats ? stats.pendingPayoutRequestsCount.toString() : '0'}
        description={
          stats && stats.pendingPayoutRequestsTotal > 0
            ? `${formatPrice(stats.pendingPayoutRequestsTotal)} awaiting`
            : undefined
        }
        loading={loading}
        icon={Clock}
        href="/seller/earnings"
      />
      <StatCard
        title="Quote Requests"
        value={stats ? stats.pendingQuoteRequestsCount.toString() : '0'}
        loading={loading}
        icon={FileText}
        href="/seller/quotes"
      />
      <StatCard
        title="B2B Orders"
        value={stats ? stats.b2bOrdersCount.toString() : '0'}
        loading={loading}
        icon={Building2}
        href="/seller/orders?orderType=B2B"
      />
    </div>
    </>
  );
}
