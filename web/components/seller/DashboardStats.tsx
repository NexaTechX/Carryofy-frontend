import { useEffect, useState } from 'react';
import Link from 'next/link';
import { tokenManager } from '../../lib/auth';
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
      const token = tokenManager.getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      // Fetch dashboard KPIs, payouts, reports, seller product count, seller stats (pending quotes), and B2B orders
      const [
        dashboardResponse,
        payoutsResponse,
        payoutRequestsResponse,
        salesTrendResponse,
        orderDistributionResponse,
        productCountResponse,
        sellerStatsResponse,
        ordersB2BResponse,
      ] = await Promise.all([
        fetch(`${apiUrl}/reports/dashboard`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/payouts`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/payouts/requests`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/reports/sales-trend`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/reports/order-distribution`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/reports/seller-product-count`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/sellers/me/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/orders?orderType=B2B`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const dashboardJson =
        dashboardResponse.ok ? await dashboardResponse.json().catch(() => null) : null;
      const payoutsJson = payoutsResponse.ok ? await payoutsResponse.json() : null;
      const payoutRequestsJson = payoutRequestsResponse.ok ? await payoutRequestsResponse.json() : null;
      const salesTrendJson = salesTrendResponse.ok ? await salesTrendResponse.json().catch(() => null) : null;
      const orderDistributionJson = orderDistributionResponse.ok
        ? await orderDistributionResponse.json().catch(() => null)
        : null;
      const productCountJson = productCountResponse.ok
        ? await productCountResponse.json().catch(() => null)
        : null;
      const sellerStatsJson = sellerStatsResponse.ok
        ? await sellerStatsResponse.json().catch(() => null)
        : null;
      const sellerStatsData = sellerStatsJson?.data ?? sellerStatsJson ?? {};
      const pendingQuoteRequestsCount = Number(sellerStatsData.pendingQuoteRequestsCount) ?? 0;
      const ordersB2BData = ordersB2BResponse.ok
        ? await ordersB2BResponse.json().catch(() => ({ data: {}, orders: [] }))
        : { orders: [] };
      const b2bOrders = ordersB2BData?.orders ?? ordersB2BData?.data?.orders ?? [];
      const b2bOrdersCount = Array.isArray(b2bOrders) ? b2bOrders.length : 0;

      if (!dashboardResponse.ok) {
        console.warn(
          '[DashboardStats] Dashboard KPIs request failed:',
          dashboardResponse.status,
          dashboardResponse.statusText,
        );
      }

      // API wraps response in { data: DTO }; support both wrapped and raw
      const dashboardData = dashboardJson?.data ?? dashboardJson ?? {};
      const salesTrendData = salesTrendJson?.data ?? salesTrendJson ?? {};
      const orderDistributionData = orderDistributionJson?.data ?? orderDistributionJson ?? {};
      const payoutsList = Array.isArray(payoutsJson?.data || payoutsJson) ? (payoutsJson?.data || payoutsJson) : [];
      const payoutRequestsList = Array.isArray(payoutRequestsJson?.data || payoutRequestsJson)
        ? (payoutRequestsJson?.data || payoutRequestsJson)
        : [];

      // Available balance is derived from pending earnings (source of truth remains earnings)
      const availableBalance = payoutsList
        .filter((p: any) => p?.status === 'PENDING')
        .reduce((sum: number, p: any) => sum + (p?.net || 0), 0);

      const pendingRequestStatuses = new Set(['REQUESTED', 'APPROVED', 'PROCESSING']);
      const pendingPayoutRequests = payoutRequestsList.filter((r: any) => pendingRequestStatuses.has(r?.status));
      const pendingPayoutRequestsCount = pendingPayoutRequests.length;
      const pendingPayoutRequestsTotal = pendingPayoutRequests.reduce(
        (sum: number, r: any) => sum + (r?.amount || 0),
        0,
      );

      // Total products: from seller-product-count (same auth as sales-trend/order-distribution)
      const productCountData = productCountJson?.data ?? productCountJson ?? {};
      const totalProducts =
        Number(productCountData?.count) ??
        Number(dashboardData.totalProducts) ??
        0;

      // Prefer sales-trend and order-distribution (same data as the charts) so cards
      // show correct numbers
      const totalOrders =
        Number(orderDistributionData.total) ??
        Number(dashboardData.totalOrders) ??
        0;
      const totalRevenue =
        Number(salesTrendData.totalSales) ??
        Number(dashboardData.totalRevenue) ??
        0;

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        title="Total Products"
        value={stats ? stats.totalProducts.toString() : '0'}
        loading={loading}
        icon={Package}
      />
      <StatCard
        title="Total Orders"
        value={stats ? stats.totalOrders.toString() : '0'}
        loading={loading}
        icon={ShoppingCart}
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
        description="Available to request for payout"
        loading={loading}
        icon={Wallet}
        isRevenue
      />
      <StatCard
        title="Pending Requests"
        value={stats ? `${stats.pendingPayoutRequestsCount}` : '0'}
        description={stats ? `Total: ${formatPrice(stats.pendingPayoutRequestsTotal)}` : 'Total: ₦0.00'}
        loading={loading}
        icon={Clock}
        isRevenue
      />
      <StatCard
        title="Pending Quotes"
        value={stats ? String(stats.pendingQuoteRequestsCount ?? 0) : '0'}
        description="Awaiting your response"
        loading={loading}
        icon={FileText}
        href="/seller/quotes"
      />
      <StatCard
        title="B2B Orders"
        value={stats ? String(stats.b2bOrdersCount ?? 0) : '0'}
        description="Bulk / business orders"
        loading={loading}
        icon={Building2}
      />
    </div>
  );
}

