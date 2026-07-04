import AdminLayout from '../../components/admin/AdminLayout';
import { useAdminDashboard } from '../../lib/admin/hooks/useAdminDashboard';
import { useAdminProfile } from '../../lib/admin/hooks/useAdminProfile';
import { useOperationalIssues } from '../../lib/admin/hooks/useOperationalIssues';
import { useRefundStats } from '../../lib/admin/hooks/useRefunds';
import { usePendingProducts } from '../../lib/admin/hooks/usePendingProducts';
import {
  FileText,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  BarChart3,
  Users,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Radio,
  FileEdit,
  Send,
  MapPin,
  Receipt,
  Warehouse,
  ClipboardList,
} from 'lucide-react';
import { AdminCard, AdminDrawer, AdminErrorState, AdminPageHeader } from '../../components/admin/ui';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import type {
  CommissionPeriodEntry,
  CohortRetentionResponse,
  DashboardMetrics,
  OperationalIssue,
  SalesTrendPoint,
} from '../../lib/admin/types';

const TrendChart = dynamic(() => import('../../components/admin/charts/TrendChart'), { ssr: false });
const BarChart = dynamic(() => import('../../components/admin/charts/BarChart'), { ssr: false });
const Sparkline = dynamic(() => import('../../components/admin/charts/Sparkline'), { ssr: false });
const RetentionTrendChart = dynamic(
  () => import('../../components/admin/charts/RetentionTrendChart'),
  { ssr: false }
);

const formatNumber = (value: number) => value.toLocaleString();

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);

const getTrendPercentage = (values: number[]) => {
  if (values.length < 2) return 0;
  const first = values[0];
  const last = values[values.length - 1];
  if (first === 0) return 0;
  return ((last - first) / first) * 100;
};

/** Orange accent — aligned with `--color-primary` */
const ACCENT = '#FF6B00';

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return 0;
    return null;
  }
  return ((current - previous) / previous) * 100;
}

function pctChangeLastTwoPoints(trend: SalesTrendPoint[], mode: 'amount' | 'orders'): number | null {
  if (trend.length < 2) return null;
  const a = trend[trend.length - 2];
  const b = trend[trend.length - 1];
  if (mode === 'orders') {
    const prev = a.orderCount ?? 0;
    const curr = b.orderCount ?? 0;
    return pctChange(curr, prev);
  }
  return pctChange(b.amount, a.amount);
}

type KpiComparison = { delta: number | null; label: string };

/** Real period-over-period or day-over-day deltas — never placeholder percentages. */
function getKpiComparison(
  index: number,
  metrics: DashboardMetrics,
  salesTrend: SalesTrendPoint[]
): KpiComparison {
  const prior = metrics.priorPeriod;

  if (index === 0) {
    const dayOverDay = pctChangeLastTwoPoints(salesTrend, 'orders');
    if (dayOverDay != null) return { delta: dayOverDay, label: 'vs prior day' };
    if (prior) {
      const periodOrders = metrics.totalOrders ?? 0;
      const delta = pctChange(periodOrders, prior.totalOrders);
      if (delta != null) return { delta, label: 'vs prior period' };
    }
    return { delta: null, label: 'vs prior day' };
  }

  if (index === 2 && prior) {
    const delta = pctChange(metrics.totalRevenue ?? 0, prior.gmvKobo ?? 0);
    if (delta != null) return { delta, label: 'vs prior period' };
  }

  return { delta: null, label: '' };
}

function buildRetentionTrendFromCohort(
  cohort: CohortRetentionResponse | undefined
): { period: string; rate: number }[] {
  if (!cohort?.rows?.length || !cohort.monthLabels?.length) return [];

  const points: { period: string; rate: number }[] = [];
  for (let lag = 0; lag < cohort.monthLabels.length; lag += 1) {
    const rates = cohort.rows
      .map((row) => row.retentionByMonth[lag])
      .filter((r): r is number => typeof r === 'number' && !Number.isNaN(r));
    if (rates.length === 0) continue;
    const avg = rates.reduce((sum, r) => sum + r, 0) / rates.length;
    points.push({
      period: cohort.monthLabels[lag] ?? `M${lag}`,
      rate: Math.round(avg * 10) / 10,
    });
  }
  return points;
}

