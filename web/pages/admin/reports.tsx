'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  AdminCard,
  AdminEmptyState,
  AdminPageHeader,
  LoadingState,
} from '../../components/admin/ui';
import {
  useEarningsReport,
  useInventoryReport,
  useOrderDistributionReport,
  useSalesReport,
  useSalesTrendReport,
  useTopSellersReport,
} from '../../lib/admin/hooks/useReports';
import { ReportsQueryParams } from '../../lib/admin/types';
import { exportReportPdf } from '../../lib/admin/exportReportPdf';
import { formatNgnFromKobo } from '../../lib/api/utils';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Download,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  BarChart3,
  LineChart,
  Package,
  DollarSign,
  ShoppingCart,
} from 'lucide-react';
import type { SalesTrendView } from '../../components/admin/charts/SalesTrendChart';

const SalesTrendChart = dynamic(
  () => import('../../components/admin/charts/SalesTrendChart'),
  { ssr: false }
);
const OrderDistributionChart = dynamic(
  () => import('../../components/admin/charts/OrderDistributionChart'),
  { ssr: false }
);

type DatePreset = 'today' | 'week' | 'month' | 'custom';

function getPresetRange(preset: DatePreset): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  if (preset === 'today') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (preset === 'week') {
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (preset === 'month') {
    start.setMonth(start.getMonth() - 1);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function TrendIndicator({ changePercent }: { changePercent: number | undefined }) {
  if (changePercent == null) return <span className="text-xs text-gray-500">— vs previous period</span>;
  const isUp = changePercent >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
      {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {isUp ? '+' : ''}{changePercent.toFixed(1)}% vs previous period
    </span>
  );
}

export default function AdminReports() {
  const router = useRouter();
  const [datePreset, setDatePreset] = useState<DatePreset>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [category, setCategory] = useState('');
  const [chartView, setChartView] = useState<SalesTrendView>('line');
  const [showEarningsOverlay, setShowEarningsOverlay] = useState(true);
  const [drillDownStatus, setDrillDownStatus] = useState<string | null>(null);
  const [filterBarStuck, setFilterBarStuck] = useState(false);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Initialize preset dates
  useEffect(() => {
    if (datePreset !== 'custom') {
      const { start, end } = getPresetRange(datePreset);
      setStartDate(start);
      setEndDate(end);
    }
  }, [datePreset]);

  const appliedParams: ReportsQueryParams = useMemo(() => {
    const result: ReportsQueryParams = {};
    if (startDate) result.startDate = startDate;
    if (endDate) result.endDate = endDate;
    if (sellerId.trim()) result.sellerId = sellerId.trim();
    if (category.trim()) result.category = category.trim();
    return result;
  }, [startDate, endDate, sellerId, category]);

  const { data: salesReport, isLoading: salesLoading } = useSalesReport(appliedParams);
  const { data: earningsReport, isLoading: earningsLoading } = useEarningsReport(appliedParams);
  const { data: inventoryReport, isLoading: inventoryLoading } = useInventoryReport();
  const { data: salesTrendData } = useSalesTrendReport(appliedParams);
  const { data: orderDistribution } = useOrderDistributionReport(appliedParams);
  const { data: topSellers } = useTopSellersReport(appliedParams);

  // Sticky filter bar
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const bar = filterBarRef.current;
    if (!sentinel || !bar) return;
    const observer = new IntersectionObserver(
      ([e]) => setFilterBarStuck(!e.isIntersecting),
      { threshold: 0, rootMargin: '-1px 0px 0px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const salesTrendValues = salesTrendData?.trend ?? [];
  const earningsTrendValues = useMemo(() => {
    // If backend provides earnings trend we could use it; for now reuse sales trend scale for demo overlay
    return salesTrendValues.length ? salesTrendValues.map((p) => ({ date: p.date, amount: Math.round(p.amount * 0.15) })) : [];
  }, [salesTrendValues]);

  const orderDistWithPct = useMemo(() => {
    if (!orderDistribution || orderDistribution.length === 0) return [];
    const total = orderDistribution.reduce((s, e) => s + e.count, 0);
    return orderDistribution.map((e) => ({
      ...e,
      percentage: total > 0 ? (e.count / total) * 100 : 0,
    }));
  }, [orderDistribution]);

  // Trend vs previous period: optional backend fields or placeholder
  const salesTrendPct = (salesReport as { changePercent?: number } | undefined)?.changePercent;
  const earningsTrendPct = (earningsReport as { changePercent?: number } | undefined)?.changePercent;
  const inventoryTrendPct = undefined;

  const handleExportPdf = async () => {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);
    await exportReportPdf({
      title: 'Carryofy Marketplace Report',
      generatedAt: new Date().toLocaleString('en-NG'),
      dateRange: { start, end },
      sales: {
        totalSales: salesReport?.totalSales ?? 0,
        totalOrders: salesReport?.totalOrders ?? 0,
      },
      earnings: {
        totalNet: earningsReport?.totalNet ?? 0,
        totalGross: earningsReport?.totalGross ?? 0,
        totalCommission: earningsReport?.totalCommission ?? 0,
      },
      inventory: {
        totalProducts: inventoryReport?.totalProducts ?? 0,
        totalQuantity: inventoryReport?.totalQuantity ?? 0,
        lowStockCount: inventoryReport?.lowStockCount ?? 0,
        outOfStockCount: inventoryReport?.outOfStockCount ?? 0,
      },
      orderDistribution: orderDistWithPct,
      topSellers: topSellers ?? [],
    });
  };

  const handleBarClick = (status: string) => {
    setDrillDownStatus(status);
    router.push(`/admin/orders?status=${encodeURIComponent(status)}`);
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div ref={sentinelRef} className="h-0" aria-hidden />
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Reports"
            tag="Analytics"
            subtitle="Track revenue, earnings, and inventory. Use filters to scope by date, seller, and category."
            actions={
              <button
                type="button"
                onClick={handleExportPdf}
                className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:bg-primary-light"
              >
                <Download className="h-4 w-4" />
                Export Report (PDF)
              </button>
            }
          />

          {/* Floating sticky filter bar */}
          <div
            ref={filterBarRef}
            className={`z-20 mb-6 rounded-2xl border bg-[#111111] p-4 shadow-lg transition-all ${
              filterBarStuck ? 'sticky top-0 border-[#1f2534]' : 'border-[#1f1f1f]'
            }`}
          >
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-wrap items-end gap-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Quick select</span>
                {(['today', 'week', 'month', 'custom'] as const).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDatePreset(preset)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      datePreset === preset
                        ? 'bg-primary text-black'
                        : 'border border-[#2a2a2a] text-gray-300 hover:border-primary/50 hover:text-primary'
                    }`}
                  >
                    {preset === 'today' ? 'Today' : preset === 'week' ? 'This Week' : preset === 'month' ? 'This Month' : 'Custom'}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1 text-xs font-medium text-gray-400">
                  Start date
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setDatePreset('custom');
                    }}
                    className="rounded-lg border border-[#2a2a2a] bg-[#090c11] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-gray-400">
                  End date
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setDatePreset('custom');
                    }}
                    className="rounded-lg border border-[#2a2a2a] bg-[#090c11] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-gray-400">
                  Seller ID
                  <input
                    value={sellerId}
                    onChange={(e) => setSellerId(e.target.value)}
                    placeholder="Optional"
                    className="w-36 rounded-lg border border-[#2a2a2a] bg-[#090c11] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-primary focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-gray-400">
                  Category
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Optional"
                    className="w-36 rounded-lg border border-[#2a2a2a] bg-[#090c11] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-primary focus:outline-none"
                  />
                </label>
              </div>
            </form>
          </div>

          {/* Summary cards with trend indicators */}
          <section className="mb-10 grid gap-4 sm:grid-cols-3">
            <AdminCard
              title="Sales"
              description={salesReport ? `${salesReport.totalOrders} orders` : 'Loading…'}
              className="border-[#1f2534] bg-[#0f1524]"
            >
              {salesLoading || !salesReport ? (
                <LoadingState />
              ) : (
                <>
                  <p className="text-3xl font-semibold text-white">{formatNgnFromKobo(salesReport.totalSales)}</p>
                  <TrendIndicator changePercent={salesTrendPct} />
                </>
              )}
            </AdminCard>
            <AdminCard
              title="Earnings"
              description={earningsReport ? `${earningsReport.totalOrders} orders` : 'Loading…'}
              className="border-[#1f2534] bg-[#0f1524]"
            >
              {earningsLoading || !earningsReport ? (
                <LoadingState />
              ) : (
                <>
                  <p className="text-2xl font-semibold text-primary">Net {formatNgnFromKobo(earningsReport.totalNet)}</p>
                  <p className="text-xs text-gray-500">Gross {formatNgnFromKobo(earningsReport.totalGross)} · Commission {formatNgnFromKobo(earningsReport.totalCommission)}</p>
                  <TrendIndicator changePercent={earningsTrendPct} />
                </>
              )}
            </AdminCard>
            <AdminCard
              title="Inventory"
              description="Snapshot across the warehouse"
              className="border-[#1f2534] bg-[#0f1524]"
              actions={
                <Link
                  href="/admin/warehouse"
                  className="inline-flex items-center gap-1 rounded-full border border-[#2a2a2a] px-3 py-1.5 text-xs font-semibold text-gray-300 transition hover:border-primary hover:text-primary"
                >
                  Warehouse
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              {inventoryLoading || !inventoryReport ? (
                <LoadingState />
              ) : (
                <>
                  <div className="space-y-1 text-sm text-gray-300">
                    <p>Products: <span className="font-semibold text-white">{inventoryReport.totalProducts}</span></p>
                    <p>Units: <span className="font-semibold text-white">{inventoryReport.totalQuantity.toLocaleString()}</span></p>
                    <p>Low stock: <span className="font-semibold text-amber-400">{inventoryReport.lowStockCount}</span></p>
                  </div>
                  <TrendIndicator changePercent={inventoryTrendPct} />
                </>
              )}
            </AdminCard>
          </section>

          {/* Sales Trend chart with tooltip, line/bar toggle, overlay */}
          <section className="mb-10">
            <AdminCard
              title="Sales trend"
              className="border-[#1f2534] bg-[#0f1524]"
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setChartView('line')}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      chartView === 'line' ? 'bg-primary text-black' : 'border border-[#2a2a2a] text-gray-400 hover:text-white'
                    }`}
                  >
                    <LineChart className="h-4 w-4" />
                    Line
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartView('bar')}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      chartView === 'bar' ? 'bg-primary text-black' : 'border border-[#2a2a2a] text-gray-400 hover:text-white'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Bar
                  </button>
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-400">
                    <input
                      type="checkbox"
                      checked={showEarningsOverlay}
                      onChange={(e) => setShowEarningsOverlay(e.target.checked)}
                      className="rounded border-[#2a2a2a] bg-[#090c11] text-primary focus:ring-primary"
                    />
                    Overlay earnings
                  </label>
                </div>
              }
            >
              {salesTrendValues.length === 0 ? (
                <AdminEmptyState
                  title="No sales trend"
                  description="Once orders start flowing, you'll see a trend chart here."
                />
              ) : (
                <div className="h-64">
                  <SalesTrendChart
                    salesTrend={salesTrendValues}
                    earningsTrend={showEarningsOverlay ? earningsTrendValues : []}
                    view={chartView}
                    showEarningsOverlay={showEarningsOverlay && earningsTrendValues.length > 0}
                  />
                </div>
              )}
            </AdminCard>
          </section>

          {/* Order distribution with percentage labels and drill-down */}
          <section className="mb-10">
            <AdminCard
              title="Order distribution"
              description={drillDownStatus ? `Click a bar to view orders with that status. Selected: ${drillDownStatus}` : 'Click a bar to drill down into that order status.'}
              className="border-[#1f2534] bg-[#0f1524]"
            >
              {orderDistWithPct.length === 0 ? (
                <AdminEmptyState
                  title="No distribution data"
                  description="Order breakdown by status will appear here."
                />
              ) : (
                <div className="h-64">
                  <OrderDistributionChart
                    data={orderDistWithPct}
                    color="#ff6600"
                    onBarClick={handleBarClick}
                  />
                </div>
              )}
            </AdminCard>
          </section>

          {/* Top Performing Sellers */}
          <section className="mb-10">
            <AdminCard
              title="Top performing sellers"
              description="By revenue in the selected period"
              className="border-[#1f2534] bg-[#0f1524]"
            >
              {!topSellers ? (
                <LoadingState />
              ) : topSellers.length === 0 ? (
                <AdminEmptyState
                  title="No seller data"
                  description="Top sellers will appear here when data is available."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1f2534] text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                        <th className="pb-3 pr-4">Seller</th>
                        <th className="pb-3 pr-4">Revenue</th>
                        <th className="pb-3 pr-4">Orders</th>
                        <th className="pb-3">Commission earned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topSellers.map((s) => (
                        <tr key={s.sellerId} className="border-b border-[#1f2534]/80 text-gray-300 last:border-0">
                          <td className="py-3 pr-4 font-medium text-white">{s.sellerName}</td>
                          <td className="py-3 pr-4">{formatNgnFromKobo(s.revenue)}</td>
                          <td className="py-3 pr-4">{s.orders.toLocaleString()}</td>
                          <td className="py-3 text-primary">{formatNgnFromKobo(s.commissionEarned)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </AdminCard>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
