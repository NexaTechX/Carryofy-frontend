import AdminLayout from '../../components/admin/AdminLayout';
import { useAdminDashboard } from '../../lib/admin/hooks/useAdminDashboard';
import { useAdminProfile } from '../../lib/admin/hooks/useAdminProfile';
import { AlertTriangle } from 'lucide-react';
import { AdminCard, AdminPageHeader, AdminToolbar } from '../../components/admin/ui';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

const TrendChart = dynamic(() => import('../../components/admin/charts/TrendChart'), { ssr: false });
const BarChart = dynamic(() => import('../../components/admin/charts/BarChart'), { ssr: false });

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


function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-8 sm:px-6 lg:px-10">
      <div className="flex flex-col gap-6">
        <div className="h-12 w-full animate-pulse rounded-2xl bg-[#1f2534]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={`metric-skeleton-${index}`} className="h-28 animate-pulse rounded-2xl bg-[#1f2534]" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`insight-skeleton-${index}`} className="h-80 animate-pulse rounded-2xl bg-[#1f2534]" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`alert-skeleton-${index}`} className="h-40 animate-pulse rounded-2xl bg-[#1f2534]" />
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

  const { metrics, salesTrend, topCategories, commissionRevenue, lowStock, pendingSellerApprovals, pendingPayments } =
    data;

  const sparklineValues = (salesTrend?.trend || []).map((point) => point.amount);
  const trendPercentage = getTrendPercentage(sparklineValues);
  const trendLabel = `${trendPercentage >= 0 ? '+' : ''}${trendPercentage.toFixed(0)}%`;

  const metricsCards = [
    {
      label: "Today's Orders",
      value: formatNumber(metrics.totalOrders),
    },
    {
      label: 'Pending Deliveries',
      value: formatNumber(metrics.activeDeliveries),
    },
    {
      label: 'Gross Order Volume',
      value: formatCurrency(metrics.totalRevenue / 100),
    },
    {
      label: 'Active Sellers',
      value: formatNumber(metrics.totalSellers),
    },
    {
      label: 'Total Customers',
      value: formatNumber(metrics.totalCustomers || 0),
    },
  ];

  const customerMetricsCards = [
    {
      label: 'Total Customers',
      value: formatNumber(metrics.totalCustomers || 0),
      description: 'All registered buyers',
    },
    {
      label: 'New This Month',
      value: formatNumber(metrics.newCustomersThisMonth || 0),
      description: 'New customer sign-ups',
    },
    {
      label: 'Active This Month',
      value: formatNumber(metrics.activeCustomersThisMonth || 0),
      description: 'Customers who placed orders',
    },
    {
      label: 'Retention Rate',
      value: `${metrics.customerRetentionRate || 0}%`,
      description: 'Repeat customer rate',
    },
  ];

  // Calculate category percentages and prepare chart data
  const categoryChartData = (topCategories?.categories || []).slice(0, 5).map((cat) => ({
    label: cat.category,
    value: cat.count,
  }));

  // Calculate overall growth percentage
  const categoryGrowth = topCategories?.categories.length > 0
    ? topCategories.categories[0].percentage.toFixed(0)
    : '0';


  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Overview"
            tag="Carryofy Admin"
            subtitle={`Welcome back, ${profile?.name ?? 'Admin'}. Here’s what’s happening across the marketplace today.`}
            actions={
              <span className="rounded-full border border-[#1f2534] px-5 py-2 text-xs font-medium text-gray-300">
                {profile?.email ?? 'info@carrydoy.com'}
              </span>
            }
          />

          <section className="mb-10">
            <h2 className="px-1 text-[22px] font-bold leading-tight text-white">Key Metrics</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {metricsCards.map(({ label, value }) => (
                <AdminCard
                  key={label}
                  title={label}
                  className="bg-linear-to-br from-primary/12 via-[#101829] to-[#080d16]"
                  contentClassName="justify-between"
                >
                  <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
                </AdminCard>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="px-1 text-[22px] font-bold leading-tight text-white">Customer Analytics</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          </section>

          <section className="mb-10">
            <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-linear-to-br from-[#0f1729] via-primary/10 to-[#0a101b] p-6 shadow-[0_32px_60px_-40px_rgba(255,102,0,0.5)] sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <p className="text-lg font-bold text-white">Platform Commission Revenue</p>
                <p className="mt-2 text-3xl font-bold text-primary">
                  {formatCurrency((commissionRevenue?.totalRevenue || metrics.totalCommissions) / 100)}
                </p>
                <p className="mt-2 text-sm text-gray-400">
                  {commissionRevenue?.growth >= 0 ? '+' : ''}{commissionRevenue?.growth.toFixed(1) || '0'}% growth this period
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Total commissions earned across all orders
                </p>
              </div>
              <div className="h-32 w-full rounded-xl border border-primary/30 bg-[#0b1322] p-3 sm:max-w-xs">
                {commissionRevenue?.periods && commissionRevenue.periods.length > 0 ? (
                  <div className="flex h-full items-end justify-between gap-2">
                    {commissionRevenue.periods.map((period, index) => {
                      const maxAmount = Math.max(...commissionRevenue.periods.map(p => p.amount || 0));
                      const height = maxAmount > 0 ? ((period.amount || 0) / maxAmount) * 100 : 0;
                      return (
                        <div key={index} className="flex flex-1 flex-col items-center gap-1.5">
                          <div 
                            className="w-full rounded-t bg-gradient-to-t from-primary via-[#ff8740] to-primary transition-all hover:opacity-90 hover:from-[#ff8740] hover:via-primary"
                            style={{ height: `${Math.max(height, 8)}%`, minHeight: '8px' }}
                            title={`${period.period}: ${formatCurrency((period.amount || 0) / 100)}`}
                          />
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
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
            </div>
          </section>

          <section className="mb-10">
            <h2 className="px-1 text-[22px] font-bold leading-tight text-white">
              Performance Insights
            </h2>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-linear-to-br from-[#0f1729] to-[#0a101b] p-6 shadow-[0_26px_48px_-34px_rgba(255,102,0,0.35)]">
                <div>
                  <p className="text-base font-medium text-white">Daily Order Trends</p>
                  <p className="mt-1 text-[32px] font-bold text-primary">{trendLabel}</p>
                  <div className="flex gap-2 text-sm">
                    <span className="text-gray-400">Last 7 Days</span>
                    <span className="text-primary font-medium">{trendLabel}</span>
                  </div>
                </div>
                <div className="mt-2 h-[200px] rounded-xl border border-primary/10 bg-[#0b1322] p-3">
                  <TrendChart data={salesTrend?.trend || []} color="#ff6600" />
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-linear-to-br from-[#0f1729] to-[#0a101b] p-6 shadow-[0_26px_48px_-34px_rgba(255,102,0,0.35)]">
                <div>
                  <p className="text-base font-medium text-white">Top-Selling Categories</p>
                  <p className="mt-1 text-[32px] font-bold text-primary">
                    {categoryChartData.length > 0 ? `${categoryChartData[0].label}` : 'N/A'}
                  </p>
                  <div className="flex gap-2 text-sm">
                    <span className="text-gray-400">
                      {topCategories?.total || 0} total categories
                    </span>
                    <span className="text-primary font-medium">
                      {categoryGrowth}% leading
                    </span>
                  </div>
                </div>
                <div className="mt-2 h-[200px] rounded-xl border border-primary/10 bg-[#0b1322] p-3">
                  {categoryChartData.length > 0 ? (
                    <BarChart data={categoryChartData} color="#ff6600" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">
                      No category data available
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-linear-to-br from-[#0f1729] to-[#0a101b] p-6 shadow-[0_26px_48px_-34px_rgba(255,102,0,0.35)]">
                <div>
                  <p className="text-base font-medium text-white">Commission Revenue</p>
                  <p className="mt-1 text-[32px] font-bold text-primary">
                    {commissionRevenue?.growth >= 0 ? '+' : ''}{commissionRevenue?.growth.toFixed(1) || '0'}%
                  </p>
                  <div className="flex gap-2 text-sm">
                    <span className="text-gray-400">Total: {formatCurrency((commissionRevenue?.totalRevenue || 0) / 100)}</span>
                  </div>
                </div>
                <div className="mt-4 space-y-5">
                  {commissionRevenue?.periods.length > 0 ? (
                    commissionRevenue.periods.map(({ period, percentage }) => (
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

          <section className="mb-10">
            <h2 className="px-1 text-[22px] font-bold leading-tight text-white">
              Product Performance
            </h2>
            <div className="mt-4 rounded-2xl border border-primary/20 bg-linear-to-br from-[#0f1729] to-[#0a101b] p-6 shadow-[0_30px_56px_-36px_rgba(255,102,0,0.4)]">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-500">
                    Sales Volume &amp; Revenue
                  </p>
                  <p className="mt-2 text-[32px] font-bold leading-tight text-white">
                    {formatCurrency((salesTrend?.totalSales || 0) / 100)}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <span className="text-gray-400">{salesTrend?.period || 'Last 7 days'}</span>
                    <span className="font-semibold text-primary">{trendLabel}</span>
                  </div>
                </div>
                <div className="flex gap-4 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                  {(salesTrend?.trend || []).slice(0, 7).map((point, index) => (
                    <span key={index}>
                      {new Date(point.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-6 h-48 rounded-xl border border-primary/10 bg-[#0b1322] p-3">
                <TrendChart data={salesTrend?.trend || []} color="#ff6600" />
              </div>
            </div>
          </section>

          <section className="mb-6">
            <h2 className="px-1 text-[22px] font-bold leading-tight text-white">Quick Actions</h2>
          <AdminToolbar className="mt-4 gap-3">
              <button 
                onClick={() => router.push('/admin/products')}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-black transition hover:bg-primary-light"
              >
                Add Product
              </button>
              <button 
                onClick={() => router.push('/admin/warehouse')}
                className="rounded-full border border-primary/25 bg-[#0f1729] px-5 py-2 text-sm font-semibold text-white transition hover:border-primary hover:text-primary"
              >
                View Warehouse
              </button>
              <button 
                onClick={() => router.push('/admin/reports')}
                className="rounded-full border border-primary/25 bg-[#0f1729] px-5 py-2 text-sm font-semibold text-white transition hover:border-primary hover:text-primary"
              >
                Generate Report
              </button>
          </AdminToolbar>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}

