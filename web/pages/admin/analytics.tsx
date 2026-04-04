import { useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AdminPageHeader, Skeleton } from '../../components/admin/ui';
import { useAdminDashboard } from '../../lib/admin/hooks/useAdminDashboard';
import { useInventoryReport, useSalesTrendReport } from '../../lib/admin/hooks/useReports';
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
  Store,
  Wallet,
  Repeat,
  RefreshCw,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  getDateRangeForPreset,
  dateRangeToReportParams,
  type DateRangeValue,
} from '../../lib/admin/dateRange';
import AnalyticsDateRangeSelector from '../../components/admin/AnalyticsDateRangeSelector';
import DailyOrderValueChart, { type DailyOrderValueView } from '../../components/admin/charts/DailyOrderValueChart';
import { buildDonutData } from '../../components/admin/charts/DonutChart';
import DonutChart from '../../components/admin/charts/DonutChart';
import CohortRetentionHeatmap from '../../components/admin/charts/CohortRetentionHeatmap';
import OrderStatusBarChart from '../../components/admin/charts/OrderStatusBarChart';
import { formatNairaKobo, pctDelta } from '../../lib/admin/formatNaira';
import clsx from 'clsx';

const BarChart = dynamic(() => import('../../components/admin/charts/BarChart'), { ssr: false });

const formatNumber = (value: number) => value.toLocaleString('en-NG');

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-10 border-l-4 border-[#FF6B00] pl-3 text-xl font-bold leading-tight text-white">
      {children}
    </h2>
  );
}

