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
    order.delivery?.status === 'AWAITING_ASSIGNMENT' ||
    order.delivery?.status === 'ASSIGNED' ||
    order.delivery?.status === 'PICKED_UP' ||
    order.delivery?.status === 'IN_TRANSIT'
  ) {
    if (
      order.delivery.status === 'AWAITING_ASSIGNMENT' ||
      order.delivery.status === 'ASSIGNED'
    )
      return 'pending';
    return 'out_for_delivery';
  }
  return 'pending';
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
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
    setLoading(true);
    setListError(null);
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
      } else {
        let msg = 'Could not load orders. Please try again.';
        try {
          const errBody = await response.json();
          if (errBody?.message) msg = String(errBody.message);
        } catch {
          /* ignore */
        }
        setListError(msg);
        setOrders([]);
      }
    } catch {
      setListError('Could not load orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceInKobo: number) => formatNgnFromKobo(priceInKobo);

  const getStatusDisplay = (order: Order) => {
    if (order.delivery) {
      const s = order.delivery.status;
      if (s === 'AWAITING_ASSIGNMENT' || s === 'ASSIGNED') return 'Awaiting pickup / assigned';
      if (s === 'PICKED_UP' || s === 'IN_TRANSIT') return 'Out for Delivery';
      if (s === 'DELIVERED') return 'Delivered';
      if (s === 'ISSUE') return 'Issue';
      if (s === 'FAILED_DELIVERY') return 'Delivery failed';
      if (s === 'RETURNING') return 'Returning';
      if (s === 'CANCELED') return 'Delivery canceled';
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
          {listError && !loading && (
            <div className="mx-3 mt-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-3 text-sm text-red-300 sm:mx-4 sm:px-4">
              <span className="min-w-0">{listError}</span>
              <button
                type="button"
                onClick={() => fetchOrders()}
                className="btn-mobile shrink-0 rounded-lg bg-[#ff6600] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#ff8533] sm:py-2"
              >
                Retry
              </button>
            </div>
          )}
          <div className="flex flex-wrap justify-between gap-3 px-3 py-3 sm:p-4">
            <h1 className="min-w-0 text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-[32px]">
              Orders
            </h1>
          </div>

          {/* Type filter - segmented control */}
          <div className="px-3 py-2 sm:px-4">
            <div
              className="flex w-full max-w-full gap-1 overflow-x-auto rounded-xl bg-[#1A1A1A] p-1 scrollbar-hide sm:inline-flex sm:w-auto sm:rounded-lg"
              role="tablist"
            >
              {[
                { value: 'all', label: 'All', count: typeCounts.all },
                { value: 'CONSUMER', label: 'Consumer', count: typeCounts.consumer },
                { value: 'B2B', label: 'B2B/Bulk', count: typeCounts.b2b, icon: true },
              ].map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setOrderTypeFilter(f.value)}
                  className={`btn-mobile inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors sm:min-h-0 sm:rounded-md sm:px-4 ${orderTypeFilter === f.value
                      ? 'bg-[#FF6B00] text-white'
                      : 'text-[#A0A0A0] hover:text-white'
                    }`}
                >
                  {f.icon && <Building2 className="h-4 w-4 shrink-0" />}
                  <span>
                    {f.label} ({f.count})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Status filter pills with count badges and dots */}
          <div className="px-3 py-2 sm:px-4 sm:py-3">
            <div className="-mx-0.5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide sm:flex-wrap sm:overflow-visible sm:pb-0">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={`btn-mobile inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors sm:px-4 ${statusFilter === filter.value
                      ? 'border-transparent bg-[#FF6B00] text-white'
                      : 'border-[#FF6B00]/30 bg-[#1A1A1A] text-[#ffcc99] hover:bg-[#FF6B00]/10'
                    }`}
                >
                  {filter.dotColor && (
                    <span className={`h-2 w-2 shrink-0 rounded-full ${filter.dotColor}`} />
                  )}
                  {filter.label} ({statusCounts[filter.value]})
                </button>
              ))}
            </div>
          </div>

          {/* Search bar + date range + Export */}
          <div className="px-3 py-2 sm:px-4 sm:py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex min-h-[48px] w-full flex-1 items-stretch overflow-hidden rounded-xl border border-[#FF6B00]/20 bg-[#1A1A1A] sm:min-h-[48px] sm:max-w-xl">
                <div className="flex items-center justify-center pl-3 text-[#ffcc99] sm:pl-4">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  placeholder="Search by order ID or status"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="min-h-[48px] min-w-0 flex-1 bg-transparent px-3 py-2 text-base text-white placeholder:text-[#A0A0A0] focus:outline-none sm:text-sm"
                />
              </div>
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="min-h-[48px] min-w-0 flex-1 rounded-lg border border-[#FF6B00]/20 bg-[#1A1A1A] px-3 text-base text-white focus:border-[#FF6B00]/50 focus:outline-none sm:h-10 sm:min-h-0 sm:flex-none sm:text-sm"
                />
                <span className="shrink-0 px-0.5 text-sm text-[#A0A0A0]">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="min-h-[48px] min-w-0 flex-1 rounded-lg border border-[#FF6B00]/20 bg-[#1A1A1A] px-3 text-base text-white focus:border-[#FF6B00]/50 focus:outline-none sm:h-10 sm:min-h-0 sm:flex-none sm:text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleExportCsv}
                className="btn-mobile inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-[#FF6B00]/50 text-sm font-semibold text-[#FF6B00] transition-colors hover:bg-[#FF6B00]/10 sm:h-10 sm:w-auto sm:rounded-lg sm:px-4"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Mobile: order cards */}
          <div className="space-y-3 px-3 pb-4 sm:px-4 lg:hidden">
            {loading ? (
              <div className="rounded-xl border border-[#FF6B00]/30 bg-black px-4 py-10 text-center text-white">
                Loading orders…
              </div>
            ) : isEmpty ? (
              <div className="rounded-xl border border-[#FF6B00]/30 bg-black px-4 py-12">
                <div className="mx-auto flex max-w-sm flex-col items-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FF6B00]/20">
                    <ShoppingBag className="h-7 w-7 text-[#FF6B00]" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-white">
                    {isSearchOrFilter ? 'No orders found' : 'No orders yet'}
                  </h3>
                  <p className="mb-6 text-sm text-[#A0A0A0]">
                    {isSearchOrFilter
                      ? 'Try adjusting your search or filters.'
                      : "When buyers place orders for your products, they'll appear here."}
                  </p>
                  {!isSearchOrFilter && (
                    <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                      <Link
                        href="/seller/products"
                        className="btn-mobile inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[#FF6B00]/50 px-4 py-3 text-sm font-semibold text-[#FF6B00] hover:bg-[#FF6B00]/10"
                      >
                        View your products
                      </Link>
                      <Link
                        href="/seller"
                        className="btn-mobile inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#FF6B00] px-4 py-3 text-sm font-semibold text-black hover:bg-[#E65100]"
                      >
                        Share your store
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const statusStyle = getStatusColor(order);
                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => router.push(`/seller/orders/${order.id}`)}
                    className="btn-mobile w-full rounded-2xl border border-white/[0.08] bg-[#1A1A1A] p-4 text-left shadow-sm ring-1 ring-black/20 transition active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="truncate font-mono text-[13px] font-semibold text-white"
                            style={{ fontFamily: "'DM Mono', ui-monospace, monospace" }}
                            title={order.id}
                          >
                            #{order.id.slice(0, 8)}
                          </span>
                          {isB2B(order) && (
                            <span className="shrink-0 rounded-md bg-[#FF6B00]/25 px-2 py-0.5 text-[11px] font-semibold text-[#FF6B00]">
                              B2B
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-[#A0A0A0]">{formatDateWithTime(order.createdAt)}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span
                          className="font-mono text-lg font-bold text-white"
                          style={{ fontFamily: "'DM Mono', ui-monospace, monospace" }}
                        >
                          {formatPrice(order.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleCopyOrderId(e, order.id);
                          }}
                          className="btn-mobile rounded-lg p-2 text-[#A0A0A0] hover:bg-white/10 hover:text-white"
                          aria-label="Copy order ID"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
                      <span
                        className={`inline-flex max-w-[min(100%,14rem)] items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusStyle.dot}`} />
                        <span className="truncate">{getStatusDisplay(order)}</span>
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-[#FF6B00]">
                        Open
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Desktop: orders table */}
          <div className="hidden px-4 py-3 lg:block">
            <div className="overflow-hidden rounded-xl border border-[#FF6B00]/30 bg-black">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#1A1A1A]">
                    <th className="w-[180px] px-4 py-3 text-left text-sm font-medium text-white">
                      Order ID
                    </th>
                    <th className="w-[160px] px-4 py-3 text-left text-sm font-medium text-white">
                      Date
                    </th>
                    <th className="w-[120px] px-4 py-3 text-right text-sm font-medium text-white">
                      Amount
                    </th>
                    <th className="w-[140px] px-4 py-3 text-left text-sm font-medium text-white">
                      Status
                    </th>
                    <th className="w-[120px] px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-white">
                        Loading...
                      </td>
                    </tr>
                  ) : isEmpty ? (
                    <tr>
                      <td colSpan={5} className="p-0">
                        <div className="flex flex-col items-center justify-center px-4 py-16">
                          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF6B00]/20">
                            <ShoppingBag className="h-6 w-6 text-[#FF6B00]" />
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
                          className={`cursor-pointer border-t border-[#FF6B00]/20 transition-colors ${isHovered ? 'bg-[#1E1E1E]' : 'bg-[#1A1A1A] hover:bg-[#1E1E1E]'}`}
                          onClick={() => router.push(`/seller/orders/${order.id}`)}
                        >
                          <td className="h-[72px] px-4 py-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <div
                                className="group flex min-w-0 items-center gap-2"
                                onMouseEnter={() => setOrderIdHovered(order.id)}
                                onMouseLeave={() => setOrderIdHovered(null)}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span
                                  className="max-w-[140px] truncate font-mono text-[13px] text-[#A0A0A0]"
                                  style={{ fontFamily: "'DM Mono', monospace" }}
                                >
                                  #{order.id.slice(0, 8)}
                                </span>
                                {showCopy && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopyOrderId(e, order.id)}
                                    className="shrink-0 rounded p-1 text-[#A0A0A0] hover:bg-white/10 hover:text-white"
                                    aria-label="Copy order ID"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                              {isB2B(order) && (
                                <span className="shrink-0 rounded bg-[#FF6B00]/25 px-2 py-0.5 text-[10px] font-medium text-[#FF6B00]">
                                  B2B
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="h-[72px] px-4 py-2 text-sm text-[#A0A0A0]">
                            {formatDateWithTime(order.createdAt)}
                          </td>
                          <td className="h-[72px] px-4 py-2 text-right">
                            <span
                              className="font-mono font-bold text-white"
                              style={{ fontFamily: "'DM Mono', monospace" }}
                            >
                              {formatPrice(order.amount)}
                            </span>
                          </td>
                          <td className="h-[72px] px-4 py-2">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                              {getStatusDisplay(order)}
                            </span>
                          </td>
                          <td className="h-[72px] px-4 py-2 text-right">
                            <Link
                              href={`/seller/orders/${order.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className={`inline-flex items-center gap-1 text-sm text-[#FF6B00] hover:text-[#E65100] ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity`}
                            >
                              View details <ChevronRight className="h-4 w-4" />
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
