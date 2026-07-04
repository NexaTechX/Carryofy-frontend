import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../../../components/admin/AdminLayout';
import { AdminCard, AdminPageHeader } from '../../../components/admin/ui';
import { getPlatformWideAnalytics, PlatformAnalyticsQuery } from '../../../lib/api/sharing';
import { Share2, TrendingUp, Users, Package, Filter } from 'lucide-react';
import dynamic from 'next/dynamic';

const BarChart = dynamic(() => import('../../../components/admin/charts/BarChart'), { ssr: false });
const TrendChart = dynamic(() => import('../../../components/admin/charts/TrendChart'), { ssr: false });

export default function AdminSharingAnalytics() {
  const [filters, setFilters] = useState<PlatformAnalyticsQuery>({});
  const [showFilters, setShowFilters] = useState(false);

  const {
    data: analytics,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'sharing-analytics', 'full', filters],
    queryFn: () => getPlatformWideAnalytics(filters),
    retry: 1,
  });

  const formatNumber = (value: number) => value.toLocaleString();

  if (isLoading && !analytics) {
    return (
      <AdminLayout>
        <div className="admin-page-shell max-w-7xl">
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 w-full animate-pulse rounded-2xl bg-[#1f2534]" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="admin-page-shell max-w-7xl">
          <AdminPageHeader
            title="Sharing Analytics"
            tag="Platform Insights"
            subtitle="Track product sharing activity across the platform."
          />
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
            <p className="text-gray-300">Unable to load sharing analytics.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg border border-[#1f2534] px-4 py-2 text-sm text-gray-300 transition hover:border-primary/50"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-page-shell max-w-7xl">
        <AdminPageHeader
          title="Sharing Analytics"
          tag="Platform Insights"
          subtitle="Track product sharing activity across the platform. Monitor shares by platform, user role, and time trends."
          actions={
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-full border border-[#1f2534] px-5 py-2 text-xs font-medium text-gray-300 transition hover:border-primary/50"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          }
        />

        {showFilters && (
          <div className="mb-6 rounded-lg border border-[#1f2534] bg-[#0f1524] p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-300">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
                  className="w-full rounded-lg border border-[#1f2534] bg-[#090c11] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-300">End Date</label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
                  className="w-full rounded-lg border border-[#1f2534] bg-[#090c11] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-300">Platform</label>
                <select
                  value={filters.platform || ''}
                  onChange={(e) => setFilters({ ...filters, platform: e.target.value || undefined })}
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
                  value={filters.role || ''}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value || undefined })}
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
                  setFilters({});
                  setShowFilters(false);
                }}
                className="rounded-lg border border-[#1f2534] px-4 py-2 text-sm text-gray-300 transition hover:border-primary/50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {!isLoading && (analytics?.totalShares ?? 0) === 0 ? (
          <p className="mb-4 text-sm text-gray-400">No share data for the selected filters.</p>
        ) : null}

        <section className="mb-10">
          <h2 className="px-1 text-[22px] font-bold leading-tight text-white">Key Metrics</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminCard title="Total Shares" description="All time shares" className="border-[#1f2534] bg-[#0f1524]">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/20 p-2">
                  <Share2 className="h-5 w-5 text-primary" />
                </div>
                <p className="text-3xl font-bold tracking-tight text-white">
                  {formatNumber(analytics?.totalShares ?? 0)}
                </p>
              </div>
            </AdminCard>

            <AdminCard title="Unique Sharers" description="Users who shared" className="border-[#1f2534] bg-[#0f1524]">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/20 p-2">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <p className="text-3xl font-bold tracking-tight text-white">
                  {formatNumber(analytics?.uniqueSharers ?? 0)}
                </p>
              </div>
            </AdminCard>

            <AdminCard title="Shared Products" description="Unique products shared" className="border-[#1f2534] bg-[#0f1524]">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-500/20 p-2">
                  <Package className="h-5 w-5 text-green-400" />
                </div>
                <p className="text-3xl font-bold tracking-tight text-white">
                  {formatNumber(analytics?.uniqueProducts ?? 0)}
                </p>
              </div>
            </AdminCard>

            <AdminCard title="Avg Shares/Product" description="Average shares per product" className="border-[#1f2534] bg-[#0f1524]">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-500/20 p-2">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                </div>
                <p className="text-3xl font-bold tracking-tight text-white">
                  {analytics && analytics.uniqueProducts > 0
                    ? (analytics.totalShares / analytics.uniqueProducts).toFixed(1)
                    : '0'}
                </p>
              </div>
            </AdminCard>
          </div>
        </section>

        <section className="mb-10 grid gap-6 lg:grid-cols-2">
          <AdminCard title="Shares by Platform" className="border-[#1f2534] bg-[#0f1524]">
            {analytics && analytics.sharesByPlatform.length > 0 ? (
              <BarChart
                data={analytics.sharesByPlatform.map((p) => ({
                  label: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
                  value: p.count,
                }))}
                color="#ff6600"
              />
            ) : (
              <p className="py-8 text-center text-gray-400">No platform data available</p>
            )}
          </AdminCard>

          <AdminCard title="Shares by User Role" className="border-[#1f2534] bg-[#0f1524]">
            {analytics && analytics.sharesByRole.length > 0 ? (
              <BarChart
                data={analytics.sharesByRole.map((r) => ({
                  label: r.role,
                  value: r.count,
                }))}
                color="#25D366"
              />
            ) : (
              <p className="py-8 text-center text-gray-400">No role data available</p>
            )}
          </AdminCard>
        </section>

        {analytics && analytics.timeTrends.length > 0 && (
          <section className="mb-10">
            <AdminCard title="Sharing Trends Over Time" className="border-[#1f2534] bg-[#0f1524]">
              <TrendChart
                data={analytics.timeTrends.map((t) => ({
                  date: t.date,
                  amount: t.shareCount,
                }))}
                color="#ff6600"
              />
            </AdminCard>
          </section>
        )}

        {analytics && analytics.topSharedProducts.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 px-1 text-[22px] font-bold leading-tight text-white">Top Shared Products</h2>
            <div className="space-y-3">
              {analytics.topSharedProducts.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between rounded-lg border border-[#1f2534] bg-[#0f1524] p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-lg font-bold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white">{product.productTitle}</p>
                      <p className="text-sm text-gray-400">Seller: {product.sellerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{formatNumber(product.shareCount)}</p>
                    <p className="text-xs text-gray-400">shares</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AdminLayout>
  );
}
