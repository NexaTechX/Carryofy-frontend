import { useMemo, useState, useRef } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  AdminCard,
  AdminEmptyState,
  AdminPageHeader,
  AdminToolbar,
  LoadingState,
  StatusBadge,
} from '../../components/admin/ui';
import {
  useEarningsReport,
  useInventoryReport,
  useOrderDistributionReport,
  useSalesReport,
  useSalesTrendReport,
} from '../../lib/admin/hooks/useReports';
import { ReportsQueryParams } from '../../lib/admin/types';
import dynamic from 'next/dynamic';
import { Download } from 'lucide-react';

const TrendChart = dynamic(() => import('../../components/admin/charts/TrendChart'), { ssr: false });
const BarChart = dynamic(() => import('../../components/admin/charts/BarChart'), { ssr: false });

const NGN = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

const ORDER_DISTRIBUTION_TONE: Record<string, 'info' | 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  processing: 'info',
  delivered: 'success',
  canceled: 'danger',
};

function downloadCsv(filename: string, rows: Array<string[]>) {
  const csvContent = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AdminReports() {
  const [filters, setFilters] = useState({ startDate: '', endDate: '', sellerId: '', category: '' });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const params: ReportsQueryParams = useMemo(() => {
    const result: ReportsQueryParams = {};
    if (appliedFilters.startDate) result.startDate = appliedFilters.startDate;
    if (appliedFilters.endDate) result.endDate = appliedFilters.endDate;
    if (appliedFilters.sellerId) result.sellerId = appliedFilters.sellerId;
    if (appliedFilters.category) result.category = appliedFilters.category;
    return result;
  }, [appliedFilters]);

  const { data: salesReport, isLoading: salesLoading } = useSalesReport(params);
  const { data: earningsReport, isLoading: earningsLoading } = useEarningsReport(params);
  const { data: inventoryReport, isLoading: inventoryLoading } = useInventoryReport();
  const { data: salesTrend } = useSalesTrendReport();
  const { data: orderDistribution } = useOrderDistributionReport();

  const handleApplyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    const reset = { startDate: '', endDate: '', sellerId: '', category: '' };
    setFilters(reset);
    setAppliedFilters(reset);
  };

  const salesTrendValues = salesTrend?.trend.map((point) => point.amount / 100) ?? [];

  const exportSalesReport = () => {
    if (!salesReport) return;
    downloadCsv('sales-report.csv', [
      ['Metric', 'Value'],
      ['Total Sales', NGN.format(salesReport.totalSales / 100)],
      ['Total Orders', String(salesReport.totalOrders)],
      ['Products Sold', String(salesReport.totalProductsSold)],
      ['Start Date', salesReport.startDate ?? '—'],
      ['End Date', salesReport.endDate ?? '—'],
    ]);
  };

  const exportEarningsReport = () => {
    if (!earningsReport) return;
    downloadCsv('earnings-report.csv', [
      ['Metric', 'Value'],
      ['Gross', NGN.format(earningsReport.totalGross / 100)],
      ['Commission', NGN.format(earningsReport.totalCommission / 100)],
      ['Net', NGN.format(earningsReport.totalNet / 100)],
      ['Orders', String(earningsReport.totalOrders)],
      ['Start Date', earningsReport.startDate ?? '—'],
      ['End Date', earningsReport.endDate ?? '—'],
    ]);
  };

  const exportInventoryReport = () => {
    if (!inventoryReport) return;
    downloadCsv('inventory-report.csv', [
      ['Metric', 'Value'],
      ['Total Products', String(inventoryReport.totalProducts)],
      ['Total Quantity', String(inventoryReport.totalQuantity)],
      ['Low Stock Items', String(inventoryReport.lowStockCount)],
      ['Out of Stock Items', String(inventoryReport.outOfStockCount)],
    ]);
  };

  const exportSalesTrendChart = () => {
    if (!salesTrend || !salesTrend.trend.length) return;
    downloadCsv('sales-trend.csv', [
      ['Date', 'Sales Amount (NGN)'],
      ...salesTrend.trend.map((point) => [
        new Date(point.date).toLocaleDateString(),
        String(point.amount / 100),
      ]),
    ]);
  };

  const exportOrderDistribution = () => {
    if (!orderDistribution || orderDistribution.length === 0) return;
    downloadCsv('order-distribution.csv', [
      ['Status', 'Count', 'Percentage'],
      ...orderDistribution.map((entry) => [
        entry.status,
        String(entry.count),
        `${entry.percentage.toFixed(1)}%`,
      ]),
    ]);
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Reports"
            tag="Analytics"
            subtitle="Generate insights across revenue, earnings, and inventory."
          />

          <form onSubmit={handleApplyFilters} className="mb-6 rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Start date
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))}
                  className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                End date
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))}
                  className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Seller ID
                <input
                  value={filters.sellerId}
                  onChange={(event) => setFilters((prev) => ({ ...prev, sellerId: event.target.value }))}
                  placeholder="Optional"
                  className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Category
                <input
                  value={filters.category}
                  onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
                  placeholder="Optional"
                  className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-full bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light"
              >
                Apply filters
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-full border border-[#2a2a2a] px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary"
              >
                Reset
              </button>
            </div>
          </form>

          <section className="mb-10 grid gap-4 sm:grid-cols-3">
            <AdminCard title="Sales" description={salesReport ? `${salesReport.totalOrders} orders` : 'Loading…'} actions={
              <button
                type="button"
                onClick={exportSalesReport}
                disabled={!salesReport}
                className="rounded-full border border-[#2a2a2a] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary disabled:opacity-50"
              >
                Export CSV
              </button>
            }>
              {salesLoading || !salesReport ? (
                <LoadingState />
              ) : (
                <p className="text-3xl font-semibold text-white">{NGN.format(salesReport.totalSales / 100)}</p>
              )}
            </AdminCard>
            <AdminCard title="Earnings" description={earningsReport ? `${earningsReport.totalOrders} orders` : 'Loading…'} actions={
              <button
                type="button"
                onClick={exportEarningsReport}
                disabled={!earningsReport}
                className="rounded-full border border-[#2a2a2a] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary disabled:opacity-50"
              >
                Export CSV
              </button>
            }>
              {earningsLoading || !earningsReport ? (
                <LoadingState />
              ) : (
                <div className="space-y-1">
                  <p className="text-2xl font-semibold text-primary">Net {NGN.format(earningsReport.totalNet / 100)}</p>
                  <p className="text-xs text-gray-500">Gross {NGN.format(earningsReport.totalGross / 100)} • Commission {NGN.format(earningsReport.totalCommission / 100)}</p>
                </div>
              )}
            </AdminCard>
            <AdminCard title="Inventory" description="Snapshot across the warehouse" actions={
              <button
                type="button"
                onClick={exportInventoryReport}
                disabled={!inventoryReport}
                className="rounded-full border border-[#2a2a2a] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary disabled:opacity-50"
              >
                Export CSV
              </button>
            }>
              {inventoryLoading || !inventoryReport ? (
                <LoadingState />
              ) : (
                <div className="space-y-1 text-sm text-gray-300">
                  <p>Products: <span className="font-semibold text-white">{inventoryReport.totalProducts}</span></p>
                  <p>Units: <span className="font-semibold text-white">{inventoryReport.totalQuantity.toLocaleString()}</span></p>
                  <p>Low stock: <span className="font-semibold text-[#f97316]">{inventoryReport.lowStockCount}</span></p>
                </div>
              )}
            </AdminCard>
          </section>

          <section className="mb-10 rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Sales trend</h2>
              <button
                onClick={exportSalesTrendChart}
                className="flex items-center gap-2 rounded-full border border-[#2a2a2a] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
            {salesTrendValues.length === 0 ? (
              <AdminEmptyState title="No sales trend" description="Once orders start flowing, you'll see a trend chart here." />
            ) : (
              <div className="h-64">
                <TrendChart data={salesTrend?.trend || []} color="#ff6600" />
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Order distribution</h2>
              <button
                onClick={exportOrderDistribution}
                disabled={!orderDistribution || orderDistribution.length === 0}
                className="flex items-center gap-2 rounded-full border border-[#2a2a2a] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
            {orderDistribution && orderDistribution.length > 0 ? (
              <div className="h-64">
                <BarChart
                  data={orderDistribution.map((entry) => ({ label: entry.status, value: entry.count }))}
                  color="#ff6600"
                />
              </div>
            ) : (
              <AdminEmptyState title="No distribution data" description="Order breakdown by status will appear here." />
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}