function KpiCard(props: {
  label: string;
  description?: string;
  loading: boolean;
  error?: boolean;
  onRetry?: () => void;
  trendPct: number | null;
  trendSuffix: string;
  positiveIsGood?: boolean;
  children: React.ReactNode;
  fetching?: boolean;
}) {
  const {
    label,
    description,
    loading,
    error,
    onRetry,
    trendPct,
    trendSuffix,
    positiveIsGood = true,
    children,
    fetching,
  } = props;
  const trendUp = trendPct != null && trendPct > 0;
  const trendGood =
    trendPct == null || trendPct === 0
      ? true
      : positiveIsGood
        ? trendUp
        : !trendUp;

  if (error && onRetry) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border-2 border-red-500/50 bg-[#121826] p-6 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.55)]">
        <p className="text-xs font-semibold uppercase tracking-wider text-red-300">{label}</p>
        <p className="text-sm text-gray-300">Could not load this metric.</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-200 hover:bg-red-500/10"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'flex flex-col gap-2 rounded-2xl border border-[#2a3142] bg-[#121826] p-6 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.55)] transition',
        fetching && 'opacity-75'
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      {description ? <p className="text-xs text-gray-500">{description}</p> : null}
      {loading ? (
        <>
          <Skeleton className="mt-1 h-9 w-28" />
          <Skeleton className="h-3 w-20" />
        </>
      ) : (
        <>
          <div className="text-3xl font-bold tracking-tight text-white">{children}</div>
          {!loading &&
            (trendPct != null && trendPct !== 0 ? (
              <p
                className={clsx(
                  'text-xs font-medium',
                  trendGood ? 'text-emerald-400' : 'text-rose-400'
                )}
              >
                {trendPct > 0 ? '↑' : '↓'} {Math.abs(trendPct)}%{trendSuffix}
              </p>
            ) : (
              <p className="text-xs text-gray-500">—{trendSuffix}</p>
            ))}
        </>
      )}
    </div>
  );
}

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState<DateRangeValue>(() => getDateRangeForPreset('30d'));
  const [sharingFilters, setSharingFilters] = useState<PlatformAnalyticsQuery>({});
  const [showSharingFilters, setShowSharingFilters] = useState(false);
  const [dailyChartView, setDailyChartView] = useState<DailyOrderValueView>('area');
  const [showComparison, setShowComparison] = useState(false);

  const reportParams = useMemo(() => dateRangeToReportParams(dateRange), [dateRange]);

  const sharingQuery = useMemo(
    () => ({ ...sharingFilters, startDate: reportParams.startDate, endDate: reportParams.endDate }),
    [sharingFilters, reportParams]
  );

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    isFetching: dashboardFetching,
    isError: dashboardError,
    refetch: refetchDashboard,
  } = useAdminDashboard(reportParams);

  const previousPeriodParams = useMemo(() => {
    const start = new Date(reportParams.startDate!.includes('T') ? reportParams.startDate! : `${reportParams.startDate}T00:00:00.000Z`);
    const end = new Date(
      reportParams.endDate!.includes('T') ? reportParams.endDate! : `${reportParams.endDate}T23:59:59.999Z`
    );
    const span = Math.max(1, end.getTime() - start.getTime());
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - span);
    return {
      startDate: prevStart.toISOString(),
      endDate: prevEnd.toISOString(),
    };
  }, [reportParams]);

  const { data: previousSalesTrend, isLoading: prevTrendLoading } = useSalesTrendReport(
    showComparison ? previousPeriodParams : undefined
  );

  const { data: inventoryReport, isLoading: inventoryLoading } = useInventoryReport();

  const {
    data: sharingAnalytics,
    isLoading: sharingLoading,
    isError: sharingError,
    refetch: refetchSharing,
  } = useQuery({
    queryKey: ['admin', 'sharing-analytics', sharingQuery],
    queryFn: () => getPlatformWideAnalytics(sharingQuery),
  });

  const { data: broadcastHistory } = useQuery({
    queryKey: ['admin', 'broadcast-history', { limit: 10 }],
    queryFn: () => getBroadcastHistory({ limit: 10 }),
  });

  const metrics = dashboardData?.metrics;
  const prior = metrics?.priorPeriod;
  const salesTrend = dashboardData?.salesTrend;
  const topCategories = dashboardData?.topCategories;
  const cohort = dashboardData?.cohortRetention;

  const totalOrders = metrics?.totalOrders ?? 0;
  const totalRevenueKobo = metrics?.totalRevenue ?? 0;
  const processedGmv = metrics?.periodProcessedGmvKobo ?? 0;
  const platformCommission = metrics?.platformCommissionKobo ?? 0;
  const aovKobo = totalOrders > 0 ? Math.round(totalRevenueKobo / totalOrders) : 0;

  const visitors = metrics?.funnelUniqueVisitors ?? 0;
  const conversionPct = visitors > 0 ? (totalOrders / visitors) * 100 : null;

  const vsSuffix = ` vs prior ${dateRange.label.toLowerCase()}`;

  const orderDistRaw = dashboardData?.orderDistribution ?? [];
  const orderDistChartData = orderDistRaw.map((entry) => ({
    label: entry.status,
    value: entry.count,
  }));

  const categoryChartData = useMemo(
    () =>
      (topCategories?.categories || []).slice(0, 8).map((cat) => ({
        label: cat.category,
        value: cat.revenue,
      })),
    [topCategories]
  );

  const sharingTimeChartData = useMemo(
    () =>
      (sharingAnalytics?.timeTrends || []).map((t) => ({
        label: new Date(t.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        value: t.shareCount,
      })),
    [sharingAnalytics]
  );

  const recentBroadcastStats = useMemo(() => {
    const broadcasts = Array.isArray(broadcastHistory?.broadcasts) ? broadcastHistory.broadcasts : [];
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

  const shareBadge = sharingAnalytics?.shareTrackingRecorded === false;

  const kpiLoading = dashboardLoading && !dashboardData;

  if (dashboardError) {
    return (
      <AdminLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-gray-300">Failed to load analytics.</p>
          <button
            type="button"
            onClick={() => refetchDashboard()}
            className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-4 py-2 text-red-200"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-10 sm:px-6 lg:px-10">
          <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <AdminPageHeader
              title="Analytics"
              tag="Platform Monitoring"
              subtitle="Accurate, range-scoped marketplace metrics for operators and investors."
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSharingFilters(!showSharingFilters)}
                    className="flex items-center gap-2 rounded-full border border-[#2a3142] px-4 py-2 text-xs font-medium text-gray-300 transition hover:border-[#FF6B00]/50"
                  >
                    <Filter className="h-4 w-4" />
                    Sharing Filters
                  </button>
                  <Link
                    href="/admin/reports"
                    className="flex items-center gap-2 rounded-full border border-[#2a3142] px-4 py-2 text-xs font-medium text-gray-300 transition hover:border-[#FF6B00]/50"
                  >
                    <BarChart2 className="h-4 w-4" />
                    Reports
                  </Link>
                </div>
              }
            />
            <div className="shrink-0 lg:ml-auto">
              <AnalyticsDateRangeSelector value={dateRange} onChange={setDateRange} />
            </div>
          </div>

          {showSharingFilters && (
            <div className="mb-10 rounded-2xl border border-[#2a3142] bg-[#121826] p-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-400">Start Date</label>
                  <input
                    type="date"
                    value={sharingFilters.startDate?.slice(0, 10) || ''}
                    onChange={(e) =>
                      setSharingFilters({ ...sharingFilters, startDate: e.target.value || undefined })
                    }
                    className="w-full rounded-lg border border-[#2a3142] bg-[#090c11] px-3 py-2 text-sm text-white focus:border-[#FF6B00] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-400">End Date</label>
                  <input
                    type="date"
                    value={sharingFilters.endDate?.slice(0, 10) || ''}
                    onChange={(e) =>
                      setSharingFilters({ ...sharingFilters, endDate: e.target.value || undefined })
                    }
                    className="w-full rounded-lg border border-[#2a3142] bg-[#090c11] px-3 py-2 text-sm text-white focus:border-[#FF6B00] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-400">Platform</label>
                  <select
                    value={sharingFilters.platform || ''}
                    onChange={(e) =>
                      setSharingFilters({ ...sharingFilters, platform: e.target.value || undefined })
                    }
                    className="w-full rounded-lg border border-[#2a3142] bg-[#090c11] px-3 py-2 text-sm text-white focus:border-[#FF6B00] focus:outline-none"
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
                  <label className="mb-2 block text-xs font-medium text-gray-400">User Role</label>
                  <select
                    value={sharingFilters.role || ''}
                    onChange={(e) =>
                      setSharingFilters({ ...sharingFilters, role: e.target.value || undefined })
                    }
                    className="w-full rounded-lg border border-[#2a3142] bg-[#090c11] px-3 py-2 text-sm text-white focus:border-[#FF6B00] focus:outline-none"
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
                  type="button"
                  onClick={() => {
                    setSharingFilters({});
                    setShowSharingFilters(false);
                  }}
                  className="rounded-lg border border-[#2a3142] px-4 py-2 text-sm text-gray-300 hover:border-[#FF6B00]/50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          <section className="mb-10">
            <SectionTitle>Platform overview</SectionTitle>
            <div
              className={clsx(
                'grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4',
                dashboardFetching && dashboardData && 'pointer-events-none'
              )}
            >
              <KpiCard
                label="Total orders"
                description={dateRange.label}
                loading={kpiLoading}
                trendPct={pctDelta(totalOrders, prior?.totalOrders ?? 0)}
                trendSuffix={vsSuffix}
                fetching={dashboardFetching}
              >
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-6 w-6 text-[#FF6B00]" />
                  {formatNumber(totalOrders)}
                </span>
              </KpiCard>

              <KpiCard
                label="Gross revenue"
                description="All non-cancelled orders (incl. pending payment)"
                loading={kpiLoading}
                trendPct={pctDelta(totalRevenueKobo, prior?.gmvKobo ?? 0)}
                trendSuffix={vsSuffix}
                fetching={dashboardFetching}
              >
                <span className="flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-emerald-400" />
                  {formatNairaKobo(totalRevenueKobo)}
                </span>
              </KpiCard>

              <KpiCard
                label="GMV (processed)"
                description="Paid → delivered pipeline"
                loading={kpiLoading}
                trendPct={pctDelta(processedGmv, prior?.processedGmvKobo ?? 0)}
                trendSuffix={vsSuffix}
                fetching={dashboardFetching}
              >
                {formatNairaKobo(processedGmv)}
              </KpiCard>

              <KpiCard
                label="Platform revenue"
                description="Commission earned (period)"
                loading={kpiLoading}
                trendPct={pctDelta(platformCommission, prior?.platformCommissionKobo ?? 0)}
                trendSuffix={vsSuffix}
                fetching={dashboardFetching}
              >
                {formatNairaKobo(platformCommission)}
              </KpiCard>

              <KpiCard
                label="Active sellers"
                description="Received ≥1 order in range"
                loading={kpiLoading}
                trendPct={null}
                trendSuffix=""
                fetching={dashboardFetching}
              >
                <span className="flex items-center gap-2">
                  <Store className="h-6 w-6 text-blue-400" />
                  {formatNumber(metrics?.activeSellersThisPeriod ?? 0)}
                </span>
              </KpiCard>

              <KpiCard
                label="Pending payouts"
                description="Net ₦ owed to sellers (unsettled)"
                loading={kpiLoading}
                trendPct={null}
                trendSuffix=""
                positiveIsGood={false}
                fetching={dashboardFetching}
              >
                <span className="flex items-center gap-2">
                  <Wallet className="h-6 w-6 text-amber-400" />
                  {formatNairaKobo(metrics?.pendingPayoutsKobo ?? 0)}
                </span>
              </KpiCard>

              <KpiCard
                label="Repeat order rate"
                description="Orders from returning buyers"
                loading={kpiLoading}
                trendPct={null}
                trendSuffix=""
                fetching={dashboardFetching}
              >
                <span className="flex items-center gap-2">
                  <Repeat className="h-6 w-6 text-violet-400" />
                  {(metrics?.repeatOrderRatePercent ?? 0).toFixed(1)}%
                </span>
              </KpiCard>

              <KpiCard
                label="Avg. order value"
                description="Revenue ÷ orders"
                loading={kpiLoading}
                trendPct={null}
                trendSuffix=""
                fetching={dashboardFetching}
              >
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-emerald-400" />
                  {totalOrders > 0 ? formatNairaKobo(aovKobo) : '₦0'}
                </span>
              </KpiCard>

              <KpiCard
                label="Conversion rate"
                description="Unique product viewers → orders"
                loading={kpiLoading}
                trendPct={null}
                trendSuffix=""
                fetching={dashboardFetching}
              >
                <span
                  className="flex items-center gap-2"
                  title={
                    visitors <= 0
                      ? 'Visitor tracking is not available until product_view analytics events are recorded.'
                      : undefined
                  }
                >
                  <Percent className="h-6 w-6 text-cyan-400" />
                  {visitors <= 0 || conversionPct == null ? (
                    <span className="text-xl">N/A</span>
                  ) : (
                    `${conversionPct.toFixed(1)}%`
                  )}
                </span>
              </KpiCard>

              <KpiCard
                label="Sellers"
                description="Registered merchants (all time)"
                loading={kpiLoading}
                trendPct={null}
                trendSuffix=""
                fetching={dashboardFetching}
              >
                <span className="flex items-center gap-2">
                  <Package className="h-6 w-6 text-blue-400" />
                  {formatNumber(metrics?.totalSellers ?? 0)}
                </span>
              </KpiCard>

              <KpiCard
                label="Customers"
                description="Registered buyers"
                loading={kpiLoading}
                trendPct={null}
                trendSuffix=""
                fetching={dashboardFetching}
              >
                <span className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-purple-400" />
                  {formatNumber(metrics?.totalCustomers ?? 0)}
                </span>
              </KpiCard>

              <KpiCard
                label="Active deliveries"
                description="In progress"
                loading={kpiLoading}
                trendPct={null}
                trendSuffix=""
                fetching={dashboardFetching}
              >
                <span className="flex items-center gap-2">
                  <Truck className="h-6 w-6 text-amber-400" />
                  {formatNumber(metrics?.activeDeliveries ?? 0)}
                </span>
              </KpiCard>
            </div>
          </section>

          <section className="mb-10">
            <SectionTitle>Sales &amp; revenue trends</SectionTitle>
            <div className="rounded-2xl border border-[#2a3142] bg-[#121826] p-6 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.55)]">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold text-white">Daily order value</h3>
                <div className="flex flex-wrap items-center gap-2">
                  {(['line', 'bar', 'area'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDailyChartView(v)}
                      className={clsx(
                        'rounded-lg px-2.5 py-1 text-xs font-medium capitalize',
                        dailyChartView === v
                          ? 'bg-[#FF6B00] text-white'
                          : 'bg-[#1f2534] text-gray-400 hover:text-gray-200'
                      )}
                    >
                      {v}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowComparison(!showComparison)}
                    className={clsx(
                      'ml-1 rounded-lg px-2.5 py-1 text-xs font-medium',
                      showComparison ? 'bg-[#FF6B00] text-white' : 'bg-[#1f2534] text-gray-400'
                    )}
                  >
                    vs prior period
                  </button>
                </div>
              </div>
              {kpiLoading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : salesTrend?.trend && salesTrend.trend.length > 0 ? (
                <div className="h-[280px]">
                  {prevTrendLoading && showComparison ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <DailyOrderValueChart
                      data={salesTrend.trend}
                      comparisonData={previousSalesTrend?.trend}
                      view={dailyChartView}
                      showComparison={showComparison}
                      color="#FF6B00"
                      comparisonColor="#6b7280"
                      granularity={salesTrend.granularity}
                    />
                  )}
                </div>
              ) : (
                <div className="flex h-[280px] items-center justify-center text-gray-400">
                  No orders in this period
                </div>
              )}
            </div>
          </section>

          <section className="mb-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#2a3142] bg-[#121826] p-6 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.55)]">
              <h3 className="mb-4 text-lg font-semibold text-white">Order status distribution</h3>
              {kpiLoading ? (
                <Skeleton className="h-[320px] w-full" />
              ) : (
                <div className="h-[320px]">
                  <OrderStatusBarChart data={orderDistChartData} />
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-[#2a3142] bg-[#121826] p-6 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.55)]">
              <h3 className="mb-4 text-lg font-semibold text-white">Top categories by sales</h3>
              {kpiLoading ? (
                <Skeleton className="h-[320px] w-full" />
              ) : categoryChartData.length > 0 ? (
                <div className="h-[320px]">
                  <BarChart
                    data={categoryChartData}
                    color="#FF6B00"
                    valueFormatter={(v) => formatNairaKobo(v)}
                    yAxisTickFormatter={(v) =>
                      `₦${new Intl.NumberFormat('en-NG', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }).format(v / 100)}`
                    }
                  />
                </div>
              ) : (
                <div className="flex h-[320px] items-center justify-center text-gray-400">
                  No category sales in this period
                </div>
              )}
            </div>
          </section>

          <section className="mb-10">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <h2 className="border-l-4 border-[#FF6B00] pl-3 text-xl font-bold text-white">
                  Product sharing
                </h2>
                {shareBadge ? (
                  <span className="w-fit rounded-full border border-[#2a3142] bg-[#1a1f2e] px-3 py-1 text-xs font-medium text-gray-400">
                    Coming soon — connect in-app Share actions to the API
                  </span>
                ) : null}
              </div>
              <Link
                href="/admin/sharing/analytics"
                className="flex items-center gap-2 text-sm font-medium text-[#FF6B00] hover:underline"
              >
                Full sharing analytics
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
            {sharingError ? (
              <div className="rounded-2xl border-2 border-red-500/40 bg-[#121826] p-6 text-center">
                <p className="text-gray-300">Sharing analytics failed to load.</p>
                <button
                  type="button"
                  onClick={() => refetchSharing()}
                  className="mt-3 text-sm text-red-300 underline"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      title: 'Total shares',
                      sub: 'Product links shared',
                      v: sharingLoading ? null : formatNumber(sharingAnalytics?.totalShares ?? 0),
                      icon: Share2,
                    },
                    {
                      title: 'Unique sharers',
                      sub: 'Users who shared',
                      v: sharingLoading ? null : formatNumber(sharingAnalytics?.uniqueSharers ?? 0),
                      icon: Users,
                    },
                    {
                      title: 'Products shared',
                      sub: 'Unique products',
                      v: sharingLoading ? null : formatNumber(sharingAnalytics?.uniqueProducts ?? 0),
                      icon: Package,
                    },
                    {
                      title: 'Avg per product',
                      sub: 'Shares per product',
                      v: sharingLoading
                        ? null
                        : sharingAnalytics && sharingAnalytics.uniqueProducts > 0
                          ? (sharingAnalytics.totalShares / sharingAnalytics.uniqueProducts).toFixed(1)
                          : '0',
                      icon: TrendingUp,
                    },
                  ].map((card) => (
                    <div
                      key={card.title}
                      className="rounded-2xl border border-[#2a3142] bg-[#121826] p-6 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.55)]"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{card.title}</p>
                      <p className="text-xs text-gray-500">{card.sub}</p>
                      {sharingLoading ? (
                        <Skeleton className="mt-3 h-9 w-20" />
                      ) : (
                        <p className="mt-2 flex items-center gap-2 text-3xl font-bold text-white">
                          <card.icon className="h-6 w-6 text-[#FF6B00]" />
                          {card.v}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
                  <div className="rounded-2xl border border-[#2a3142] bg-[#121826] p-6">
                    <h4 className="mb-4 font-semibold text-white">Platform breakdown</h4>
                    {sharingLoading ? (
                      <Skeleton className="h-[280px] w-full" />
                    ) : sharingAnalytics?.sharesByPlatform && sharingAnalytics.sharesByPlatform.length > 0 ? (
                      <DonutChart data={buildDonutData(sharingAnalytics.sharesByPlatform)} height={280} showLegend />
                    ) : (
                      <p className="py-12 text-center text-gray-400">No platform data in this range</p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-[#2a3142] bg-[#121826] p-6">
                    <h4 className="mb-4 font-semibold text-white">Shares by role</h4>
                    {sharingLoading ? (
                      <Skeleton className="h-[280px] w-full" />
                    ) : sharingAnalytics?.sharesByRole && sharingAnalytics.sharesByRole.length > 0 ? (
                      <div className="h-[280px]">
                        <BarChart
                          data={sharingAnalytics.sharesByRole.map((r) => ({
                            label: r.role,
                            value: r.count,
                          }))}
                          color="#8b5cf6"
                        />
                      </div>
                    ) : (
                      <p className="py-12 text-center text-gray-400">No role data in this range</p>
                    )}
                  </div>
                </div>
                {sharingTimeChartData.length > 0 && (
                  <div className="mt-10 rounded-2xl border border-[#2a3142] bg-[#121826] p-6">
                    <h4 className="mb-4 font-semibold text-white">Sharing trends</h4>
                    <div className="h-[260px]">
                      <BarChart data={sharingTimeChartData} color="#FF6B00" />
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="mb-10">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <SectionTitle>Broadcast engagement</SectionTitle>
              <Link
                href="/admin/broadcast-history"
                className="flex items-center gap-2 text-sm font-medium text-[#FF6B00] hover:underline"
              >
                Broadcast history
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
            {Array.isArray(broadcastHistory?.broadcasts) && broadcastHistory.broadcasts.length > 0 ? (
              <>
                {recentBroadcastStats && (
                  <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { t: 'Recent broadcasts', v: recentBroadcastStats.broadcastsCount, icon: Mail },
                      { t: 'Emails sent', v: formatNumber(recentBroadcastStats.totalSent), icon: Mail },
                      { t: 'Avg open rate', v: `${recentBroadcastStats.openRate.toFixed(1)}%`, icon: BarChart2 },
                      { t: 'Avg click rate', v: `${recentBroadcastStats.clickRate.toFixed(1)}%`, icon: BarChart2 },
                    ].map((x) => (
                      <div
                        key={x.t}
                        className="rounded-2xl border border-[#2a3142] bg-[#121826] p-6 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.55)]"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{x.t}</p>
                        <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-white">
                          <x.icon className="h-5 w-5 text-[#FF6B00]" />
                          {x.v}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="overflow-x-auto rounded-2xl border border-[#2a3142]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2a3142] bg-[#121826]">
                        <th className="px-4 py-3 text-left font-medium text-gray-400">Subject / Type</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-400">Audience</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-400">Open rate</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-400">Click rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(broadcastHistory?.broadcasts ?? []).map((b) => {
                        const sent = b.sentEmail ?? 0;
                        const openRate =
                          sent > 0 && b.emailOpens != null ? ((b.emailOpens / sent) * 100).toFixed(1) : '—';
                        const clickRate =
                          sent > 0 && b.emailClicks != null ? ((b.emailClicks / sent) * 100).toFixed(1) : '—';
                        const audience = b.recipientCount ?? (b.sentInApp + b.sentEmail);
                        return (
                          <tr key={b.id} className="border-b border-[#2a3142] hover:bg-[#121826]/80">
                            <td className="px-4 py-3">
                              <p className="font-medium text-white">{b.subject}</p>
                              <p className="text-xs text-gray-400">{b.type}</p>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-300">
                              {typeof audience === 'number' ? formatNumber(audience) : audience}
                            </td>
                            <td className="px-4 py-3 text-right text-emerald-400">
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
              <div className="rounded-2xl border border-[#2a3142] bg-[#121826] p-8 text-center text-gray-400">
                <p>No broadcast data yet.</p>
                <Link href="/admin/broadcast" className="mt-3 inline-block text-[#FF6B00] hover:underline">
                  Create broadcast
                </Link>
              </div>
            )}
          </section>

          <section className="mb-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#2a3142] bg-[#121826] p-6 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.55)]">
              <h3 className="mb-4 text-lg font-semibold text-white">Customer metrics</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-gray-500">New this month</p>
                  <p className="text-xl font-bold text-white">
                    {formatNumber(metrics?.newCustomersThisMonth ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Active this month</p>
                  <p className="text-xl font-bold text-white">
                    {formatNumber(metrics?.activeCustomersThisMonth ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Retention rate</p>
                  <p className="text-xl font-bold text-[#FF6B00]">
                    {(metrics?.customerRetentionRate ?? 0).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="mt-8">
                <h4 className="mb-3 text-sm font-medium text-gray-300">Cohort retention (monthly)</h4>
                {kpiLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : cohort?.message ? (
                  <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-[#2a3142] bg-[#0f1524] p-6 text-center text-gray-400">
                    {cohort.message}
                  </div>
                ) : (
                  <CohortRetentionHeatmap
                    data={cohort?.rows ?? []}
                    monthLabels={cohort?.monthLabels}
                    emptyMessage="Not enough data yet — requires at least 2 months of order history"
                  />
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-[#2a3142] bg-[#121826] p-6 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.55)]">
              <h3 className="mb-4 text-lg font-semibold text-white">Inventory health</h3>
              {kpiLoading || inventoryLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Low stock items</p>
                    <p className="text-xl font-bold text-amber-400">
                      {formatNumber(inventoryReport?.lowStockCount ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Out of stock</p>
                    <p className="text-xl font-bold text-red-400">
                      {formatNumber(inventoryReport?.outOfStockCount ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Total products</p>
                    <p className="text-xl font-bold text-white">
                      {formatNumber(inventoryReport?.totalProducts ?? 0)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section>
            <SectionTitle>Deep dive</SectionTitle>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { href: '/admin/reports', title: 'Reports & exports', desc: 'Sales, earnings, orders.', icon: FileSpreadsheet },
                { href: '/admin/sharing/analytics', title: 'Sharing analytics', desc: 'Platforms, roles, time.', icon: Share2 },
                { href: '/admin/broadcast-history', title: 'Broadcast history', desc: 'Past campaigns.', icon: Radio },
                { href: '/admin/warehouse', title: 'Warehouse', desc: 'Stock movements.', icon: Warehouse },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="group flex flex-col rounded-2xl border border-[#2a3142] bg-[#121826] p-6 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.55)] transition hover:border-[#FF6B00]/40"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6B00]/15 text-[#FF6B00]">
                    <l.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-white">{l.title}</h3>
                  <p className="mt-1 text-sm text-gray-400">{l.desc}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
