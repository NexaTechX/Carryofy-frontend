import { useEffect, useState } from 'react';
import { tokenManager } from '../../lib/auth';

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  loading?: boolean;
}

function StatCard({ title, value, description, loading }: StatCardProps) {
  return (
    <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-[#ff6600]/30">
      <p className="text-white text-base font-medium leading-normal">{title}</p>
      {loading ? (
        <div className="h-8 w-24 bg-[#1a1a1a] animate-pulse rounded"></div>
      ) : (
        <p className="text-white tracking-light text-2xl font-bold leading-tight">{value}</p>
      )}
      {description ? (
        <p className="text-xs text-gray-400 leading-snug">{description}</p>
      ) : null}
    </div>
  );
}

interface DashboardKPIs {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  availableBalance: number;
  pendingPayoutRequestsCount: number;
  pendingPayoutRequestsTotal: number;
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

      // Fetch dashboard KPIs, payouts, reports, and seller product count (same auth as charts)
      const [
        dashboardResponse,
        payoutsResponse,
        payoutRequestsResponse,
        salesTrendResponse,
        orderDistributionResponse,
        productCountResponse,
      ] = await Promise.all([
        fetch(`${apiUrl}/reports/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/payouts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/payouts/requests`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/reports/sales-trend`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/reports/order-distribution`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/reports/seller-product-count`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
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
    <div className="flex flex-wrap gap-4 p-4">
      <StatCard
        title="Total Products"
        value={stats ? stats.totalProducts.toString() : '0'}
        loading={loading}
      />
      <StatCard
        title="Total Orders"
        value={stats ? stats.totalOrders.toString() : '0'}
        loading={loading}
      />
      <StatCard
        title="Total Revenue"
        value={stats ? formatPrice(stats.totalRevenue) : '₦0.00'}
        loading={loading}
      />
      <StatCard
        title="Available Balance"
        value={stats ? formatPrice(stats.availableBalance) : '₦0.00'}
        description="Available to request for payout (pending earnings minus refunds). Post‑payout refunds may make balance negative."
        loading={loading}
      />
      <StatCard
        title="Pending Requests"
        value={stats ? `${stats.pendingPayoutRequestsCount}` : '0'}
        description={stats ? `Total pending: ${formatPrice(stats.pendingPayoutRequestsTotal)}` : 'Total pending: ₦0.00'}
        loading={loading}
      />
    </div>
  );
}

