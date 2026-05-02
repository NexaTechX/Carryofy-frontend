import { useEffect, useState } from 'react';
import { tokenManager } from '../../lib/auth';
import {
  Package,
  ShoppingCart,
  DollarSign,
  Wallet,
  Clock,
  FileText,
  Building2,
} from 'lucide-react';
import { StatMetricCard } from '../ui/StatMetricCard';

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

      const dashboardData = dashboardJson?.data ?? dashboardJson ?? {};
      const salesTrendData = salesTrendJson?.data ?? salesTrendJson ?? {};
      const orderDistributionData = orderDistributionJson?.data ?? orderDistributionJson ?? {};
      const payoutsList = Array.isArray(payoutsJson?.data || payoutsJson) ? (payoutsJson?.data || payoutsJson) : [];
      const payoutRequestsList = Array.isArray(payoutRequestsJson?.data || payoutRequestsJson)
        ? (payoutRequestsJson?.data || payoutRequestsJson)
        : [];

      const availableBalance = payoutsList
        .filter((p: { status?: string }) => p?.status === 'PENDING')
        .reduce((sum: number, p: { net?: number }) => sum + (p?.net || 0), 0);

      const pendingRequestStatuses = new Set(['REQUESTED', 'APPROVED', 'PROCESSING']);
      const pendingPayoutRequests = payoutRequestsList.filter((r: { status?: string }) => {
        const s = r?.status;
        return s != null && pendingRequestStatuses.has(s);
      });
      const pendingPayoutRequestsCount = pendingPayoutRequests.length;
      const pendingPayoutRequestsTotal = pendingPayoutRequests.reduce(
        (sum: number, r: { amount?: number }) => sum + (r?.amount || 0),
        0,
      );

      const productCountData = productCountJson?.data ?? productCountJson ?? {};
      const totalProducts =
        Number(productCountData?.count) ?? Number(dashboardData.totalProducts) ?? 0;

      const totalOrders =
        Number(orderDistributionData.total) ?? Number(dashboardData.totalOrders) ?? 0;
      const totalRevenue =
        Number(salesTrendData.totalSales) ?? Number(dashboardData.totalRevenue) ?? 0;

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
    <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatMetricCard
        label="Total products"
        value={stats ? stats.totalProducts.toString() : '0'}
        loading={loading}
        icon={Package}
      />
      <StatMetricCard
        label="Total orders"
        value={stats ? stats.totalOrders.toString() : '0'}
        loading={loading}
        icon={ShoppingCart}
      />
      <StatMetricCard
        label="Total revenue"
        value={stats ? formatPrice(stats.totalRevenue) : '₦0.00'}
        loading={loading}
        icon={DollarSign}
      />
      <StatMetricCard
        label="Available balance"
        value={stats ? formatPrice(stats.availableBalance) : '₦0.00'}
        comparison="Available to request for payout"
        loading={loading}
        icon={Wallet}
      />
      <StatMetricCard
        label="Pending payout requests"
        value={stats ? `${stats.pendingPayoutRequestsCount}` : '0'}
        comparison={
          stats ? `Total requested: ${formatPrice(stats.pendingPayoutRequestsTotal)}` : 'Total requested: ₦0.00'
        }
        loading={loading}
        icon={Clock}
      />
      <StatMetricCard
        label="Pending quotes"
        value={stats ? String(stats.pendingQuoteRequestsCount ?? 0) : '0'}
        comparison="Awaiting your response"
        loading={loading}
        icon={FileText}
        href="/seller/quotes"
      />
      <StatMetricCard
        label="B2B orders"
        value={stats ? String(stats.b2bOrdersCount ?? 0) : '0'}
        comparison="Bulk / business orders"
        loading={loading}
        icon={Building2}
      />
    </div>
  );
}
