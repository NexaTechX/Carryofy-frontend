import Head from 'next/head';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import SellerLayout from '../../../components/seller/SellerLayout';
import DateRangePicker, { type DateRange, type DatePreset } from '../../../components/seller/DateRangePicker';
import { useAuth, tokenManager } from '../../../lib/auth';
import {
  Download,
  Users,
  Package,
  DollarSign,
  BarChart3,
  ChevronDown,
  HelpCircle,
  Check,
  Circle,
} from 'lucide-react';
import { formatNgnFromKobo, getApiUrl } from '../../../lib/api/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const formatPrice = (priceInKobo: number) => formatNgnFromKobo(priceInKobo);

interface ProductAnalytics {
  productId: string;
  productTitle: string;
  status: string;
  totalSales: number;
  totalRevenue: number;
  averageRating: number;
  reviewCount: number;
  estimatedViews: number;
  conversionRate: number;
  currentStock: number;
}

interface CustomerInsights {
  totalCustomers: number;
  repeatCustomers: number;
  newCustomers: number;
  topCustomers: Array<{
    userId: string;
    userName: string;
    orderCount: number;
    totalSpent: number;
  }>;
  customerRetentionRate: number;
}

interface OrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue?: number;
  topProducts: Array<{
    productId?: string;
    productTitle?: string;
    title?: string;
    sales: number;
    revenue: number;
  }>;
}

interface CommissionBreakdown {
  totalGross: number;
  totalCommission: number;
  totalNet: number;
  commissionRate: number;
  breakdown: Array<{
    period: string;
    gross: number;
    commission: number;
    net: number;
  }>;
}

interface SalesTrendItem {
  date: string;
  amount: number;
}

interface SalesTrendResponse {
  trend: SalesTrendItem[];
  totalSales?: number;
  totalOrders?: number;
  period?: string;
}

function getDefaultDateRange(): DateRange {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const end = today.toISOString().split('T')[0];
  const start = new Date(today);
  start.setDate(start.getDate() - 29);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end,
    preset: '30d',
  };
}

