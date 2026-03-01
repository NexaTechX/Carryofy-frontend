import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Search,
  Building2,
  ShoppingBag,
  Copy,
  ChevronRight,
  Download,
} from 'lucide-react';
import SellerLayout from '../../../components/seller/SellerLayout';
import { useAuth, tokenManager } from '../../../lib/auth';
import {
  formatNgnFromKobo,
  getApiUrl,
  copyToClipboard,
  formatDateWithTime,
} from '../../../lib/api/utils';
import toast from 'react-hot-toast';

interface OrderItem {
  id: string;
  productId: string;
  price: number;
  quantity: number;
  product?: {
    id: string;
    title: string;
    seller?: {
      id: string;
      businessName: string;
    };
  };
}

interface Delivery {
  id: string;
  status: string;
  rider?: string;
  eta?: string;
}

interface Order {
  id: string;
  userId: string;
  orderType?: string;
  quoteId?: string;
  items: OrderItem[];
  amount: number;
  status: string;
  paymentRef?: string;
  delivery?: Delivery;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

/** Status category for filtering/counting */
type StatusKey = 'all' | 'pending' | 'out_for_delivery' | 'delivered' | 'cancelled';

function getStatusKey(order: Order): StatusKey {
  if (order.status === 'CANCELED') return 'cancelled';
  if (order.status === 'DELIVERED') return 'delivered';
  if (order.delivery?.status === 'DELIVERED') return 'delivered';
  if (order.status === 'OUT_FOR_DELIVERY') return 'out_for_delivery';
  if (
    order.delivery?.status === 'PICKED_UP' ||
    order.delivery?.status === 'IN_TRANSIT'
  )
    return 'out_for_delivery';
  if (
    order.status === 'PENDING_PAYMENT' ||
    order.status === 'PAID' ||
    order.status === 'PROCESSING'
  )
    return 'pending';
  if (
    order.delivery?.status === 'PREPARING' ||
    order.delivery?.status === 'PICKED_UP' ||
    order.delivery?.status === 'IN_TRANSIT'
  ) {
    if (order.delivery.status === 'PREPARING') return 'pending';
    return 'out_for_delivery';
  }
  return 'pending';
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusKey>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [orderIdHovered, setOrderIdHovered] = useState<string | null>(null);

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
    fetchOrders();
  }, [router, authLoading, isAuthenticated, user, orderTypeFilter]);

  const fetchOrders = async () => {
    try {
      const token = tokenManager.getAccessToken();
      const params = new URLSearchParams();
      if (orderTypeFilter === 'B2B' || orderTypeFilter === 'CONSUMER') {
        params.set('orderType', orderTypeFilter);
      }
      const query = params.toString();
      const url = query ? getApiUrl(`/orders?${query}`) : getApiUrl('/orders');

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        const responseData = result.data || result;
        if (responseData.orders && Array.isArray(responseData.orders)) {
          setOrders(responseData.orders);
        } else if (Array.isArray(responseData)) {
          setOrders(responseData);
        } else {
          setOrders([]);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceInKobo: number) => formatNgnFromKobo(priceInKobo);

  const getStatusDisplay = (order: Order) => {
    if (order.delivery) {
      const s = order.delivery.status;
      if (s === 'PREPARING') return 'In Warehouse';
      if (s === 'PICKED_UP' || s === 'IN_TRANSIT') return 'Out for Delivery';
      if (s === 'DELIVERED') return 'Delivered';
      if (s === 'ISSUE') return 'Issue';
    }
    switch (order.status) {
      case 'PENDING_PAYMENT':
        return 'Pending';
      case 'PAID':
        return 'Payment Confirmed';
      case 'PROCESSING':
        return 'Packaging';
      case 'OUT_FOR_DELIVERY':
        return 'Out for Delivery';
      case 'DELIVERED':
        return 'Delivered';
      case 'CANCELED':
        return 'Cancelled';
      default:
        return order.status;
    }
  };

  const getStatusColor = (order: Order) => {
    const key = getStatusKey(order);
    switch (key) {
      case 'pending':
        return { bg: 'bg-[#B8860B]/20', border: 'border-[#B8860B]/50', dot: 'bg-[#B8860B]', text: 'text-[#E6B800]' };
      case 'out_for_delivery':
        return { bg: 'bg-[#2563EB]/20', border: 'border-[#2563EB]/50', dot: 'bg-[#3B82F6]', text: 'text-[#60A5FA]' };
      case 'delivered':
        return { bg: 'bg-[#16A34A]/20', border: 'border-[#16A34A]/50', dot: 'bg-[#22C55E]', text: 'text-[#4ADE80]' };
      case 'cancelled':
        return { bg: 'bg-[#DC2626]/20', border: 'border-[#DC2626]/50', dot: 'bg-[#EF4444]', text: 'text-[#F87171]' };
      default:
        return { bg: 'bg-[#1A1A1A]', border: 'border-[#FF6B00]/30', dot: 'bg-[#A0A0A0]', text: 'text-white' };
    }
  };

  const isB2B = (order: Order) => order.orderType === 'B2B' || !!order.quoteId;

  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    return orders.filter((order) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          order.id.toLowerCase().includes(q) ||
          order.status.toLowerCase().includes(q) ||
          getStatusDisplay(order).toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (dateFrom || dateTo) {
        const d = new Date(order.createdAt).getTime();
        if (dateFrom && d < new Date(dateFrom).setHours(0, 0, 0, 0))
          return false;
        if (dateTo && d > new Date(dateTo).setHours(23, 59, 59, 999))
          return false;
      }
      if (statusFilter && statusFilter !== 'all') {
        if (getStatusKey(order) !== statusFilter) return false;
      }
      return true;
    });
  }, [orders, searchQuery, statusFilter, dateFrom, dateTo]);

  // Counts for badges (based on fetched orders before search/date filters for type, before status for status)
  const typeCounts = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    const consumer = list.filter((o) => o.orderType === 'CONSUMER').length;
    const b2b = list.filter((o) => isB2B(o)).length;
    return { all: list.length, consumer, b2b };
  }, [orders]);

  const statusCounts = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    const counts: Record<StatusKey, number> = {
      all: list.length,
      pending: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
    };
    list.forEach((o) => {
      const k = getStatusKey(o);
      if (k !== 'all' && counts[k] !== undefined) counts[k]++;
    });
    return counts;
  }, [orders]);

  const handleCopyOrderId = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await copyToClipboard(id);
    toast.success(ok ? 'Order ID copied' : 'Copy failed');
  };

  const handleExportCsv = () => {
    const headers = ['Order ID', 'Date', 'Amount', 'Status', 'Type'];
    const rows = filteredOrders.map((o) => [
      o.id,
      formatDateWithTime(o.createdAt),
      formatPrice(o.amount),
      getStatusDisplay(o),
      isB2B(o) ? 'B2B' : 'Consumer',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported CSV');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FF6B00]/30 border-t-[#FF6B00] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#ffcc99]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  const statusFilters: { value: StatusKey; label: string; dotColor: string }[] = [
    { value: 'all', label: 'All Orders', dotColor: '' },
    { value: 'pending', label: 'Pending', dotColor: 'bg-[#B8860B]' },
    { value: 'out_for_delivery', label: 'Out for Delivery', dotColor: 'bg-[#3B82F6]' },
    { value: 'delivered', label: 'Delivered', dotColor: 'bg-[#22C55E]' },
    { value: 'cancelled', label: 'Cancelled', dotColor: 'bg-[#EF4444]' },
  ];

  const isEmpty = !loading && filteredOrders.length === 0;
  const isSearchOrFilter = !!(searchQuery || dateFrom || dateTo || statusFilter !== 'all');

  return (
    <>
      <Head>
        <title>Orders - Seller Portal | Carryofy</title>
        <meta name="description" content="View and manage your orders on Carryofy." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SellerLayout>
        <div>
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <p className="text-white tracking-light text-[32px] font-bold leading-tight min-w-72">
              Orders
            </p>
          </div>

          {/* Type filter - segmented control */}
          <div className="px-4 py-2">
            <div
              className="inline-flex rounded-lg p-1 bg-[#1A1A1A] gap-0"
              role="tablist"
            >
              {[
                { value: 'all', label: 'All', count: typeCounts.all },
                { value: 'CONSUMER', label: 'Consumer', count: typeCounts.consumer },
                { value: 'B2B', label: 'B2B/Bulk', count: typeCounts.b2b, icon: true },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setOrderTypeFilter(f.value)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${orderTypeFilter === f.value
                      ? 'bg-[#FF6B00] text-white'
                      : 'text-[#A0A0A0] hover:text-white'
                    }`}
                >
                  {f.icon && <Building2 className="w-4 h-4 shrink-0" />}
                  <span>{f.label} ({f.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Status filter pills with count badges and dots */}
          <div className="px-4 py-3">
            <div className="flex gap-2 flex-wrap items-center">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${statusFilter === filter.value
                      ? 'bg-[#FF6B00] text-white'
                      : 'bg-[#1A1A1A] border border-[#FF6B00]/30 text-[#ffcc99] hover:bg-[#FF6B00]/10'
                    }`}
                >
                  {filter.dotColor && (
                    <span className={`w-2 h-2 rounded-full shrink-0 ${filter.dotColor}`} />
                  )}
                  {filter.label} ({statusCounts[filter.value]})
                </button>
              ))}
            </div>
          </div>

          {/* Search bar + date range + Export */}
          <div className="px-4 py-3">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex flex-1 min-w-[200px] max-w-xl items-stretch rounded-xl h-12 bg-[#1A1A1A] border border-[#FF6B00]/20 overflow-hidden">
                <div className="text-[#ffcc99] flex items-center justify-center pl-4">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Search orders"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 min-w-0 bg-transparent text-white placeholder:text-[#A0A0A0] px-3 py-2 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-[#1A1A1A] border border-[#FF6B00]/20 text-white text-sm focus:outline-none focus:border-[#FF6B00]/50"
                />
                <span className="text-[#A0A0A0] text-sm">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-[#1A1A1A] border border-[#FF6B00]/20 text-white text-sm focus:outline-none focus:border-[#FF6B00]/50"
                />
              </div>
              <button
                onClick={handleExportCsv}
                className="h-10 px-4 rounded-lg border border-[#FF6B00]/50 text-[#FF6B00] text-sm font-medium hover:bg-[#FF6B00]/10 transition-colors inline-flex items-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="px-4 py-3">
            <div className="overflow-hidden rounded-xl border border-[#FF6B00]/30 bg-black">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#1A1A1A]">
                    <th className="px-4 py-3 text-left text-white text-sm font-medium w-[180px]">
                      Order ID
                    </th>
                    <th className="px-4 py-3 text-left text-white text-sm font-medium w-[160px]">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-white text-sm font-medium w-[120px]">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-white text-sm font-medium w-[140px]">
                      Status
                    </th>
                    <th className="px-4 py-3 w-[120px]" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-white">
                        Loading...
                      </td>
                    </tr>
                  ) : isEmpty ? (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <div className="flex flex-col items-center justify-center py-16 px-4">
                          <div className="w-12 h-12 rounded-full bg-[#FF6B00]/20 flex items-center justify-center mb-4">
                            <ShoppingBag className="w-12 h-12 text-[#FF6B00]" />
                          </div>
                          <h3 className="text-white text-xl font-bold mb-2">
                            {isSearchOrFilter ? 'No orders found' : 'No orders yet'}
                          </h3>
                          <p className="text-[#A0A0A0] text-center max-w-sm mb-6">
                            {isSearchOrFilter
                              ? 'Try adjusting your search or filters.'
                              : "When buyers place orders for your products, they'll appear here."}
                          </p>
                          {!isSearchOrFilter && (
                            <div className="flex gap-3">
                              <Link
                                href="/seller/products"
                                className="px-4 py-2 rounded-lg border border-[#FF6B00]/50 text-[#FF6B00] text-sm font-medium hover:bg-[#FF6B00]/10 transition-colors"
                              >
                                View your products
                              </Link>
                              <Link
                                href="/seller"
                                className="px-4 py-2 rounded-lg bg-[#FF6B00] text-white text-sm font-medium hover:bg-[#E65100] transition-colors"
                              >
                                Share your store
                              </Link>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const statusStyle = getStatusColor(order);
                      const isHovered = hoveredRowId === order.id;
                      const showCopy = orderIdHovered === order.id;
                      return (
                        <tr
                          key={order.id}
                          onMouseEnter={() => setHoveredRowId(order.id)}
                          onMouseLeave={() => {
                            setHoveredRowId(null);
                            setOrderIdHovered(null);
                          }}
                          className={`border-t border-[#FF6B00]/20 transition-colors cursor-pointer ${isHovered ? 'bg-[#1E1E1E]' : 'bg-[#1A1A1A] hover:bg-[#1E1E1E]'
                            }`}
                          onClick={() => router.push(`/seller/orders/${order.id}`)}
                        >
                          <td className="h-[72px] px-4 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="flex items-center gap-2 min-w-0 group"
                                onMouseEnter={() => setOrderIdHovered(order.id)}
                                onMouseLeave={() => setOrderIdHovered(null)}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span
                                  className="text-[#A0A0A0] font-dm-mono text-[13px] truncate max-w-[100px]"
                                  style={{ fontFamily: "'DM Mono', monospace" }}
                                >
                                  #{order.id.slice(0, 8)}
                                </span>
                                {showCopy && (
                                  <button
                                    onClick={(e) => handleCopyOrderId(e, order.id)}
                                    className="p-1 rounded hover:bg-white/10 text-[#A0A0A0] hover:text-white shrink-0"
                                    aria-label="Copy order ID"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              {isB2B(order) && (
                                <span className="px-2 py-0.5 rounded bg-[#FF6B00]/25 text-[#FF6B00] text-[10px] font-medium shrink-0">
                                  B2B
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="h-[72px] px-4 py-2 text-[#A0A0A0] text-sm">
                            {formatDateWithTime(order.createdAt)}
                          </td>
                          <td className="h-[72px] px-4 py-2 text-[#A0A0A0] text-sm">
                            Order #{order.id.slice(0, 8)}
                          </td>
                          <td className="h-[72px] px-4 py-2 text-right">
                            <span
                              className="text-white font-bold font-dm-mono"
                              style={{ fontFamily: "'DM Mono', monospace" }}
                            >
                              {formatPrice(order.amount)}
                            </span>
                          </td>
                          <td className="h-[72px] px-4 py-2">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                              {getStatusDisplay(order)}
                            </span>
                          </td>
                          <td className="h-[72px] px-4 py-2 text-right">
                            <Link
                              href={`/seller/orders/${order.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className={`inline-flex items-center gap-1 text-sm text-[#FF6B00] transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'
                                } hover:text-[#E65100]`}
                            >
                              View details <ChevronRight className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </SellerLayout>
    </>
  );
}