function formatPeriodLabel(days = 30): string {
  return `Last ${days} days`;
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-24 w-full animate-pulse rounded-2xl bg-card/80" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={`metric-skeleton-${index}`} className="h-36 animate-pulse rounded-2xl bg-card/80" />
        ))}
      </div>
      <div className="h-24 w-full animate-pulse rounded-2xl bg-card/80" />
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`insight-skeleton-${index}`} className="h-80 animate-pulse rounded-2xl bg-card/80" />
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [issuesDrawerOpen, setIssuesDrawerOpen] = useState(false);
  const { data, isLoading, isError, error, refetch } = useAdminDashboard();
  const { data: profile } = useAdminProfile();
  const { data: operationalIssues, isLoading: issuesLoading } = useOperationalIssues();
  const { data: refundStats } = useRefundStats();
  const { data: pendingProducts = [] } = usePendingProducts();

  if (isError) {
    return (
      <AdminLayout>
        <div className="admin-page-shell max-w-7xl">
          <AdminErrorState
            title="Couldn’t load overview"
            message={error instanceof Error ? error.message : 'Please try again.'}
            onRetry={() => refetch()}
          />
        </div>
      </AdminLayout>
    );
  }

  if (isLoading || !data) {
    return (
      <AdminLayout>
        <div className="admin-page-shell max-w-7xl">
          <DashboardSkeleton />
        </div>
      </AdminLayout>
    );
  }

  const {
    metrics,
    salesTrend,
    topCategories,
    commissionRevenue,
    cohortRetention,
    pendingSellerApprovals,
    pendingPayments,
    pendingQuoteRequestsCount = 0,
    b2bOrdersCount = 0,
    dateRange,
  } = data;

  const trendPoints = salesTrend?.trend ?? [];
  const sparklineValues = trendPoints.map((point) => point.amount);
  const trendPercentage = getTrendPercentage(sparklineValues);
  const trendLabel = `${trendPercentage >= 0 ? '+' : ''}${trendPercentage.toFixed(0)}%`;
  const sparklineData = trendPoints.map((p) => ({ date: p.date, value: p.amount / 100 }));

  const pendingRefunds = refundStats?.pending ?? 0;
  const productsAwaitingReview = Array.isArray(pendingProducts) ? pendingProducts.length : 0;

  const issueTotal = operationalIssues?.total ?? 0;
  const issueList = operationalIssues?.issues ?? [];
  /** Green while issues are loading; amber when any operational issue exists. */
  const platformHealthy = issuesLoading ? true : issueTotal === 0;

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const periodDays =
    dateRange?.startDate && dateRange?.endDate
      ? Math.max(
          1,
          Math.round(
            (new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) /
              86400000
          ) + 1
        )
      : 30;

  const heroMetrics = [
    {
      label: "Today's Orders",
      formatted: formatNumber(metrics.todaysOrders ?? 0),
      sparkline: sparklineData,
      icon: ShoppingCart,
    },
    {
      label: 'Pending Deliveries',
      formatted: formatNumber(metrics.activeDeliveries ?? 0),
      sparkline: [],
      icon: Truck,
    },
    {
      label: 'GMV',
      subtitle: formatPeriodLabel(periodDays),
      formatted: formatCurrency((metrics.totalRevenue ?? 0) / 100),
      sparkline: sparklineData,
      icon: BarChart3,
    },
    {
      label: 'Total Sellers',
      formatted: formatNumber(metrics.totalSellers ?? 0),
      sparkline: [],
      icon: Users,
    },
    {
      label: 'Total Users',
      formatted: formatNumber(metrics.totalUsers ?? 0),
      sparkline: [],
      icon: UserPlus,
    },
  ].map((row, index) => {
    const comparison = getKpiComparison(index, metrics, trendPoints);
    return { ...row, comparison };
  });

  const urgentChips: { label: string; count: number; href: string }[] = issueList.map(
    (issue: OperationalIssue) => ({
      label: issue.title,
      count: issue.count,
      href: issue.href,
    }),
  );

  // Legacy fallback if operational-issues endpoint hasn't loaded yet
  if (urgentChips.length === 0 && !issuesLoading) {
    if (pendingSellerApprovals > 0) {
      urgentChips.push({
        label: 'Pending seller KYC approvals',
        count: pendingSellerApprovals,
        href: '/admin/sellers?filter=PENDING',
      });
    }
    if (productsAwaitingReview > 0) {
      urgentChips.push({
        label: 'Products awaiting review',
        count: productsAwaitingReview,
        href: '/admin/products?status=pending',
      });
    }
    if (pendingRefunds > 0) {
      urgentChips.push({
        label: 'Pending refunds',
        count: pendingRefunds,
        href: '/admin/refunds',
      });
    }
    if ((pendingQuoteRequestsCount ?? 0) > 0) {
      urgentChips.push({
        label: 'Pending quote requests',
        count: pendingQuoteRequestsCount ?? 0,
        href: '/admin/quote-requests',
      });
    }
  }

  const categoryChartData = (topCategories?.categories || []).slice(0, 5).map((cat) => ({
    label: cat.category,
    value: cat.count,
  }));
  const categoryGrowth =
    topCategories?.categories.length > 0 ? topCategories.categories[0].percentage.toFixed(0) : '0';

  const commissionPeriods = commissionRevenue?.periods ?? [];
  const effectiveCommissionPeriods: CommissionPeriodEntry[] = commissionPeriods;
  const commissionBarData = effectiveCommissionPeriods.map((p) => ({
    label: p.period.length > 5 ? p.period.slice(0, 3) : p.period,
    value: (p.amount || 0) / 100,
  }));
  const commissionDisplayKobo =
    commissionRevenue?.totalRevenue ||
    metrics.platformCommissionKobo ||
    metrics.totalCommissions ||
    0;
  const commissionGrowthDisplay =
    commissionRevenue?.growth ??
    (metrics.priorPeriod
      ? pctChange(
          metrics.platformCommissionKobo ?? metrics.totalCommissions ?? 0,
          metrics.priorPeriod.platformCommissionKobo ?? 0
        ) ?? 0
      : 0);
  const retentionTrendData = buildRetentionTrendFromCohort(cohortRetention);
  const monthlyTargetKobo = typeof process.env.NEXT_PUBLIC_COMMISSION_TARGET_KOBO === 'string'
    ? Number(process.env.NEXT_PUBLIC_COMMISSION_TARGET_KOBO)
    : undefined;

  const customerMetricsCards = [
    { label: 'Total Customers', value: formatNumber(metrics.totalCustomers || 0), description: 'All registered buyers' },
    { label: 'New This Month', value: formatNumber(metrics.newCustomersThisMonth || 0), description: 'New customer sign-ups' },
    { label: 'Active This Month', value: formatNumber(metrics.activeCustomersThisMonth ?? 0), description: 'Customers who placed orders' },
    { label: 'Retention Rate', value: `${metrics.customerRetentionRate || 0}%`, description: 'Repeat customer rate' },
  ];

  const quickActions = [
    { label: 'Add Product', href: '/admin/products', icon: Package },
    { label: 'View Warehouse', href: '/admin/warehouse', icon: Warehouse },
    { label: 'Generate Report', href: '/admin/reports', icon: ClipboardList },
    { label: 'Approve Pending Sellers', href: '/admin/sellers?filter=PENDING', icon: CheckCircle2 },
    { label: 'Send Broadcast', href: '/admin/broadcast', icon: Send },
    { label: 'View Live Map', href: '/admin/deliveries', icon: MapPin },
    { label: 'Process Refunds', href: '/admin/refunds', icon: Receipt },
  ];

  return (
    <AdminLayout>
      <div className="admin-page-shell max-w-7xl">
          {/* Greeting strip: personalized greeting, date, platform health, Live Mode */}
          <section className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-inter">
                  Hello, {profile?.name ?? 'Admin'}
                </h1>
                <p className="mt-1 text-sm text-gray-400">{dateStr}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!platformHealthy) setIssuesDrawerOpen(true);
                  }}
                  disabled={platformHealthy}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    platformHealthy
                      ? 'cursor-default bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'cursor-pointer bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 hover:border-amber-400/50'
                  }`}
                  aria-label={
                    platformHealthy
                      ? 'All systems operational'
                      : `${issueTotal} operational issues detected. Click to view.`
                  }
                >
                  {platformHealthy ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      All Systems Operational
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      Issues Detected ({issueTotal})
                    </>
                  )}
                </button>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                  <Radio className="h-4 w-4" />
                  Live Mode
                </span>
              </div>
            </div>
          </section>

          {/* Key metrics — elevated cards on dark canvas */}
          <section className="mb-8">
            <h2 className="sr-only">Key Metrics</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {heroMetrics.map(({ label, subtitle, formatted, comparison, sparkline, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border-custom bg-card p-5 shadow-sm shadow-black/25 transition hover:border-primary/25"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</span>
                      {subtitle ? (
                        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                          {subtitle}
                        </p>
                      ) : null}
                    </div>
                    <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  </div>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-[2rem] font-inter">
                    {formatted}
                  </p>
{comparison.delta != null && comparison.label ? (
                    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          comparison.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {comparison.delta >= 0 ? (
                          <TrendingUp className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5" />
                        )}
                        {comparison.delta >= 0 ? '+' : ''}
                        {comparison.delta.toFixed(1)}%
                      </span>
                      <span className="text-xs text-gray-500">{comparison.label}</span>
                    </div>
                  ) : null}
                  {sparkline.length > 0 && (
                    <div className="mt-3 h-12 w-full opacity-90">
                      <Sparkline data={sparkline} color={ACCENT} height={48} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Quick actions — directly under KPIs */}
          <section className="mb-8">
            <h2 className="mb-4 px-0.5 text-lg font-semibold tracking-tight text-foreground">Quick Actions</h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
              {quickActions.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href + label}
                  href={href}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-border-custom bg-card p-5 text-center shadow-sm shadow-black/20 transition hover:border-primary/35 hover:bg-primary/6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Urgent Actions banner */}
          {urgentChips.length > 0 && (
            <section className="mb-8">
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-4">
                <p className="mb-3 text-sm font-semibold text-amber-200">Urgent Actions</p>
                <div className="flex flex-wrap gap-2">
                  {urgentChips.map(({ label, count, href }) => (
                    <Link
                      key={href + label}
                      href={href}
                      className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 transition hover:border-amber-400 hover:bg-amber-500/20"
                    >
                      {label}
                      <span className="rounded-full bg-amber-500/30 px-2 py-0.5 text-xs font-bold text-amber-100">
                        {count}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Business orders strip */}
          {(pendingQuoteRequestsCount > 0 || b2bOrdersCount > 0) && (
            <section className="mb-8">
              <h2 className="mb-4 px-0.5 text-lg font-semibold tracking-tight text-foreground">Business orders</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Link href="/admin/quote-requests">
                  <AdminCard
                    title="Pending quote requests"
                    description="Awaiting seller response"
                    className="cursor-pointer border-border-custom bg-card transition hover:border-primary/35"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <p className="text-2xl font-bold tracking-tight text-white">{pendingQuoteRequestsCount}</p>
                    </div>
                  </AdminCard>
                </Link>
                <AdminCard
                  title="Business orders"
                  description="Wholesale and quote-based checkouts"
                  className="border-border-custom bg-card"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-8 w-8 text-primary" />
                    <p className="text-2xl font-bold tracking-tight text-foreground">{b2bOrdersCount}</p>
                  </div>
                </AdminCard>
              </div>
            </section>
          )}

          {/* Customer Analytics with retention trend line */}
          <section className="mb-8">
            <h2 className="mb-4 px-0.5 text-lg font-semibold tracking-tight text-foreground">Customer Analytics</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {customerMetricsCards.map(({ label, value, description }) => (
                <AdminCard
                  key={label}
                  title={label}
                  description={description}
                  className="border-border-custom bg-card"
                >
                  <p className="text-3xl font-bold text-primary">{value}</p>
                </AdminCard>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-border-custom bg-card p-6 shadow-sm shadow-black/20">
              <p className="text-base font-medium text-foreground">Retention rate trend</p>
              <p className="mt-1 text-sm text-gray-400">Repeat customer rate over time (weekly)</p>
              <div className="mt-4 h-[220px] w-full min-h-[220px] rounded-xl border border-border-custom bg-background/50 p-2">
                <RetentionTrendChart
                  data={retentionTrendData}
                  color={ACCENT}
                  height={204}
                  emptyMessage={cohortRetention?.message ?? 'Not enough retention history to chart yet.'}
                />
              </div>
            </div>
          </section>

          {/* Platform commission revenue — bar chart + rider summary */}
          <section className="mb-8 grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="rounded-2xl border border-border-custom bg-card p-6 shadow-sm shadow-black/20 sm:flex sm:flex-col">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-foreground">Platform Commission Revenue</p>
                  <p className="mt-2 text-3xl font-bold text-primary">
                    {formatCurrency(commissionDisplayKobo / 100)}
                  </p>
                  <p className="mt-2 text-sm text-gray-400">
                    {(commissionGrowthDisplay >= 0 ? '+' : '')}
                    {commissionGrowthDisplay.toFixed(1)}% growth this period
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Seller commissions from product sales</p>
                  {(commissionRevenue?.totalB2B != null || commissionRevenue?.totalB2C != null) ? (
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-400">
                      <span>B2C: {formatCurrency((commissionRevenue?.totalB2C ?? 0) / 100)}</span>
                      <span>B2B: {formatCurrency((commissionRevenue?.totalB2B ?? 0) / 100)}</span>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="mt-6 h-64 w-full min-h-64 rounded-xl border border-border-custom bg-background/50 p-3 sm:h-72">
                <BarChart
                  data={commissionBarData}
                  color={ACCENT}
                  valueFormatter={(v) => formatCurrency(v)}
                  yAxisTickFormatter={(v) =>
                    new Intl.NumberFormat('en-NG', {
                      notation: 'compact',
                      compactDisplay: 'short',
                    }).format(v)
                  }
                />
              </div>
              {monthlyTargetKobo != null && monthlyTargetKobo > 0 ? (
                <p className="mt-2 text-xs text-gray-500">
                  Commission target (env): {formatCurrency(monthlyTargetKobo / 100)}
                </p>
              ) : null}
            </div>
            <AdminCard
              title="Rider Commission"
              description="15% from delivery fees (separate from seller commissions)"
              className="lg:w-64 border-emerald-500/25 bg-card"
            >
              <p className="text-3xl font-bold text-emerald-400">
                {formatCurrency((metrics.riderCommissionKobo ?? 0) / 100)}
              </p>
              <p className="mt-2 text-xs text-gray-500">From rider delivery fees</p>
            </AdminCard>
          </section>

          {/* Performance Insights – 3-column panel */}
          <section className="mb-8">
            <h2 className="mb-4 px-0.5 text-lg font-semibold tracking-tight text-foreground">Performance Insights</h2>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="flex flex-col gap-4 rounded-2xl border border-border-custom bg-card p-6 shadow-sm shadow-black/20">
                <p className="text-base font-medium text-foreground">Daily Order Trends</p>
                <p className="text-2xl font-bold text-primary">{trendLabel}</p>
                <p className="text-sm text-gray-400">{salesTrend?.period ?? formatPeriodLabel(periodDays)}</p>
                <div className="h-[220px] rounded-xl border border-border-custom bg-background/50 p-3">
                  <TrendChart data={salesTrend?.trend || []} color={ACCENT} />
                </div>
              </div>
              <div className="flex flex-col gap-4 rounded-2xl border border-border-custom bg-card p-6 shadow-sm shadow-black/20">
                <p className="text-base font-medium text-foreground">Top-Selling Categories</p>
                <p className="text-2xl font-bold text-primary">
                  {categoryChartData.length > 0 ? categoryChartData[0].label : 'N/A'}
                </p>
                <p className="text-sm text-gray-400">
                  {topCategories?.total || 0} total · {categoryGrowth}% leading
                </p>
                <div className="h-[220px] rounded-xl border border-border-custom bg-background/50 p-3">
                  {categoryChartData.length > 0 ? (
                    <BarChart data={categoryChartData} color={ACCENT} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">
                      No category data available
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-4 rounded-2xl border border-border-custom bg-card p-6 shadow-sm shadow-black/20">
                <p className="text-base font-medium text-foreground">Commission Revenue</p>
                <p className="text-2xl font-bold text-primary">
                  {(commissionGrowthDisplay >= 0 ? '+' : '')}
                  {commissionGrowthDisplay.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-400">Total: {formatCurrency(commissionDisplayKobo / 100)}</p>
                <div className="h-[220px] overflow-y-auto space-y-4 pr-1">
                  {effectiveCommissionPeriods.length > 0 ? (
                    effectiveCommissionPeriods.map(({ period, percentage }) => (
                      <div key={period}>
                        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                          <span>{period}</span>
                          <span>{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-background">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex h-24 items-center justify-center text-sm text-gray-500">
                      No commission data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Product Performance – Top 5 Products This Week leaderboard */}
          <section className="mb-8">
            <h2 className="mb-4 px-0.5 text-lg font-semibold tracking-tight text-foreground">
              Top 5 Products This Week
            </h2>
            <div className="rounded-2xl border border-border-custom bg-card p-6 shadow-sm shadow-black/20">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border-custom text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="pb-3 pr-4">#</th>
                      <th className="pb-3 pr-4">Product</th>
                      <th className="pb-3 pr-4 text-right">Units sold</th>
                      <th className="pb-3 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.topProducts ?? []).length > 0 ? (
                      (data.topProducts ?? []).map((product, index) => (
                        <tr
                          key={product.productId}
                          className="border-b border-border-custom/60 last:border-0"
                        >
                          <td className="py-3 pr-4 text-gray-400">{index + 1}</td>
                          <td className="py-3 pr-4 font-medium text-foreground">
                            {product.productTitle}
                          </td>
                          <td className="py-3 pr-4 text-right text-gray-300">
                            {product.unitsSold.toLocaleString()}
                          </td>
                          <td className="py-3 text-right font-medium text-foreground">
                            {formatCurrency(product.revenueKobo / 100)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500">
                          No product sales in the last 7 days.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

        </div>

      <AdminDrawer
        open={issuesDrawerOpen}
        onClose={() => setIssuesDrawerOpen(false)}
        title="Operational issues"
        description={
          issueTotal > 0
            ? `${issueTotal} item${issueTotal === 1 ? '' : 's'} need attention across ${issueList.length} categor${issueList.length === 1 ? 'y' : 'ies'}.`
            : 'No issues detected.'
        }
        className="max-w-lg"
      >
        {issueList.length === 0 ? (
          <p className="text-sm text-gray-400">All monitored systems look healthy.</p>
        ) : (
          <ul className="space-y-3">
            {issueList.map((issue) => (
              <li
                key={issue.key}
                className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                      issue.severity === 'critical' ? 'bg-red-400' : 'bg-amber-400'
                    }`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{issue.title}</p>
                      <span className="rounded-full bg-[#1a1f2e] px-2 py-0.5 text-xs font-bold text-gray-200">
                        {issue.count}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">{issue.description}</p>
                    <Link
                      href={issue.href}
                      onClick={() => setIssuesDrawerOpen(false)}
                      className="mt-3 inline-flex text-xs font-semibold uppercase tracking-[0.12em] text-primary hover:text-primary-light"
                    >
                      Review →
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminDrawer>
    </AdminLayout>
  );
}