function downloadCsv(filename: string, rows: Array<string[]>) {
  const csvContent = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
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

function buildFullReportCsv(
  orderAnalytics: OrderAnalytics | null,
  customerInsights: CustomerInsights | null,
  commissionBreakdown: CommissionBreakdown | null,
  productAnalytics: ProductAnalytics[]
): Array<string[]> {
  const rows: Array<string[]> = [];

  if (orderAnalytics) {
    const avg =
      Number.isFinite(orderAnalytics.averageOrderValue)
        ? orderAnalytics.averageOrderValue!
        : orderAnalytics.totalOrders > 0
          ? orderAnalytics.totalRevenue / orderAnalytics.totalOrders
          : 0;
    const productName = (p: { productTitle?: string; title?: string }) => p.productTitle ?? p.title ?? 'Unknown';
    rows.push(['ORDER ANALYTICS', '']);
    rows.push(['Total Orders', String(orderAnalytics.totalOrders)]);
    rows.push(['Total Revenue', formatPrice(orderAnalytics.totalRevenue)]);
    rows.push(['Average Order Value', formatPrice(avg)]);
    rows.push(['', '']);
    rows.push(['Top Products', '']);
    rows.push(['Product', 'Sales', 'Revenue']);
    orderAnalytics.topProducts.forEach((p) =>
      rows.push([productName(p), String(p.sales), formatPrice(p.revenue)])
    );
    rows.push(['', '']);
  }

  if (customerInsights) {
    rows.push(['CUSTOMER INSIGHTS', '']);
    rows.push(['Total Customers', String(customerInsights.totalCustomers)]);
    rows.push(['Repeat Customers', String(customerInsights.repeatCustomers)]);
    rows.push(['New Customers', String(customerInsights.newCustomers)]);
    rows.push(['Retention Rate', `${(customerInsights.customerRetentionRate ?? 0).toFixed(1)}%`]);
    rows.push(['', '']);
  }

  if (commissionBreakdown) {
    rows.push(['COMMISSION BREAKDOWN', '']);
    rows.push(['Gross Revenue', formatPrice(commissionBreakdown.totalGross)]);
    rows.push(['Platform Commission', formatPrice(commissionBreakdown.totalCommission)]);
    rows.push(['Net Earnings', formatPrice(commissionBreakdown.totalNet)]);
    rows.push(['Commission Rate', `${(commissionBreakdown.commissionRate ?? 0).toFixed(2)}%`]);
    rows.push(['', '']);
  }

  if (productAnalytics.length > 0) {
    rows.push(['PRODUCT ANALYTICS', '']);
    rows.push([
      'Product',
      'Status',
      'Sales',
      'Revenue',
      'Rating',
      'Reviews',
      'Conversion',
      'Stock',
    ]);
    productAnalytics.forEach((p) =>
      rows.push([
        p.productTitle,
        p.status,
        String(p.totalSales),
        formatPrice(p.totalRevenue),
        p.averageRating.toFixed(1),
        String(p.reviewCount),
        `${p.conversionRate.toFixed(2)}%`,
        String(p.currentStock),
      ])
    );
  }

  return rows;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [productAnalytics, setProductAnalytics] = useState<ProductAnalytics[]>([]);
  const [customerInsights, setCustomerInsights] = useState<CustomerInsights | null>(null);
  const [orderAnalytics, setOrderAnalytics] = useState<OrderAnalytics | null>(null);
  const [commissionBreakdown, setCommissionBreakdown] = useState<CommissionBreakdown | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrendResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  const [exportOpen, setExportOpen] = useState(false);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [productCount, setProductCount] = useState(0);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    if (user.role && user.role !== 'SELLER' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    fetchAnalytics();
    fetchKycAndProducts();
  }, [router, authLoading, isAuthenticated, user, dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    if (exportOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [exportOpen]);

  const fetchKycAndProducts = async () => {
    const token = tokenManager.getAccessToken();
    if (!token) return;
    try {
      const [kycRes, productsRes] = await Promise.all([
        fetch(getApiUrl('/sellers/kyc'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(getApiUrl('/products?limit=1'), { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (kycRes.ok) {
        const kycData = await kycRes.json();
        setKycStatus(kycData.data?.status ?? kycData.status ?? null);
      }
      if (productsRes.ok) {
        const prodData = await productsRes.json();
        const data = prodData.data ?? prodData;
        const list = Array.isArray(data) ? data : (data?.products ?? []);
        const total = typeof data?.total === 'number' ? data.total : list.length;
        setProductCount(total);
      }
    } catch {
      // ignore
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = tokenManager.getAccessToken();
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const [
        productRes,
        customerRes,
        orderRes,
        commissionRes,
        salesTrendRes,
      ] = await Promise.allSettled([
        fetch(getApiUrl(`/reports/products/analytics?${params.toString()}`), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(getApiUrl('/reports/customers/insights'), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(getApiUrl(`/orders/analytics?${params.toString()}`), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(getApiUrl(`/reports/commission/breakdown?${params.toString()}`), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(getApiUrl(`/reports/sales-trend?${params.toString()}`), {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const parseJson = async (res: PromiseSettledResult<Response>) =>
        res.status === 'fulfilled' && res.value.ok ? (await res.value.json()).data ?? (await res.value.json()) : null;

      const [productData, customerData, orderData, commissionData, salesTrendData] = await Promise.all([
        parseJson(productRes),
        parseJson(customerRes),
        parseJson(orderRes),
        parseJson(commissionRes),
        parseJson(salesTrendRes),
      ]);

      setProductAnalytics(Array.isArray(productData?.products) ? productData.products : []);
      setCustomerInsights(customerData ?? null);
      setOrderAnalytics(orderData ?? null);
      setCommissionBreakdown(commissionData ?? null);
      setSalesTrend(salesTrendData ?? null);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalGmv = orderAnalytics?.totalRevenue ?? commissionBreakdown?.totalGross ?? 0;
  const totalOrders = orderAnalytics?.totalOrders ?? 0;
  const conversionRate =
    productAnalytics.length > 0
      ? productAnalytics.reduce((a, p) => a + p.conversionRate, 0) / productAnalytics.length
      : 0;
  const hasData =
    (orderAnalytics && orderAnalytics.totalOrders > 0) ||
    (customerInsights && customerInsights.totalCustomers > 0) ||
    (commissionBreakdown && commissionBreakdown.totalGross > 0) ||
    productAnalytics.length > 0;
  const hasDateRange = !!(dateRange.startDate && dateRange.endDate);

  const exportAsCsv = () => {
    const rows = buildFullReportCsv(orderAnalytics, customerInsights, commissionBreakdown, productAnalytics);
    if (rows.length === 0) return;
    downloadCsv('analytics-report.csv', rows);
    setExportOpen(false);
  };

  const exportAsPdf = () => {
    window.print();
    setExportOpen(false);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#ff6600]/30 border-t-[#ff6600]" />
          <p className="text-[#ffcc99]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  const lineChartData =
    salesTrend?.trend && salesTrend.trend.length > 0
      ? salesTrend.trend.map((t) => ({
          date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: t.amount / 100,
          fullDate: t.date,
        }))
      : [];

  const isEmptyChart = lineChartData.length === 0;
  const donutData =
    customerInsights && (customerInsights.newCustomers > 0 || customerInsights.repeatCustomers > 0)
      ? [
          { name: 'New', value: customerInsights.newCustomers, color: '#FF6B00' },
          { name: 'Repeat', value: customerInsights.repeatCustomers, color: '#3b82f6' },
        ]
      : [{ name: 'No data', value: 1, color: '#2A2A2A' }];

  const identityVerified = kycStatus === 'APPROVED';
  const hasProduct = productCount > 0;
  const hasOrder = totalOrders > 0;
  const allZeros =
    totalGmv === 0 &&
    totalOrders === 0 &&
    (!customerInsights || customerInsights.totalCustomers === 0) &&
    (!commissionBreakdown || commissionBreakdown.totalGross === 0);

  return (
    <>
      <Head>
        <title>Analytics - Seller Portal | Carryofy</title>
        <meta name="description" content="View comprehensive analytics and reports for your business on Carryofy." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SellerLayout>
        <div className="mx-auto max-w-[1200px] px-4 pb-16">
          {/* Header: Title + Date Picker + Export */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <p className="text-white text-[32px] font-bold leading-tight">Analytics & Reports</p>
            <div className="flex items-center gap-3">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              {hasDateRange && hasData && (
                <div ref={exportRef} className="relative">
                  <button
                    onClick={() => setExportOpen(!exportOpen)}
                    className="flex h-10 items-center gap-2 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-4 text-sm font-medium text-white transition hover:border-[#FF6B00]/50"
                  >
                    Export Report
                    <ChevronDown className={`h-4 w-4 transition ${exportOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {exportOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 min-w-[180px] rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] py-1 shadow-xl">
                      <button
                        onClick={exportAsCsv}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white hover:bg-[#2A2A2A]"
                      >
                        <Download className="h-4 w-4" />
                        Export as CSV
                      </button>
                      <button
                        onClick={exportAsPdf}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white hover:bg-[#2A2A2A]"
                      >
                        Export as PDF
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#ff6600]/30 border-t-[#ff6600]" />
              <p className="text-[#ffcc99]">Loading analytics...</p>
            </div>
          ) : (
            <>
              {/* Overview Stat Strip */}
              <div
                className="mb-8 flex flex-wrap items-center justify-between gap-6 rounded-xl border px-6 py-6"
                style={{
                  backgroundColor: '#FF6B0010',
                  borderColor: '#FF6B0030',
                  borderWidth: 1,
                }}
              >
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#A0A0A0]">
                    Total GMV
                  </p>
                  <p
                    className="text-white"
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 32,
                      fontWeight: 700,
                    }}
                  >
                    {formatPrice(totalGmv)}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#A0A0A0]">
                    Total Orders
                  </p>
                  <p
                    className="text-white"
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 32,
                      fontWeight: 700,
                    }}
                  >
                    {totalOrders}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#A0A0A0]">
                    Conversion Rate
                  </p>
                  <p
                    className="text-white"
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 32,
                      fontWeight: 700,
                    }}
                  >
                    {conversionRate.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Order Analytics Section */}
              <section className="mb-8">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
                  <BarChart3 className="h-5 w-5 text-[#FF6B00]" />
                  Order Analytics
                </h2>
                <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-6">
                  <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-[#2A2A2A] bg-[#111111] p-4">
                      <p className="mb-2 text-sm text-[#A0A0A0]">Total Orders</p>
                      <p className="text-2xl font-bold text-white">{orderAnalytics?.totalOrders ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-[#2A2A2A] bg-[#111111] p-4">
                      <p className="mb-2 text-sm text-[#A0A0A0]">Total Revenue</p>
                      <p className="text-2xl font-bold text-white">
                        {formatPrice(orderAnalytics?.totalRevenue ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#2A2A2A] bg-[#111111] p-4">
                      <p className="mb-2 text-sm text-[#A0A0A0]">Average Order Value</p>
                      <p className="text-2xl font-bold text-white">
                        {formatPrice(
                          Number.isFinite(orderAnalytics?.averageOrderValue)
                            ? orderAnalytics!.averageOrderValue!
                            : orderAnalytics && orderAnalytics.totalOrders > 0
                              ? orderAnalytics.totalRevenue / orderAnalytics.totalOrders
                              : 0
                        )}
                      </p>
                    </div>
                  </div>
                  {/* Line Chart */}
                  <div
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: '#111111',
                      borderRadius: 12,
                      height: 300,
                    }}
                  >
                    {isEmptyChart ? (
                      <div className="flex h-full flex-col items-center justify-center gap-2">
                        <div
                          className="h-12 w-full max-w-md"
                          style={{
                            borderTop: '2px dashed #2A2A2A',
                          }}
                        />
                        <p className="text-center text-sm text-[#A0A0A0]">
                          Data will appear after your first order
                        </p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                          <XAxis
                            dataKey="date"
                            stroke="#6b7280"
                            tick={{ fill: '#6b7280', fontSize: 11 }}
                            axisLine={{ stroke: '#2A2A2A' }}
                          />
                          <YAxis
                            stroke="#6b7280"
                            tick={{ fill: '#6b7280', fontSize: 11 }}
                            axisLine={{ stroke: '#2A2A2A' }}
                            tickFormatter={(v) =>
                              new Intl.NumberFormat('en-NG', {
                                style: 'currency',
                                currency: 'NGN',
                                notation: 'compact',
                                maximumFractionDigits: 0,
                              }).format(v)
                            }
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1A1A1A',
                              border: '1px solid #2A2A2A',
                              borderRadius: 8,
                              color: '#fff',
                            }}
                            formatter={(value: number) =>
                              new Intl.NumberFormat('en-NG', {
                                style: 'currency',
                                currency: 'NGN',
                                maximumFractionDigits: 0,
                              }).format(value)
                            }
                            labelFormatter={(_, payload) =>
                              payload?.[0]?.payload?.fullDate
                                ? new Date(payload[0].payload.fullDate).toLocaleDateString()
                                : ''
                            }
                          />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#FF6B00"
                            strokeWidth={2}
                            dot={{ fill: '#FF6B00', strokeWidth: 0 }}
                            activeDot={{ r: 4, fill: '#FF6B00' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  {orderAnalytics && orderAnalytics.topProducts.length > 0 && (
                    <div className="mt-6">
                      <h4 className="mb-3 font-semibold text-white">Top Products</h4>
                      <div className="space-y-2">
                        {orderAnalytics.topProducts.slice(0, 5).map((product, i) => (
                          <div
                            key={product.productId ?? i}
                            className="flex items-center justify-between rounded-lg bg-[#111111] p-3"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 font-bold text-[#FF6B00]">{i + 1}.</span>
                              <span className="text-[#ffcc99]">
                                {product.productTitle ?? product.title ?? 'Unknown Product'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-white">{product.sales} sales</span>
                              <span className="font-semibold text-white">{formatPrice(product.revenue)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Customer Insights Section */}
              <section className="mb-8">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
                  <Users className="h-5 w-5 text-[#FF6B00]" />
                  Customer Insights
                </h2>
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] p-4">
                      <p className="mb-2 text-sm text-[#A0A0A0]">Total Customers</p>
                      <p className="text-2xl font-bold text-white">{customerInsights?.totalCustomers ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] p-4">
                      <p className="mb-2 text-sm text-[#A0A0A0]">Repeat Customers</p>
                      <p className="text-2xl font-bold text-white">{customerInsights?.repeatCustomers ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] p-4">
                      <p className="mb-2 text-sm text-[#A0A0A0]">New Customers</p>
                      <p className="text-2xl font-bold text-white">{customerInsights?.newCustomers ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] p-4">
                      <p className="mb-2 text-sm text-[#A0A0A0]">Retention Rate</p>
                      <p className="text-2xl font-bold text-white">
                        {(customerInsights?.customerRetentionRate ?? 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex flex-col items-center justify-center rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-6"
                    style={{ minHeight: 240 }}
                  >
                    {donutData[0].name === 'No data' ? (
                      <>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie
                              data={donutData}
                              dataKey="value"
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={70}
                              fill="#2A2A2A"
                              paddingAngle={2}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <p className="text-sm text-[#A0A0A0]">No customer data yet</p>
                      </>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie
                              data={donutData}
                              dataKey="value"
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={70}
                              paddingAngle={2}
                            >
                              {donutData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                            <Legend />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#1A1A1A',
                                border: '1px solid #2A2A2A',
                                borderRadius: 8,
                                color: '#fff',
                              }}
                              formatter={(value: number, name: string) => [value, name]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <p className="mt-2 text-sm text-[#A0A0A0]">New vs Repeat</p>
                      </>
                    )}
                  </div>
                </div>
              </section>

              {/* Commission Breakdown Section */}
              <section className="mb-8">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
                  <DollarSign className="h-5 w-5 text-[#FF6B00]" />
                  Commission Breakdown
                </h2>
                <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2A2A2A] pb-4">
                      <span className="text-[#A0A0A0]">Gross Revenue</span>
                      <span className="font-semibold text-white">
                        {formatPrice(commissionBreakdown?.totalGross ?? 0)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2A2A2A] pb-4">
                      <span className="flex items-center gap-2 text-[#A0A0A0]">
                        Platform Commission (
                        <span className="text-white">
                          {(commissionBreakdown?.commissionRate ?? 0).toFixed(1)}%
                        </span>
                        )
                        <span
                          className="cursor-help text-[#6b7280]"
                          title="Commission rate varies by category (8–15%)"
                        >
                          <HelpCircle className="h-4 w-4" />
                        </span>
                      </span>
                      <span className="font-semibold text-red-400">
                        -{formatPrice(commissionBreakdown?.totalCommission ?? 0)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      <span className="text-[#A0A0A0]">Your Net Earnings</span>
                      <span
                        className="text-xl font-bold text-green-500"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        {formatPrice(commissionBreakdown?.totalNet ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Product Performance - keep if data exists */}
              {productAnalytics.length > 0 && (
                <section className="mb-8">
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
                    <Package className="h-5 w-5 text-[#FF6B00]" />
                    Product Performance
                  </h2>
                  <div className="overflow-x-auto rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#2A2A2A]">
                          <th className="p-3 text-left text-white">Product</th>
                          <th className="p-3 text-left text-white">Sales</th>
                          <th className="p-3 text-left text-white">Revenue</th>
                          <th className="p-3 text-left text-white">Rating</th>
                          <th className="p-3 text-left text-white">Reviews</th>
                          <th className="p-3 text-left text-white">Conversion</th>
                          <th className="p-3 text-left text-white">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productAnalytics.map((product) => (
                          <tr key={product.productId} className="border-b border-[#2A2A2A]/50">
                            <td className="p-3">
                              <Link
                                href={`/seller/products/${product.productId}`}
                                className="font-medium text-[#FF6B00] hover:text-[#E65100]"
                              >
                                {product.productTitle}
                              </Link>
                            </td>
                            <td className="p-3 text-[#ffcc99]">{product.totalSales}</td>
                            <td className="p-3 font-semibold text-white">{formatPrice(product.totalRevenue)}</td>
                            <td className="p-3 text-[#ffcc99]">{product.averageRating.toFixed(1)}</td>
                            <td className="p-3 text-[#ffcc99]">{product.reviewCount}</td>
                            <td className="p-3 text-[#ffcc99]">{product.conversionRate.toFixed(2)}%</td>
                            <td className="p-3 text-[#ffcc99]">{product.currentStock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Empty State Checklist */}
              {allZeros && (
                <section className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-6">
                  <h3 className="mb-4 font-semibold text-white">
                    Get your first analytics data:
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      {identityVerified ? (
                        <Check className="h-5 w-5 shrink-0 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 shrink-0 text-[#A0A0A0]" />
                      )}
                      <span className={identityVerified ? 'text-white' : 'text-[#A0A0A0]'}>
                        Identity verified
                      </span>
                      {!identityVerified && (
                        <Link
                          href="/seller/settings?tab=kyc"
                          className="text-sm text-[#FF6B00] hover:underline"
                        >
                          Verify now
                        </Link>
                      )}
                    </li>
                    <li className="flex items-center gap-3">
                      {hasProduct ? (
                        <Check className="h-5 w-5 shrink-0 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 shrink-0 text-[#A0A0A0]" />
                      )}
                      <span className={hasProduct ? 'text-white' : 'text-[#A0A0A0]'}>
                        Add at least 1 product
                      </span>
                      {!hasProduct && (
                        <Link
                          href="/seller/products/new"
                          className="text-sm text-[#FF6B00] hover:underline"
                        >
                          Add product
                        </Link>
                      )}
                    </li>
                    <li className="flex items-center gap-3">
                      <Circle className="h-5 w-5 shrink-0 text-[#A0A0A0]" />
                      <span className="text-[#A0A0A0]">Share your store link</span>
                      <Link href="/seller" className="text-sm text-[#FF6B00] hover:underline">
                        Get link
                      </Link>
                    </li>
                    <li className="flex items-center gap-3">
                      {hasOrder ? (
                        <Check className="h-5 w-5 shrink-0 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 shrink-0 text-[#A0A0A0]" />
                      )}
                      <span className={hasOrder ? 'text-white' : 'text-[#A0A0A0]'}>
                        Receive your first order
                      </span>
                    </li>
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      </SellerLayout>
    </>
  );
}
