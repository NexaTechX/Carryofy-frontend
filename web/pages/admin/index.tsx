import AdminLayout from '../../components/admin/AdminLayout';
import { useAdminDashboard } from '../../lib/admin/hooks/useAdminDashboard';
import { useAdminProfile } from '../../lib/admin/hooks/useAdminProfile';
import { useRefundStats } from '../../lib/admin/hooks/useRefunds';
import { usePendingProducts } from '../../lib/admin/hooks/usePendingProducts';
import {
  AlertTriangle,
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
import { AdminCard, AdminPageHeader } from '../../components/admin/ui';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';

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

const PRIMARY = '#ff6600';

function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-8 sm:px-6 lg:px-10">
      <div className="flex flex-col gap-6">
        <div className="h-24 w-full animate-pulse rounded-2xl bg-[#1f2534]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={`metric-skeleton-${index}`} className="h-36 animate-pulse rounded-2xl bg-[#1f2534]" />
          ))}
        </div>
        <div className="h-20 w-full animate-pulse rounded-2xl bg-[#1f2534]" />
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`insight-skeleton-${index}`} className="h-80 animate-pulse rounded-2xl bg-[#1f2534]" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useAdminDashboard();
  const { data: profile } = useAdminProfile();
  const { data: refundStats } = useRefundStats();
  const { data: pendingProducts = [] } = usePendingProducts();

  if (isError) {
    return (
      <AdminLayout>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center text-gray-300">
          <AlertTriangle className="h-10 w-10 text-primary" />
          <p className="text-sm">
            Failed to load admin overview. {error instanceof Error ? error.message : ''}
          </p>
          <button
            onClick={() => refetch()}
            className="rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-black"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  if (isLoading || !data) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-[#090c11]">
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
    pendingSellerApprovals,
    pendingPayments,
    pendingQuoteRequestsCount = 0,
    b2bOrdersCount = 0,
  } = data;

  const sparklineValues = (salesTrend?.trend || []).map((point) => point.amount);
  const trendPercentage = getTrendPercentage(sparklineValues);
  const trendLabel = `${trendPercentage >= 0 ? '+' : ''}${trendPercentage.toFixed(0)}%`;
  const sparklineData = (salesTrend?.trend || []).map((p) => ({ date: p.date, value: p.amount / 100 }));

  const pendingRefunds = refundStats?.pending ?? 0;
  const productsAwaitingReview = Array.isArray(pendingProducts) ? pendingProducts.length : 0;
  const stalledOrders = metrics.pendingOrders ?? pendingPayments ?? 0;

  const hasUrgentActions =
    pendingSellerApprovals > 0 ||
    productsAwaitingReview > 0 ||
    pendingRefunds > 0 ||
    stalledOrders > 0 ||
    (pendingQuoteRequestsCount ?? 0) > 0;
  const platformHealthy = !hasUrgentActions;

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const heroMetrics = [
    {
      label: "Today's Orders",
      value: metrics.todaysOrders ?? metrics.totalOrders ?? 0,
      formatted: formatNumber(metrics.todaysOrders ?? metrics.totalOrders ?? 0),
      trend: trendPercentage,
      sparkline: sparklineData,
      icon: ShoppingCart,
    },
    {
      label: 'Pending Deliveries',
      value: metrics.activeDeliveries,
      formatted: formatNumber(metrics.activeDeliveries),
      trend: trendPercentage,
      sparkline: sparklineData,
      icon: Truck,
    },
    {
      label: 'Gross Order Volume',
      value: (metrics.totalRevenue ?? 0) / 100,
      formatted: formatCurrency((metrics.totalRevenue ?? 0) / 100),
      trend: trendPercentage,
      sparkline: sparklineData,
      icon: BarChart3,
    },
    {
      label: 'Total Sellers',
      value: metrics.totalSellers ?? 0,
      formatted: formatNumber(metrics.totalSellers ?? 0),
      trend: 0,
      sparkline: sparklineData,
      icon: Users,
    },
    {
      label: 'Total Signups',
      value: metrics.totalUsers ?? 0,
      formatted: formatNumber(metrics.totalUsers ?? 0),
      trend: 0,
      sparkline: sparklineData,
      icon: UserPlus,
    },
  ];

  const urgentChips: { label: string; count: number; href: string }[] = [];
  if (pendingSellerApprovals > 0) {
    urgentChips.push({
      label: 'Pending seller KYC approvals',
      count: pendingSellerApprovals,
      href: '/admin/sellers?kyc=pending',
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
      label: 'Overdue refunds',
      count: pendingRefunds,
      href: '/admin/refunds',
    });
  }
  if (stalledOrders > 0) {
    urgentChips.push({
      label: 'Stalled orders',
      count: stalledOrders,
      href: '/admin/orders?status=pending',
    });
  }
  if ((pendingQuoteRequestsCount ?? 0) > 0) {
    urgentChips.push({
      label: 'Pending quote requests',
      count: pendingQuoteRequestsCount,
      href: '/admin/quote-requests',
    });
  }

  const categoryChartData = (topCategories?.categories || []).slice(0, 5).map((cat) => ({
    label: cat.category,
    value: cat.count,
  }));
  const categoryGrowth =
    topCategories?.categories.length > 0 ? topCategories.categories[0].percentage.toFixed(0) : '0';

  const commissionPeriods = commissionRevenue?.periods ?? [];
  const maxCommission = Math.max(...commissionPeriods.map((p) => p.amount || 0), 1);
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
    { label: 'Approve Pending Sellers', href: '/admin/sellers?kyc=pending', icon: CheckCircle2 },
    { label: 'Send Broadcast', href: '/admin/broadcast', icon: Send },
    { label: 'View Live Map', href: '/admin/deliveries', icon: MapPin },
    { label: 'Process Refunds', href: '/admin/refunds', icon: Receipt },
  ];

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          {/* Greeting strip: personalized greeting, date, platform health, Live Mode */}
          <section className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Hello, {profile?.name ?? 'Admin'}
                </h1>
                <p className="mt-1 text-sm text-gray-400">{dateStr}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    platformHealthy
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {platformHealthy ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      All Systems Operational
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      Issues Detected
                    </>
                  )}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                  <Radio className="h-4 w-4" />
                  Live Mode
                </span>
              </div>
            </div>
          </section>

          {/* Key Metrics – hero cards with large numbers, trend arrows, sparklines */}
          <section className="mb-8">
            <h2 className="sr-only">Key Metrics</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {heroMetrics.map(({ label, value, formatted, trend, sparkline, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[#1f2534] bg-linear-to-br from-primary/10 via-[#101829] to-[#080d16] p-5 shadow-[0_18px_38px_-24px_rgba(0,0,0,0.5)] transition hover:border-primary/30"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</span>
                    <Icon className="h-5 w-5 text-primary/70" aria-hidden />
                  </div>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">{formatted}</p>
                  <div className="mt-3 flex items-center gap-2">
                    {trend !== 0 && (
                      <span
                        className={`inline-flex items-center text-xs font-semibold ${
                          trend >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        {trend >= 0 ? '+' : ''}{trend.toFixed(0)}%
                      </span>
                    )}
                    <span className="text-xs text-gray-500">vs yesterday</span>
                  </div>
                  {sparkline.length > 0 && (
                    <div className="mt-3 h-12 w-full">
                      <Sparkline data={sparkline} color={PRIMARY} height={48} />
                    </div>
                  )}
                </div>
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

          {/* B2B strip – keep if relevant */}
          {(pendingQuoteRequestsCount > 0 || b2bOrdersCount > 0) && (
            <section className="mb-8">
              <h2 className="mb-4 px-1 text-lg font-bold text-white">B2B</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Link href="/admin/quote-requests">
                  <AdminCard
                    title="Pending quote requests"
                    description="Awaiting seller response"
                    className="cursor-pointer bg-linear-to-br from-primary/12 via-[#101829] to-[#080d16] transition hover:border-primary/40"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <p className="text-2xl font-bold tracking-tight text-white">{pendingQuoteRequestsCount}</p>
                    </div>
                  </AdminCard>
                </Link>
                <AdminCard
                  title="B2B orders"
                  description="Bulk and quote-based checkouts"
                  className="bg-linear-to-br from-primary/12 via-[#101829] to-[#080d16]"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-8 w-8 text-primary" />
                    <p className="text-2xl font-bold tracking-tight text-white">{b2bOrdersCount}</p>
                  </div>
                </AdminCard>
              </div>
            </section>
          )}

          {/* Customer Analytics with retention trend line */}
          <section className="mb-8">
            <h2 className="mb-4 px-1 text-[22px] font-bold leading-tight text-white">Customer Analytics</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {customerMetricsCards.map(({ label, value, description }) => (
                <AdminCard
                  key={label}
                  title={label}
                  description={description}
                  className="bg-linear-to-br from-[#0f1729] to-[#0a101b]"
                >
                  <p className="text-3xl font-bold text-primary">{value}</p>
                </AdminCard>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-primary/20 bg-linear-to-br from-[#0f1729] to-[#0a101b] p-6">
              <p className="text-base font-medium text-white">Retention rate trend</p>
              <p className="mt-1 text-sm text-gray-400">Repeat customer rate over time</p>
              <div className="mt-4 h-[200px]">
                <RetentionTrendChart
                  data={[]}
                  currentRate={metrics.customerRetentionRate || 0}
                  color={PRIMARY}
                  height={200}
                />
              </div>
            </div>
          </section>

          {/* Platform Commission Revenue – larger chart + goal line */}
          <section className="mb-8">
            <div className="rounded-2xl border border-primary/20 bg-linear-to-br from-[#0f1729] via-primary/10 to-[#0a101b] p-6 shadow-[0_32px_60px_-40px_rgba(255,102,0,0.5)] sm:flex sm:flex-col">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg font-bold text-white">Platform Commission Revenue</p>
                  <p className="mt-2 text-3xl font-bold text-primary">
                    {formatCurrency((commissionRevenue?.totalRevenue || metrics.totalCommissions || 0) / 100)}
                  </p>
                  <p className="mt-2 text-sm text-gray-400">
                    {((commissionRevenue?.growth ?? 0) >= 0 ? '+' : '')}
                    {(commissionRevenue?.growth ?? 0).toFixed(1)}% growth this period
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Total commissions earned across all orders</p>
                  {(commissionRevenue?.totalB2B != null || commissionRevenue?.totalB2C != null) && (
                    <div className="mt-2 flex gap-4 text-xs text-gray-400">
                      <span>B2C: {formatCurrency((commissionRevenue?.totalB2C ?? 0) / 100)}</span>
                      <span>B2B: {formatCurrency((commissionRevenue?.totalB2B ?? 0) / 100)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6 h-56 w-full rounded-xl border border-primary/30 bg-[#0b1322] p-4 sm:h-64">
                {commissionPeriods.length > 0 ? (
                  <div className="relative flex h-full items-end justify-between gap-2">
                    {monthlyTargetKobo != null && monthlyTargetKobo > 0 && maxCommission > 0 && (
                      <div
                        className="absolute left-0 right-0 z-10 border-t-2 border-dashed border-emerald-500/60"
                        style={{
                          bottom: `${Math.min((monthlyTargetKobo / maxCommission) * 100, 98)}%`,
                        }}
                        title={`Target: ${formatCurrency(monthlyTargetKobo / 100)}`}
                        aria-hidden
                      />
                    )}
                    {commissionPeriods.map((period, index) => {
                      const amount = period.amount || 0;
                      const height = maxCommission > 0 ? (amount / maxCommission) * 100 : 0;
                      return (
                        <div key={index} className="flex flex-1 flex-col items-center gap-2">
                          <div className="flex w-full flex-1 flex-col justify-end min-h-0">
                            <div
                              className="w-full rounded-t bg-linear-to-t from-primary via-[#ff8740] to-primary transition-all hover:opacity-90"
                              style={{
                                height: `${Math.max(height, 6)}%`,
                                minHeight: '12px',
                              }}
                              title={`${period.period}: ${formatCurrency(amount / 100)}`}
                            />
                          </div>
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                            {period.period.split(' ')[0].slice(0, 3)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-xs text-gray-500">No commission data available</p>
                  </div>
                )}
              </div>
              {monthlyTargetKobo != null && monthlyTargetKobo > 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  Dashed line: monthly target {formatCurrency(monthlyTargetKobo / 100)}
                </p>
              )}
            </div>
          </section>

          {/* Performance Insights – 3-column panel */}
          <section className="mb-8">
            <h2 className="mb-4 px-1 text-[22px] font-bold leading-tight text-white">Performance Insights</h2>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-linear-to-br from-[#0f1729] to-[#0a101b] p-6 shadow-[0_26px_48px_-34px_rgba(255,102,0,0.35)]">
                <p className="text-base font-medium text-white">Daily Order Trends</p>
                <p className="text-2xl font-bold text-primary">{trendLabel}</p>
                <p className="text-sm text-gray-400">Last 7 days</p>
                <div className="h-[220px] rounded-xl border border-primary/10 bg-[#0b1322] p-3">
                  <TrendChart data={salesTrend?.trend || []} color={PRIMARY} />
                </div>
              </div>
              <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-linear-to-br from-[#0f1729] to-[#0a101b] p-6 shadow-[0_26px_48px_-34px_rgba(255,102,0,0.35)]">
                <p className="text-base font-medium text-white">Top-Selling Categories</p>
                <p className="text-2xl font-bold text-primary">
                  {categoryChartData.length > 0 ? categoryChartData[0].label : 'N/A'}
                </p>
                <p className="text-sm text-gray-400">
                  {topCategories?.total || 0} total · {categoryGrowth}% leading
                </p>
                <div className="h-[220px] rounded-xl border border-primary/10 bg-[#0b1322] p-3">
                  {categoryChartData.length > 0 ? (
                    <BarChart data={categoryChartData} color={PRIMARY} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">
                      No category data available
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-linear-to-br from-[#0f1729] to-[#0a101b] p-6 shadow-[0_26px_48px_-34px_rgba(255,102,0,0.35)]">
                <p className="text-base font-medium text-white">Commission Revenue</p>
                <p className="text-2xl font-bold text-primary">
                  {((commissionRevenue?.growth ?? 0) >= 0 ? '+' : '')}
                  {(commissionRevenue?.growth ?? 0).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-400">
                  Total: {formatCurrency((commissionRevenue?.totalRevenue || 0) / 100)}
                </p>
                <div className="h-[220px] overflow-y-auto space-y-4">
                  {(commissionRevenue?.periods?.length ?? 0) > 0 ? (
                    (commissionRevenue.periods ?? []).map(({ period, percentage }) => (
                      <div key={period}>
                        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                          <span>{period}</span>
                          <span>{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-[#101723]">
                          <div
                            className="h-full rounded-full bg-linear-to-r from-primary via-[#ff8740] to-primary"
                            style={{ width: `${percentage}%` }}
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
            <h2 className="mb-4 px-1 text-[22px] font-bold leading-tight text-white">
              Top 5 Products This Week
            </h2>
            <div className="rounded-2xl border border-primary/20 bg-linear-to-br from-[#0f1729] to-[#0a101b] p-6 shadow-[0_30px_56px_-36px_rgba(255,102,0,0.4)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#1f2534] text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="pb-3 pr-4">#</th>
                      <th className="pb-3 pr-4">Product</th>
                      <th className="pb-3 pr-4 text-right">Units sold</th>
                      <th className="pb-3 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        No product performance data this week. Connect a top-products report or API to populate this leaderboard.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Quick Actions – icon+label cards */}
          <section className="mb-6">
            <h2 className="mb-4 px-1 text-[22px] font-bold leading-tight text-white">Quick Actions</h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
              {quickActions.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href + label}
                  href={href}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-[#1f2534] bg-[#0f1729] p-5 text-center transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold text-white">{label}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
