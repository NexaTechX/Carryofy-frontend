import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import SellerLayout from '../../../components/seller/SellerLayout';
import { useAuth, tokenManager } from '../../../lib/auth';
import { Download, TrendingUp, Users, Package, DollarSign, BarChart3, Calendar } from 'lucide-react';

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
  averageOrderValue: number;
  topProducts: Array<{
    productId: string;
    productTitle: string;
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

const NGN = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [productAnalytics, setProductAnalytics] = useState<ProductAnalytics[]>([]);
  const [customerInsights, setCustomerInsights] = useState<CustomerInsights | null>(null);
  const [orderAnalytics, setOrderAnalytics] = useState<OrderAnalytics | null>(null);
  const [commissionBreakdown, setCommissionBreakdown] = useState<CommissionBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
  }, [router, authLoading, isAuthenticated, user, startDate, endDate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = tokenManager.getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      // Fetch all analytics in parallel
      const [productRes, customerRes, orderRes, commissionRes] = await Promise.allSettled([
        fetch(`${apiUrl}/reports/products/analytics?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/reports/customers/insights`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/orders/analytics?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/reports/commission/breakdown?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // Process product analytics
      if (productRes.status === 'fulfilled' && productRes.value.ok) {
        const result = await productRes.value.json();
        const data = result.data || result;
        setProductAnalytics(Array.isArray(data?.products) ? data.products : []);
      }

      // Process customer insights
      if (customerRes.status === 'fulfilled' && customerRes.value.ok) {
        const result = await customerRes.value.json();
        const data = result.data || result;
        setCustomerInsights(data);
      }

      // Process order analytics
      if (orderRes.status === 'fulfilled' && orderRes.value.ok) {
        const result = await orderRes.value.json();
        const data = result.data || result;
        setOrderAnalytics(data);
      }

      // Process commission breakdown
      if (commissionRes.status === 'fulfilled' && commissionRes.value.ok) {
        const result = await commissionRes.value.json();
        const data = result.data || result;
        setCommissionBreakdown(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceInKobo: number) => {
    return NGN.format(priceInKobo / 100);
  };

  const exportProductAnalytics = () => {
    if (productAnalytics.length === 0) return;
    downloadCsv('product-analytics.csv', [
      ['Product', 'Status', 'Total Sales', 'Total Revenue', 'Average Rating', 'Reviews', 'Conversion Rate', 'Current Stock'],
      ...productAnalytics.map((product) => [
        product.productTitle,
        product.status,
        String(product.totalSales),
        formatPrice(product.totalRevenue),
        product.averageRating.toFixed(1),
        String(product.reviewCount),
        `${product.conversionRate.toFixed(2)}%`,
        String(product.currentStock),
      ]),
    ]);
  };

  const exportCustomerInsights = () => {
    if (!customerInsights) return;
    downloadCsv('customer-insights.csv', [
      ['Metric', 'Value'],
      ['Total Customers', String(customerInsights.totalCustomers)],
      ['Repeat Customers', String(customerInsights.repeatCustomers)],
      ['New Customers', String(customerInsights.newCustomers)],
      ['Retention Rate', `${(customerInsights.customerRetentionRate ?? 0).toFixed(1)}%`],
      ['', ''],
      ['Top Customers', ''],
      ['Customer Name', 'Orders', 'Total Spent'],
      ...customerInsights.topCustomers.map((customer) => [
        customer.userName,
        String(customer.orderCount),
        formatPrice(customer.totalSpent),
      ]),
    ]);
  };

  const exportOrderAnalytics = () => {
    if (!orderAnalytics) return;
    downloadCsv('order-analytics.csv', [
      ['Metric', 'Value'],
      ['Total Orders', String(orderAnalytics.totalOrders)],
      ['Total Revenue', formatPrice(orderAnalytics.totalRevenue)],
      ['Average Order Value', formatPrice(orderAnalytics.averageOrderValue)],
      ['', ''],
      ['Top Products', ''],
      ['Product', 'Sales', 'Revenue'],
      ...orderAnalytics.topProducts.map((product) => [
        product.productTitle,
        String(product.sales),
        formatPrice(product.revenue),
      ]),
    ]);
  };

  const exportCommissionBreakdown = () => {
    if (!commissionBreakdown) return;
    downloadCsv('commission-breakdown.csv', [
      ['Period', 'Gross', 'Commission', 'Net'],
      ...(commissionBreakdown.breakdown || []).map((item) => [
        item.period,
        formatPrice(item.gross),
        formatPrice(item.commission),
        formatPrice(item.net),
      ]),
      ['', ''],
      ['Total', formatPrice(commissionBreakdown.totalGross), formatPrice(commissionBreakdown.totalCommission), formatPrice(commissionBreakdown.totalNet)],
      ['Commission Rate', `${(commissionBreakdown.commissionRate ?? 0).toFixed(2)}%`],
    ]);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#ffcc99]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Analytics - Seller Portal | Carryofy</title>
        <meta name="description" content="View comprehensive analytics and reports for your business on Carryofy." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SellerLayout>
        <div>
          {/* Title Section */}
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <p className="text-white tracking-light text-[32px] font-bold leading-tight min-w-72">
              Analytics & Reports
            </p>
          </div>

          {/* Date Range Filter */}
          <div className="px-4 py-3">
            <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-[#ff6600]" />
                <h3 className="text-white font-semibold">Date Range</h3>
              </div>
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[#ffcc99] text-sm mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl text-sm bg-[#0d0d0d] border border-[#ff6600]/30 text-white focus:outline-none focus:border-[#ff6600]"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[#ffcc99] text-sm mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl text-sm bg-[#0d0d0d] border border-[#ff6600]/30 text-white focus:outline-none focus:border-[#ff6600]"
                  />
                </div>
                {(startDate || endDate) && (
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setStartDate('');
                        setEndDate('');
                      }}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-[#0d0d0d] border border-[#ff6600]/30 text-[#ffcc99] hover:bg-[#ff6600]/10"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="px-4 py-8 text-center">
              <div className="w-12 h-12 border-4 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#ffcc99]">Loading analytics...</p>
            </div>
          ) : (
            <>
              {/* Order Analytics Summary */}
              {orderAnalytics && (
                <div className="px-4 py-3">
                  <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white text-xl font-bold flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-[#ff6600]" />
                        Order Analytics
                      </h3>
                      <button
                        onClick={exportOrderAnalytics}
                        className="flex items-center gap-2 px-4 py-2 bg-[#ff6600] text-black rounded-xl text-sm font-medium hover:bg-[#cc5200] transition"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="bg-[#0d0d0d] rounded-xl p-4">
                        <p className="text-[#ffcc99] text-sm mb-2">Total Orders</p>
                        <p className="text-white text-2xl font-bold">{orderAnalytics.totalOrders}</p>
                      </div>
                      <div className="bg-[#0d0d0d] rounded-xl p-4">
                        <p className="text-[#ffcc99] text-sm mb-2">Total Revenue</p>
                        <p className="text-white text-2xl font-bold">{formatPrice(orderAnalytics.totalRevenue)}</p>
                      </div>
                      <div className="bg-[#0d0d0d] rounded-xl p-4">
                        <p className="text-[#ffcc99] text-sm mb-2">Average Order Value</p>
                        <p className="text-white text-2xl font-bold">{formatPrice(orderAnalytics.averageOrderValue)}</p>
                      </div>
                    </div>
                    {orderAnalytics.topProducts.length > 0 && (
                      <div>
                        <h4 className="text-white font-semibold mb-3">Top Products</h4>
                        <div className="space-y-2">
                          {orderAnalytics.topProducts.slice(0, 5).map((product, index) => (
                            <div
                              key={product.productId}
                              className="flex items-center justify-between p-3 bg-[#0d0d0d] rounded-xl"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-[#ff6600] font-bold w-6">{index + 1}.</span>
                                <span className="text-[#ffcc99]">{product.productTitle}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-white text-sm">{product.sales} sales</span>
                                <span className="text-white font-semibold">{formatPrice(product.revenue)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Customer Insights */}
              {customerInsights && (
                <div className="px-4 py-3">
                  <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white text-xl font-bold flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#ff6600]" />
                        Customer Insights
                      </h3>
                      <button
                        onClick={exportCustomerInsights}
                        className="flex items-center gap-2 px-4 py-2 bg-[#ff6600] text-black rounded-xl text-sm font-medium hover:bg-[#cc5200] transition"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                      <div className="bg-[#0d0d0d] rounded-xl p-4">
                        <p className="text-[#ffcc99] text-sm mb-2">Total Customers</p>
                        <p className="text-white text-2xl font-bold">{customerInsights.totalCustomers}</p>
                      </div>
                      <div className="bg-[#0d0d0d] rounded-xl p-4">
                        <p className="text-[#ffcc99] text-sm mb-2">Repeat Customers</p>
                        <p className="text-white text-2xl font-bold">{customerInsights.repeatCustomers}</p>
                      </div>
                      <div className="bg-[#0d0d0d] rounded-xl p-4">
                        <p className="text-[#ffcc99] text-sm mb-2">New Customers</p>
                        <p className="text-white text-2xl font-bold">{customerInsights.newCustomers}</p>
                      </div>
                      <div className="bg-[#0d0d0d] rounded-xl p-4">
                        <p className="text-[#ffcc99] text-sm mb-2">Retention Rate</p>
                        <p className="text-white text-2xl font-bold">{(customerInsights.customerRetentionRate ?? 0).toFixed(1)}%</p>
                      </div>
                    </div>
                    {customerInsights.topCustomers && customerInsights.topCustomers.length > 0 && (
                      <div>
                        <h4 className="text-white font-semibold mb-3">Top Customers</h4>
                        <div className="space-y-2">
                          {customerInsights.topCustomers.slice(0, 5).map((customer, index) => (
                            <div
                              key={customer.userId}
                              className="flex items-center justify-between p-3 bg-[#0d0d0d] rounded-xl"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-[#ff6600] font-bold w-6">{index + 1}.</span>
                                <span className="text-[#ffcc99]">{customer.userName}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-white text-sm">{customer.orderCount} orders</span>
                                <span className="text-white font-semibold">{formatPrice(customer.totalSpent)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Product Analytics */}
              {productAnalytics.length > 0 && (
                <div className="px-4 py-3">
                  <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white text-xl font-bold flex items-center gap-2">
                        <Package className="w-5 h-5 text-[#ff6600]" />
                        Product Performance
                      </h3>
                      <button
                        onClick={exportProductAnalytics}
                        className="flex items-center gap-2 px-4 py-2 bg-[#ff6600] text-black rounded-xl text-sm font-medium hover:bg-[#cc5200] transition"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#ff6600]/30">
                            <th className="text-left text-white p-3">Product</th>
                            <th className="text-left text-white p-3">Sales</th>
                            <th className="text-left text-white p-3">Revenue</th>
                            <th className="text-left text-white p-3">Rating</th>
                            <th className="text-left text-white p-3">Reviews</th>
                            <th className="text-left text-white p-3">Conversion</th>
                            <th className="text-left text-white p-3">Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productAnalytics.map((product) => (
                            <tr key={product.productId} className="border-b border-[#ff6600]/10">
                              <td className="p-3">
                                <Link
                                  href={`/seller/products/${product.productId}`}
                                  className="text-[#ff6600] hover:text-[#cc5200] font-medium"
                                >
                                  {product.productTitle}
                                </Link>
                              </td>
                              <td className="p-3 text-[#ffcc99]">{product.totalSales}</td>
                              <td className="p-3 text-white font-semibold">{formatPrice(product.totalRevenue)}</td>
                              <td className="p-3 text-[#ffcc99]">{product.averageRating.toFixed(1)}</td>
                              <td className="p-3 text-[#ffcc99]">{product.reviewCount}</td>
                              <td className="p-3 text-[#ffcc99]">{product.conversionRate.toFixed(2)}%</td>
                              <td className="p-3 text-[#ffcc99]">{product.currentStock}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Commission Breakdown */}
              {commissionBreakdown && (
                <div className="px-4 py-3">
                  <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white text-xl font-bold flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-[#ff6600]" />
                        Commission Breakdown
                      </h3>
                      <button
                        onClick={exportCommissionBreakdown}
                        className="flex items-center gap-2 px-4 py-2 bg-[#ff6600] text-black rounded-xl text-sm font-medium hover:bg-[#cc5200] transition"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                      <div className="bg-[#0d0d0d] rounded-xl p-4">
                        <p className="text-[#ffcc99] text-sm mb-2">Total Gross</p>
                        <p className="text-white text-2xl font-bold">{formatPrice(commissionBreakdown.totalGross)}</p>
                      </div>
                      <div className="bg-[#0d0d0d] rounded-xl p-4">
                        <p className="text-[#ffcc99] text-sm mb-2">Total Commission</p>
                        <p className="text-white text-2xl font-bold">{formatPrice(commissionBreakdown.totalCommission)}</p>
                      </div>
                      <div className="bg-[#0d0d0d] rounded-xl p-4">
                        <p className="text-[#ffcc99] text-sm mb-2">Total Net</p>
                        <p className="text-white text-2xl font-bold">{formatPrice(commissionBreakdown.totalNet)}</p>
                      </div>
                      <div className="bg-[#0d0d0d] rounded-xl p-4">
                        <p className="text-[#ffcc99] text-sm mb-2">Commission Rate</p>
                        <p className="text-white text-2xl font-bold">{(commissionBreakdown.commissionRate ?? 0).toFixed(2)}%</p>
                      </div>
                    </div>
                    {commissionBreakdown.breakdown && commissionBreakdown.breakdown.length > 0 && (
                      <div>
                        <h4 className="text-white font-semibold mb-3">Period Breakdown</h4>
                        <div className="space-y-2">
                          {commissionBreakdown.breakdown.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-[#0d0d0d] rounded-xl"
                            >
                              <span className="text-[#ffcc99]">{item.period}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-white text-sm">Gross: {formatPrice(item.gross)}</span>
                                <span className="text-white text-sm">Commission: {formatPrice(item.commission)}</span>
                                <span className="text-white font-semibold">Net: {formatPrice(item.net)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SellerLayout>
    </>
  );
}

