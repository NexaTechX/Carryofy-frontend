import { useState, useMemo } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  AdminCard,
  AdminPageHeader,
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
  Percent,
  TrendingUp,
  FileSpreadsheet,
  Radio,
  Warehouse,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { getDateRangeForPreset, dateRangeToReportParams, type DateRangeValue } from '../../lib/admin/dateRange';
import AnalyticsDateRangeSelector from '../../components/admin/AnalyticsDateRangeSelector';
import Sparkline from '../../components/admin/charts/Sparkline';
import { buildDonutData } from '../../components/admin/charts/DonutChart';
import DailyOrderValueChart, { type DailyOrderValueView } from '../../components/admin/charts/DailyOrderValueChart';
import DonutChart from '../../components/admin/charts/DonutChart';
import CohortRetentionHeatmap, { placeholderCohortData } from '../../components/admin/charts/CohortRetentionHeatmap';

const BarChart = dynamic(() => import('../../components/admin/charts/BarChart'), { ssr: false });

const formatNumber = (value: number) => value.toLocaleString();
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState<DateRangeValue>(() => getDateRangeForPreset('30d'));
  const [sharingFilters, setSharingFilters] = useState<PlatformAnalyticsQuery>({});
  const [showSharingFilters, setShowSharingFilters] = useState(false);
  const [dailyChartView, setDailyChartView] = useState<DailyOrderValueView>('line');
  const [showComparison, setShowComparison] = useState(false);

  const reportParams = useMemo(() => dateRangeToReportParams(dateRange), [dateRange]);
  const sharingParams = useMemo(
    () => ({ ...sharingFilters, startDate: dateRange.startDate, endDate: dateRange.endDate }),
    [sharingFilters, dateRange]
  );

  const { data: dashboardData, isLoading: dashboardLoading, isError: dashboardError } = useAdminDashboard();
  const { data: salesTrend, isLoading: salesLoading } = useSalesTrendReport(reportParams);
  const { data: orderDistribution } = useOrderDistributionReport(reportParams);
  const { data: inventoryReport } = useInventoryReport();

  const { data: sharingAnalytics, isLoading: sharingLoading } = useQuery({
    queryKey: ['admin', 'sharing-analytics', sharingParams],
    queryFn: () => getPlatformWideAnalytics(sharingParams),
  });

  const { data: broadcastHistory } = useQuery({
    queryKey: ['admin', 'broadcast-history', { limit: 10 }],
    queryFn: () => getBroadcastHistory({ limit: 10 }),
  });

  const previousPeriodParams = useMemo(() => {
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const days = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - days + 1);
    return {
      startDate: prevStart.toISOString().slice(0, 10),
      endDate: prevEnd.toISOString().slice(0, 10),
    };
  }, [dateRange]);

  const { data: previousSalesTrend } = useSalesTrendReport(
    showComparison ? previousPeriodParams : undefined
  );

  const isLoading = dashboardLoading || sharingLoading;
  const metrics = dashboardData?.metrics;
  const topCategories = dashboardData?.topCategories;
  const commissionRevenue = dashboardData?.commissionRevenue;

  const totalOrders = metrics?.totalOrders ?? 0;
  const totalRevenue = metrics?.totalRevenue ?? 0;
  const aov = totalOrders > 0 ? totalRevenue / 100 / totalOrders : 0;
  const conversionRate = 0;
  const vsSuffix = ` vs last ${dateRange.label.toLowerCase()}`;

  const revenueSparkline = useMemo(
    () =>
      (salesTrend?.trend ?? []).map((t) => ({ date: t.date, value: t.amount / 100 })),
    [salesTrend]
  );
  const flatSparkline = useMemo(() => {
    const trend = salesTrend?.trend ?? [];
    if (!trend.length) return [];
    return trend.map((t) => ({ date: t.date, value: 1 }));
  }, [salesTrend]);

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
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <AdminPageHeader
              title="Analytics"
              tag="Platform Monitoring"
              subtitle="Monitor platform performance, sharing activity, broadcast engagement, and key business metrics in one place."
              actions={
                <div className="flex flex-wrap items-center gap-2">
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
            <div className="shrink-0 sm:ml-auto">
              <AnalyticsDateRangeSelector value={dateRange} onChange={setDateRange} />
            </div>
          </div>

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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              <AdminCard
                title="Total Orders"
                description={dateRange.label}
                className="border-[#1f2534] bg-[#0f1524]"
                trend={{ change: 0, suffix: vsSuffix }}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/20 p-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-white">{formatNumber(totalOrders)}</p>
                </div>
                {flatSparkline.length > 0 && (
                  <div className="mt-2">
                    <Sparkline data={flatSparkline} color="#ff6600" height={36} />
                  </div>
                )}
              </AdminCard>
              <AdminCard
                title="Gross Revenue"
                description={dateRange.label}
                className="border-[#1f2534] bg-[#0f1524]"
                trend={{ change: 0, suffix: vsSuffix }}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-500/20 p-2">
                    <DollarSign className="h-5 w-5 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{formatCurrency(totalRevenue / 100)}</p>
                </div>
                {revenueSparkline.length > 0 && (
                  <div className="mt-2">
                    <Sparkline data={revenueSparkline} color="#10b981" height={36} />
                  </div>
                )}
              </AdminCard>
              <AdminCard
                title="Sellers"
                description="Active merchants"
                className="border-[#1f2534] bg-[#0f1524]"
                trend={{ change: 0, suffix: vsSuffix }}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-500/20 p-2">
                    <Package className="h-5 w-5 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(metrics?.totalSellers ?? 0)}
                  </p>
                </div>
                {flatSparkline.length > 0 && (
                  <div className="mt-2">
                    <Sparkline data={flatSparkline} color="#3b82f6" height={36} />
                  </div>
                )}
              </AdminCard>
              <AdminCard
                title="Customers"
                description="Total buyers"
                className="border-[#1f2534] bg-[#0f1524]"
                trend={{ change: 0, suffix: vsSuffix }}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-500/20 p-2">
                    <Users className="h-5 w-5 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(metrics?.totalCustomers ?? 0)}
                  </p>
                </div>
                {flatSparkline.length > 0 && (
                  <div className="mt-2">
                    <Sparkline data={flatSparkline} color="#8b5cf6" height={36} />
                  </div>
                )}
              </AdminCard>
              <AdminCard
                title="Active Deliveries"
                description="In progress"
                className="border-[#1f2534] bg-[#0f1524]"
                trend={{ change: 0, suffix: vsSuffix }}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-500/20 p-2">
                    <Truck className="h-5 w-5 text-amber-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(metrics?.activeDeliveries ?? 0)}
                  </p>
                </div>
                {flatSparkline.length > 0 && (
                  <div className="mt-2">
                    <Sparkline data={flatSparkline} color="#f59e0b" height={36} />
                  </div>
                )}
              </AdminCard>
              <AdminCard
                title="Conversion Rate"
                description="Visitors to buyers"
                className="border-[#1f2534] bg-[#0f1524]"
                trend={{ change: 0, suffix: vsSuffix, positiveIsGood: true }}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-cyan-500/20 p-2">
                    <Percent className="h-5 w-5 text-cyan-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {conversionRate > 0 ? `${conversionRate.toFixed(1)}%` : '—'}
                  </p>
                </div>
                {flatSparkline.length > 0 && (
                  <div className="mt-2">
                    <Sparkline data={flatSparkline} color="#06b6d4" height={36} />
                  </div>
                )}
              </AdminCard>
              <AdminCard
                title="Avg. Order Value"
                description="₦"
                className="border-[#1f2534] bg-[#0f1524]"
                trend={{ change: 0, suffix: vsSuffix }}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-500/20 p-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {aov > 0 ? formatCurrency(aov) : '—'}
                  </p>
                </div>
                {revenueSparkline.length > 0 && (
                  <div className="mt-2">
                    <Sparkline
                      data={revenueSparkline.map((d) => ({ ...d, value: totalOrders > 0 ? d.value / totalOrders : 0 }))}
                      color="#10b981"
                      height={36}
                    />
                  </div>
                )}
              </AdminCard>
            </div>
          </section>

          {/* Sales & Revenue Trends */}
          <section className="mb-10">
            <h2 className="mb-4 px-1 text-[22px] font-bold leading-tight text-white">
              Sales &amp; Revenue Trends
            </h2>
            <AdminCard
              title={`Daily Order Value (${dateRange.label})`}
              className="border-[#1f2534] bg-[#0f1524]"
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-400">Chart:</span>
                  {(['line', 'bar', 'area'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDailyChartView(v)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize ${
                        dailyChartView === v
                          ? 'bg-primary text-white'
                          : 'bg-[#1f2534] text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                  <span className="ml-2 border-l border-[#1f2534] pl-2 text-xs text-gray-400">
                    Compare:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowComparison(!showComparison)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                      showComparison ? 'bg-primary text-white' : 'bg-[#1f2534] text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {showComparison ? 'This vs last period ✓' : 'This vs last period'}
                  </button>
                </div>
              }
            >
              {salesTrend?.trend && salesTrend.trend.length > 0 ? (
                <div className="h-[280px]">
                  <DailyOrderValueChart
                    data={salesTrend.trend}
                    comparisonData={previousSalesTrend?.trend}
                    view={dailyChartView}
                    showComparison={showComparison}
                    color="#ff6600"
                    comparisonColor="#6b7280"
                  />
                </div>
              ) : (
                <p className="py-12 text-center text-gray-400">No sales trend data for this period</p>
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
                <div className="h-[320px]">
                  <BarChart data={orderDistChartData} color="#10b981" />
                </div>
              ) : (
                <p className="py-12 text-center text-gray-400">No order distribution data</p>
              )}
            </AdminCard>
            <AdminCard
              title="Top Categories by Sales"
              className="border-[#1f2534] bg-[#0f1524]"
            >
              {categoryChartData.length > 0 ? (
                <div className="h-[320px]">
                  <BarChart data={categoryChartData} color="#3b82f6" />
                </div>
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
                title="Platform breakdown"
                description="WhatsApp, Twitter, Facebook, Other — with actual %"
                className="border-[#1f2534] bg-[#0f1524]"
              >
                {sharingAnalytics?.sharesByPlatform && sharingAnalytics.sharesByPlatform.length > 0 ? (
                  <DonutChart
                    data={buildDonutData(sharingAnalytics.sharesByPlatform)}
                    height={280}
                    showLegend={true}
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
            {sharingAnalytics?.topSharedProducts && sharingAnalytics.topSharedProducts.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 text-lg font-semibold text-white">Top Shared Products</h3>
                <div className="overflow-x-auto rounded-lg border border-[#1f2534]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1f2534] bg-[#0f1524]">
                        <th className="px-4 py-3 text-left font-medium text-gray-400">Product</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-400">Total shares</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-400">Conversion (share → purchase)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sharingAnalytics.topSharedProducts.slice(0, 10).map((product) => (
                        <tr key={product.productId} className="border-b border-[#1f2534] hover:bg-[#0f1524]/50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-white">{product.productTitle}</p>
                            <p className="text-xs text-gray-400">{product.sellerName}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-white">
                            {formatNumber(product.shareCount)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-300">
                            {'conversionRate' in product && typeof (product as { conversionRate?: number }).conversionRate === 'number'
                              ? `${((product as { conversionRate: number }).conversionRate * 100).toFixed(1)}%`
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {sharingTimeChartData.length > 0 && (
              <AdminCard
                title="Sharing Trends Over Time"
                className="mt-6 border-[#1f2534] bg-[#0f1524]"
              >
                <BarChart data={sharingTimeChartData} color="#ff6600" />
              </AdminCard>
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
            {broadcastHistory?.broadcasts && broadcastHistory.broadcasts.length > 0 ? (
              <>
                {recentBroadcastStats && (
                  <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <AdminCard
                      title="Recent Broadcasts"
                      description="Campaigns in list"
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
                      title="Avg Open Rate"
                      description="Email opens"
                      className="border-[#1f2534] bg-[#0f1524]"
                    >
                      <p className="text-2xl font-bold text-green-400">
                        {recentBroadcastStats.openRate.toFixed(1)}%
                      </p>
                    </AdminCard>
                    <AdminCard
                      title="Avg Click Rate"
                      description="Link clicks"
                      className="border-[#1f2534] bg-[#0f1524]"
                    >
                      <p className="text-2xl font-bold text-blue-400">
                        {recentBroadcastStats.clickRate.toFixed(1)}%
                      </p>
                    </AdminCard>
                  </div>
                )}
                <div className="overflow-x-auto rounded-lg border border-[#1f2534]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1f2534] bg-[#0f1524]">
                        <th className="px-4 py-3 text-left font-medium text-gray-400">Subject / Type</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-400">Audience size</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-400">Open rate</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-400">Click rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {broadcastHistory.broadcasts.map((b) => {
                        const sent = b.sentEmail ?? 0;
                        const openRate = sent > 0 && b.emailOpens != null ? ((b.emailOpens / sent) * 100).toFixed(1) : '—';
                        const clickRate = sent > 0 && b.emailClicks != null ? ((b.emailClicks / sent) * 100).toFixed(1) : '—';
                        const audience = b.recipientCount ?? (b.sentInApp + b.sentEmail);
                        return (
                          <tr key={b.id} className="border-b border-[#1f2534] hover:bg-[#0f1524]/50">
                            <td className="px-4 py-3">
                              <p className="font-medium text-white">{b.subject}</p>
                              <p className="text-xs text-gray-400">{b.type}</p>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-300">
                              {typeof audience === 'number' ? formatNumber(audience) : audience}
                            </td>
                            <td className="px-4 py-3 text-right text-green-400">
                              {openRate === '—' ? openRate : `${openRate}%`}
                            </td>
                            <td className="px-4 py-3 text-right text-blue-400">
                              {clickRate === '—' ? clickRate : `${clickRate}%`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
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
              <div className="mt-4">
                <h4 className="mb-2 text-sm font-medium text-gray-300">Cohort retention (monthly)</h4>
                <CohortRetentionHeatmap data={placeholderCohortData()} monthLabels={['M0', 'M1', 'M2', 'M3', 'M4', 'M5']} />
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

          {/* Deep Dive */}
          <section>
            <h2 className="mb-4 px-1 text-[22px] font-bold leading-tight text-white">
              Deep Dive
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/admin/reports"
                className="group flex flex-col rounded-2xl border border-[#1f2534] bg-[#0f1524] p-6 transition hover:border-primary/50 hover:bg-[#0f1524]/80"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary transition group-hover:bg-primary/30">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-white">Reports &amp; Exports</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Download sales, earnings, and order reports by date range and filters.
                </p>
              </Link>
              <Link
                href="/admin/sharing/analytics"
                className="group flex flex-col rounded-2xl border border-[#1f2534] bg-[#0f1524] p-6 transition hover:border-primary/50 hover:bg-[#0f1524]/80"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary transition group-hover:bg-primary/30">
                  <Share2 className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-white">Full Sharing Analytics</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Deep dive into shares by platform, role, and time with custom filters.
                </p>
              </Link>
              <Link
                href="/admin/broadcast-history"
                className="group flex flex-col rounded-2xl border border-[#1f2534] bg-[#0f1524] p-6 transition hover:border-primary/50 hover:bg-[#0f1524]/80"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary transition group-hover:bg-primary/30">
                  <Radio className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-white">Broadcast History</h3>
                <p className="mt-1 text-sm text-gray-400">
                  View all past campaigns, open/click rates, and audience breakdown.
                </p>
              </Link>
              <Link
                href="/admin/warehouse"
                className="group flex flex-col rounded-2xl border border-[#1f2534] bg-[#0f1524] p-6 transition hover:border-primary/50 hover:bg-[#0f1524]/80"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary transition group-hover:bg-primary/30">
                  <Warehouse className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-white">Warehouse &amp; Stock</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Manage inventory, low stock alerts, and stock movements.
                </p>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
