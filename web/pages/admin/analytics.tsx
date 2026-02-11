import { useState, useMemo } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  AdminCard,
  AdminPageHeader,
  AdminToolbar,
  LoadingState,
} from '../../components/admin/ui';
import { useAdminDashboard } from '../../lib/admin/hooks/useAdminDashboard';
import {
  useSalesTrendReport,
  useOrderDistributionReport,
  useInventoryReport,
} from '../../lib/admin/hooks/useReports';
import { getPlatformWideAnalytics, PlatformAnalyticsQuery } from '../../lib/api/sharing';
import { getBroadcastHistory } from '../../lib/admin/api';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart2,
  Share2,
  ShoppingCart,
  Users,
  Package,
  Mail,
  ExternalLink,
  Filter,
  DollarSign,
  Truck,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const TrendChart = dynamic(() => import('../../components/admin/charts/TrendChart'), { ssr: false });
const BarChart = dynamic(() => import('../../components/admin/charts/BarChart'), { ssr: false });

const formatNumber = (value: number) => value.toLocaleString();
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);

export default function AdminAnalytics() {
  const [sharingFilters, setSharingFilters] = useState<PlatformAnalyticsQuery>({});
  const [showSharingFilters, setShowSharingFilters] = useState(false);

  const { data: dashboardData, isLoading: dashboardLoading, isError: dashboardError } = useAdminDashboard();
  const { data: salesTrend, isLoading: salesLoading } = useSalesTrendReport();
  const { data: orderDistribution } = useOrderDistributionReport();
  const { data: inventoryReport } = useInventoryReport();

  const { data: sharingAnalytics, isLoading: sharingLoading } = useQuery({
    queryKey: ['admin', 'sharing-analytics', sharingFilters],
    queryFn: () => getPlatformWideAnalytics(sharingFilters),
  });

  const { data: broadcastHistory } = useQuery({
    queryKey: ['admin', 'broadcast-history', { limit: 5 }],
    queryFn: () => getBroadcastHistory({ limit: 5 }),
  });

  const isLoading = dashboardLoading || sharingLoading;
  const metrics = dashboardData?.metrics;
  const topCategories = dashboardData?.topCategories;
  const commissionRevenue = dashboardData?.commissionRevenue;

  const categoryChartData = useMemo(
    () =>
      (topCategories?.categories || []).slice(0, 5).map((cat) => ({
        label: cat.category,
        value: cat.count,
      })),
    [topCategories]
  );

  const orderDistChartData = useMemo(
    () =>
      (orderDistribution || []).map((entry) => ({
        label: entry.status.replace(/_/g, ' '),
        value: entry.count,
      })),
    [orderDistribution]
  );

  const sharingTimeChartData = useMemo(
    () =>
      (sharingAnalytics?.timeTrends || []).map((t) => ({
        label: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: t.shareCount,
      })),
    [sharingAnalytics]
  );

  const recentBroadcastStats = useMemo(() => {
    const broadcasts = broadcastHistory?.broadcasts || [];
    if (broadcasts.length === 0) return null;
    const totalSent = broadcasts.reduce((sum, b) => sum + (b.sentEmail || 0), 0);
    const totalOpens = broadcasts.reduce((sum, b) => sum + (b.emailOpens || 0), 0);
    const totalClicks = broadcasts.reduce((sum, b) => sum + (b.emailClicks || 0), 0);
    return {
      broadcastsCount: broadcasts.length,
      totalSent,
      openRate: totalSent > 0 ? (totalOpens / totalSent) * 100 : 0,
      clickRate: totalSent > 0 ? (totalClicks / totalSent) * 100 : 0,
    };
  }, [broadcastHistory]);

  if (dashboardError) {
    return (
      <AdminLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center text-gray-300">
          <p>Failed to load analytics. Please try again.</p>
        </div>
      </AdminLayout>
    );
  }

  if (isLoading && !metrics) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-[#090c11]">
          <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
            <LoadingState label="Loading analytics..." />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Analytics"
            tag="Platform Monitoring"
            subtitle="Monitor platform performance, sharing activity, broadcast engagement, and key business metrics in one place."
            actions={
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSharingFilters(!showSharingFilters)}
                  className="flex items-center gap-2 rounded-full border border-[#1f2534] px-4 py-2 text-xs font-medium text-gray-300 transition hover:border-primary/50"
                >
                  <Filter className="h-4 w-4" />
                  Sharing Filters
                </button>
                <Link
                  href="/admin/reports"
                  className="flex items-center gap-2 rounded-full border border-[#1f2534] px-4 py-2 text-xs font-medium text-gray-300 transition hover:border-primary/50"
                >
                  <BarChart2 className="h-4 w-4" />
                  Reports
                </Link>
              </div>
            }
          />

          {/* Sharing filters */}
          {showSharingFilters && (
            <div className="mb-6 rounded-lg border border-[#1f2534] bg-[#0f1524] p-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-300">Start Date</label>
                  <input
                    type="date"
                    value={sharingFilters.startDate || ''}
                    onChange={(e) =>
                      setSharingFilters({ ...sharingFilters, startDate: e.target.value || undefined })
                    }
                    className="w-full rounded-lg border border-[#1f2534] bg-[#090c11] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-300">End Date</label>
                  <input
                    type="date"
                    value={sharingFilters.endDate || ''}
                    onChange={(e) =>
                      setSharingFilters({ ...sharingFilters, endDate: e.target.value || undefined })
                    }
                    className="w-full rounded-lg border border-[#1f2534] bg-[#090c11] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-300">Platform</label>
                  <select
                    value={sharingFilters.platform || ''}
                    onChange={(e) =>
                      setSharingFilters({ ...sharingFilters, platform: e.target.value || undefined })
                    }
                    className="w-full rounded-lg border border-[#1f2534] bg-[#090c11] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                  >
                    <option value="">All Platforms</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="twitter">Twitter</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="copy">Copy Link</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-300">User Role</label>
                  <select
                    value={sharingFilters.role || ''}
                    onChange={(e) =>
                      setSharingFilters({ ...sharingFilters, role: e.target.value || undefined })
                    }
                    className="w-full rounded-lg border border-[#1f2534] bg-[#090c11] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                  >
                    <option value="">All Roles</option>
                    <option value="BUYER">Buyer</option>
                    <option value="SELLER">Seller</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSharingFilters({});
                    setShowSharingFilters(false);
                  }}
                  className="rounded-lg border border-[#1f2534] px-4 py-2 text-sm text-gray-300 transition hover:border-primary/50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Platform Overview */}
          <section className="mb-10">
            <h2 className="mb-4 px-1 text-[22px] font-bold leading-tight text-white">
              Platform Overview
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <AdminCard
                title="Total Orders"
                description="All time"
                className="border-[#1f2534] bg-[#0f1524]"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/20 p-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(metrics?.totalOrders ?? 0)}
                  </p>
                </div>
              </AdminCard>
              <AdminCard
                title="Gross Revenue"
                description="Total sales"
                className="border-[#1f2534] bg-[#0f1524]"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-500/20 p-2">
                    <DollarSign className="h-5 w-5 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency((metrics?.totalRevenue ?? 0) / 100)}
                  </p>
                </div>
              </AdminCard>
              <AdminCard
                title="Sellers"
                description="Active merchants"
                className="border-[#1f2534] bg-[#0f1524]"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-500/20 p-2">
                    <Package className="h-5 w-5 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(metrics?.totalSellers ?? 0)}
                  </p>
                </div>
              </AdminCard>
              <AdminCard
                title="Customers"
                description="Total buyers"
                className="border-[#1f2534] bg-[#0f1524]"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-500/20 p-2">
                    <Users className="h-5 w-5 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(metrics?.totalCustomers ?? 0)}
                  </p>
                </div>
              </AdminCard>
              <AdminCard
                title="Active Deliveries"
                description="In progress"
                className="border-[#1f2534] bg-[#0f1524]"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-500/20 p-2">
                    <Truck className="h-5 w-5 text-amber-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(metrics?.activeDeliveries ?? 0)}
                  </p>
                </div>
              </AdminCard>
            </div>
          </section>

          {/* Sales & Revenue Trends */}
          <section className="mb-10">
            <h2 className="mb-4 px-1 text-[22px] font-bold leading-tight text-white">
              Sales &amp; Revenue Trends
            </h2>
            <AdminCard
              title="Daily Order Value (Last 7 Days)"
              className="border-[#1f2534] bg-[#0f1524]"
            >
              {salesTrend?.trend && salesTrend.trend.length > 0 ? (
                <div className="h-[240px]">
                  <TrendChart data={salesTrend.trend} color="#ff6600" />
                </div>
              ) : (
                <p className="py-12 text-center text-gray-400">No sales trend data available</p>
              )}
            </AdminCard>
          </section>

          {/* Order Distribution & Top Categories */}
          <section className="mb-10 grid gap-6 lg:grid-cols-2">
            <AdminCard
              title="Order Status Distribution"
              className="border-[#1f2534] bg-[#0f1524]"
            >
              {orderDistChartData.length > 0 ? (
                <BarChart data={orderDistChartData} color="#10b981" />
              ) : (
                <p className="py-12 text-center text-gray-400">No order distribution data</p>
              )}
            </AdminCard>
            <AdminCard
              title="Top Categories by Sales"
              className="border-[#1f2534] bg-[#0f1524]"
            >
              {categoryChartData.length > 0 ? (
                <BarChart data={categoryChartData} color="#3b82f6" />
              ) : (
                <p className="py-12 text-center text-gray-400">No category data</p>
              )}
            </AdminCard>
          </section>

          {/* Product Sharing Analytics */}
          <section className="mb-10">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="px-1 text-[22px] font-bold leading-tight text-white">
                Product Sharing Analytics
              </h2>
              <Link
                href="/admin/sharing/analytics"
                className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-light"
              >
                Full Sharing Analytics
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
            <p className="mb-4 text-sm text-gray-400">
              Track when sellers and buyers share product links to WhatsApp, Twitter, Facebook, and
              other platforms. Share counts reflect when users share products.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <AdminCard
                title="Total Shares"
                description="Product links shared"
                className="border-[#1f2534] bg-[#0f1524]"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/20 p-2">
                    <Share2 className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(sharingAnalytics?.totalShares ?? 0)}
                  </p>
                </div>
              </AdminCard>
              <AdminCard
                title="Unique Sharers"
                description="Users who shared"
                className="border-[#1f2534] bg-[#0f1524]"
              >
                <p className="text-2xl font-bold text-white">
                  {formatNumber(sharingAnalytics?.uniqueSharers ?? 0)}
                </p>
              </AdminCard>
              <AdminCard
                title="Products Shared"
                description="Unique products"
                className="border-[#1f2534] bg-[#0f1524]"
              >
                <p className="text-2xl font-bold text-white">
                  {formatNumber(sharingAnalytics?.uniqueProducts ?? 0)}
                </p>
              </AdminCard>
              <AdminCard
                title="Avg per Product"
                description="Shares per product"
                className="border-[#1f2534] bg-[#0f1524]"
              >
                <p className="text-2xl font-bold text-white">
                  {sharingAnalytics && sharingAnalytics.uniqueProducts > 0
                    ? (sharingAnalytics.totalShares / sharingAnalytics.uniqueProducts).toFixed(1)
                    : '0'}
                </p>
              </AdminCard>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <AdminCard
                title="Shares by Platform"
                className="border-[#1f2534] bg-[#0f1524]"
              >
                {sharingAnalytics?.sharesByPlatform && sharingAnalytics.sharesByPlatform.length > 0 ? (
                  <BarChart
                    data={sharingAnalytics.sharesByPlatform.map((p) => ({
                      label: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
                      value: p.count,
                    }))}
                    color="#25D366"
                  />
                ) : (
                  <p className="py-8 text-center text-gray-400">No platform data</p>
                )}
              </AdminCard>
              <AdminCard
                title="Shares by Role (Seller vs Buyer)"
                className="border-[#1f2534] bg-[#0f1524]"
              >
                {sharingAnalytics?.sharesByRole && sharingAnalytics.sharesByRole.length > 0 ? (
                  <BarChart
                    data={sharingAnalytics.sharesByRole.map((r) => ({
                      label: r.role,
                      value: r.count,
                    }))}
                    color="#8b5cf6"
                  />
                ) : (
                  <p className="py-8 text-center text-gray-400">No role data</p>
                )}
              </AdminCard>
            </div>
            {sharingTimeChartData.length > 0 && (
              <AdminCard
                title="Sharing Trends Over Time"
                className="mt-6 border-[#1f2534] bg-[#0f1524]"
              >
                <BarChart data={sharingTimeChartData} color="#ff6600" />
              </AdminCard>
            )}
            {sharingAnalytics?.topSharedProducts && sharingAnalytics.topSharedProducts.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 text-lg font-semibold text-white">Top Shared Products</h3>
                <div className="space-y-2">
                  {sharingAnalytics.topSharedProducts.slice(0, 5).map((product, index) => (
                    <div
                      key={product.productId}
                      className="flex items-center justify-between rounded-lg border border-[#1f2534] bg-[#0f1524] p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-sm font-bold text-primary">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-white">{product.productTitle}</p>
                          <p className="text-xs text-gray-400">{product.sellerName}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-primary">{formatNumber(product.shareCount)} shares</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Broadcast Performance */}
          <section className="mb-10">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="px-1 text-[22px] font-bold leading-tight text-white">
                Broadcast Engagement
              </h2>
              <Link
                href="/admin/broadcast-history"
                className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-light"
              >
                Broadcast History
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
            <p className="mb-4 text-sm text-gray-400">
              Email and in-app broadcast performance: open rates and click rates for product and
              promotional links sent to buyers, sellers, and riders.
            </p>
            {recentBroadcastStats ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <AdminCard
                  title="Recent Broadcasts"
                  description="Last 5 campaigns"
                  className="border-[#1f2534] bg-[#0f1524]"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/20 p-2">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-2xl font-bold text-white">{recentBroadcastStats.broadcastsCount}</p>
                  </div>
                </AdminCard>
                <AdminCard
                  title="Emails Sent"
                  description="Total delivered"
                  className="border-[#1f2534] bg-[#0f1524]"
                >
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(recentBroadcastStats.totalSent)}
                  </p>
                </AdminCard>
                <AdminCard
                  title="Open Rate"
                  description="Email opens"
                  className="border-[#1f2534] bg-[#0f1524]"
                >
                  <p className="text-2xl font-bold text-green-400">
                    {recentBroadcastStats.openRate.toFixed(1)}%
                  </p>
                </AdminCard>
                <AdminCard
                  title="Click Rate"
                  description="Link clicks"
                  className="border-[#1f2534] bg-[#0f1524]"
                >
                  <p className="text-2xl font-bold text-blue-400">
                    {recentBroadcastStats.clickRate.toFixed(1)}%
                  </p>
                </AdminCard>
              </div>
            ) : (
              <AdminCard
                title="No Broadcast Data"
                description="Run a broadcast to see engagement metrics"
                className="border-[#1f2534] bg-[#0f1524]"
              >
                <p className="py-6 text-center text-gray-400">
                  Send your first broadcast from the Broadcast page to see open and click rates here.
                </p>
                <Link
                  href="/admin/broadcast"
                  className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-primary"
                >
                  Create Broadcast
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </AdminCard>
            )}
          </section>

          {/* Customer & Inventory Health */}
          <section className="mb-10 grid gap-6 lg:grid-cols-2">
            <AdminCard
              title="Customer Metrics"
              className="border-[#1f2534] bg-[#0f1524]"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-gray-500">New This Month</p>
                  <p className="text-xl font-bold text-white">
                    {formatNumber(metrics?.newCustomersThisMonth ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Active This Month</p>
                  <p className="text-xl font-bold text-white">
                    {formatNumber(metrics?.activeCustomersThisMonth ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Retention Rate</p>
                  <p className="text-xl font-bold text-primary">
                    {(metrics?.customerRetentionRate ?? 0)}%
                  </p>
                </div>
              </div>
            </AdminCard>
            <AdminCard
              title="Inventory Health"
              className="border-[#1f2534] bg-[#0f1524]"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-gray-500">Low Stock Items</p>
                  <p className="text-xl font-bold text-amber-400">
                    {formatNumber(inventoryReport?.lowStockCount ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Out of Stock</p>
                  <p className="text-xl font-bold text-red-400">
                    {formatNumber(inventoryReport?.outOfStockCount ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Total Products</p>
                  <p className="text-xl font-bold text-white">
                    {formatNumber(inventoryReport?.totalProducts ?? 0)}
                  </p>
                </div>
              </div>
            </AdminCard>
          </section>

          {/* Quick Links */}
          <section>
            <h2 className="mb-4 px-1 text-[22px] font-bold leading-tight text-white">
              Deep Dive
            </h2>
            <AdminToolbar className="gap-3">
              <Link
                href="/admin/reports"
                className="rounded-full border border-primary/25 bg-[#0f1729] px-5 py-2 text-sm font-semibold text-white transition hover:border-primary hover:text-primary"
              >
                Reports &amp; Exports
              </Link>
              <Link
                href="/admin/sharing/analytics"
                className="rounded-full border border-primary/25 bg-[#0f1729] px-5 py-2 text-sm font-semibold text-white transition hover:border-primary hover:text-primary"
              >
                Full Sharing Analytics
              </Link>
              <Link
                href="/admin/broadcast-history"
                className="rounded-full border border-primary/25 bg-[#0f1729] px-5 py-2 text-sm font-semibold text-white transition hover:border-primary hover:text-primary"
              >
                Broadcast History
              </Link>
              <Link
                href="/admin/warehouse"
                className="rounded-full border border-primary/25 bg-[#0f1729] px-5 py-2 text-sm font-semibold text-white transition hover:border-primary hover:text-primary"
              >
                Warehouse &amp; Stock
              </Link>
            </AdminToolbar>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
