import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import apiClient from '../../lib/api/client';
import {
  Package,
  Truck,
  Search,
  Eye,
  RotateCcw,
  Loader2,
  ChevronDown,
  ShieldCheck,
  ShoppingBag,
  FileText,
} from 'lucide-react';
import { showErrorToast, showSuccessToast } from '../../lib/ui/toast';
import { formatDate, formatNgnFromKobo } from '../../lib/api/utils';
import { useConfirmation } from '../../lib/hooks/useConfirmation';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    title: string;
    images: string[];
    seller?: {
      id: string;
      businessName: string;
      isVerified?: boolean;
    };
  };
}

interface Delivery {
  id: string;
  status: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  amount: number;
  status: string;
  paymentRef?: string;
  delivery?: Delivery;
  createdAt: string;
  updatedAt: string;
}

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

const STATUS_STYLES: Record<string, string> = {
  PROCESSING: 'bg-amber-500/20 text-amber-400 border-amber-400/30',
  SHIPPED: 'bg-blue-500/20 text-blue-400 border-blue-400/30',
  DELIVERED: 'bg-green-500/20 text-green-400 border-green-400/30',
  CANCELLED: 'bg-red-500/20 text-red-400 border-red-400/30',
  PENDING_PAYMENT: 'bg-amber-500/20 text-amber-400 border-amber-400/30',
  PAID: 'bg-blue-500/20 text-blue-400 border-blue-400/30',
};

const ITEMS_PER_PAGE = 6;

function formatPrice(priceInKobo: number) {
  return formatNgnFromKobo(priceInKobo, { maximumFractionDigits: 0 });
}

function filterByDateRange(orders: Order[], range: string): Order[] {
  if (range === 'all') return orders;
  const now = new Date();
  let cutoff = new Date();
  if (range === '7d') cutoff.setDate(now.getDate() - 7);
  else if (range === '30d') cutoff.setDate(now.getDate() - 30);
  else if (range === '90d') cutoff.setDate(now.getDate() - 90);
  return orders.filter((o) => new Date(o.createdAt) >= cutoff);
}

export default function OrdersPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [showCount, setShowCount] = useState(ITEMS_PER_PAGE);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const confirmation = useConfirmation();

  const handleCancelOrder = async (orderId: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Cancel Order',
      message: 'Are you sure you want to cancel this order?',
      confirmText: 'Cancel Order',
      cancelText: 'Keep Order',
      variant: 'warning',
    });
    if (!confirmed) return;
    try {
      setCancellingOrder(orderId);
      confirmation.setLoading(true);
      await apiClient.put(`/orders/${orderId}/cancel`);
      showSuccessToast('Order cancelled successfully');
      fetchOrders();
    } catch (err: any) {
      showErrorToast(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingOrder(null);
      confirmation.setLoading(false);
    }
  };

  const canCancelOrder = (status: string) =>
    ['PENDING_PAYMENT', 'PAID', 'PROCESSING'].includes(status);

  useEffect(() => {
    setMounted(true);
    if (!tokenManager.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    const user = userManager.getUser();
    if (!user || (user.role && user.role !== 'BUYER' && user.role !== 'ADMIN')) {
      router.push('/');
      return;
    }
    fetchOrders();
  }, [router]);

  useEffect(() => {
    if (!mounted || !router.isReady) return;
    const paymentStatus = router.query.payment as string;
    const message = router.query.message as string;
    if (paymentStatus === 'success') {
      showSuccessToast('Payment successful! Your order is being processed.');
      router.replace('/buyer/orders', undefined, { shallow: true });
    } else if (paymentStatus === 'failed') {
      showErrorToast('Payment failed. Please try again or contact support.');
      router.replace('/buyer/orders', undefined, { shallow: true });
    } else if (paymentStatus === 'error') {
      showErrorToast(message || 'Payment verification failed. Please contact support.');
      router.replace('/buyer/orders', undefined, { shallow: true });
    }
  }, [mounted, router.isReady, router.query.payment, router.query.message]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/orders');
      const responseData = response.data.data || response.data;
      if (responseData?.orders && Array.isArray(responseData.orders)) {
        setOrders(responseData.orders);
      } else if (Array.isArray(responseData)) {
        setOrders(responseData);
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const displayOrders = orders;
  const isActuallyEmpty = orders.length === 0;

  useEffect(() => {
    setShowCount(ITEMS_PER_PAGE);
  }, [searchQuery, statusFilter, dateRange]);

  const filteredOrders = filterByDateRange(
    displayOrders.filter((order) => {
      const matchesSearch =
        !searchQuery.trim() ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some((item) =>
          item.product.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    }),
    dateRange
  );

  const paginatedOrders = filteredOrders.slice(0, showCount);
  const hasMore = filteredOrders.length > showCount;

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>My Orders - Buyer | Carryofy</title>
        <meta name="description" content="Track and manage all your orders" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <BuyerLayout>
        <div className="font-inter">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-white text-2xl sm:text-3xl font-bold mb-1">My Orders</h1>
            <p className="text-[#ffcc99]/80 text-sm sm:text-base">Track and manage all your orders</p>
          </div>

          {/* Top bar: Search, Status tabs, Date range */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ffcc99]/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by order ID or product name"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-[#2a2a2a] rounded-lg text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:border-[#FF6B00]/50 text-sm"
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                  className="flex items-center gap-2 w-full sm:w-auto px-4 py-2.5 bg-[#111111] border border-[#2a2a2a] rounded-lg text-white text-sm hover:border-[#FF6B00]/40 transition-colors"
                >
                  {DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label ?? 'All time'}
                  <ChevronDown className="w-4 h-4 text-[#ffcc99]/60" />
                </button>
                {dateDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setDateDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-20 w-48 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl">
                      {DATE_RANGE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setDateRange(opt.value);
                            setDateDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-[#FF6B00]/10 ${
                            dateRange === opt.value ? 'text-[#FF6B00] font-medium' : 'text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Status tabs */}
            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === tab.value
                      ? 'bg-[#FF6B00] text-black'
                      : 'bg-[#111111] border border-[#2a2a2a] text-[#ffcc99] hover:border-[#FF6B00]/40'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-[#FF6B00] animate-spin mb-4" />
              <p className="text-[#ffcc99]/70">Loading your orders...</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-6 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchOrders}
                className="px-6 py-2.5 bg-[#FF6B00] text-black font-semibold rounded-lg hover:bg-[#ff8533] transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Content */}
          {!loading && !error && (
            <>
              {isActuallyEmpty ? (
                /* EMPTY STATE */
                <div className="flex flex-col items-center justify-center py-16 sm:py-24 px-4">
                  <div className="rounded-2xl bg-[#111111] border border-[#2a2a2a] p-12 sm:p-16 max-w-md w-full text-center">
                    <div className="w-20 h-20 rounded-full bg-[#FF6B00]/10 flex items-center justify-center mx-auto mb-6">
                      <Package className="w-10 h-10 text-[#FF6B00]" />
                    </div>
                    <h2 className="text-white text-xl sm:text-2xl font-bold mb-3">No orders yet</h2>
                    <p className="text-[#ffcc99]/70 text-sm sm:text-base mb-8">
                      Your orders will appear here once you make a purchase
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link
                        href="/buyer/products"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#FF6B00] text-black font-semibold rounded-lg hover:bg-[#ff8533] transition"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Browse Products
                      </Link>
                      <Link
                        href="/buyer/bulk-order"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-transparent border border-[#FF6B00]/60 text-[#FF6B00] font-semibold rounded-lg hover:bg-[#FF6B00]/10 transition"
                      >
                        <FileText className="w-4 h-4" />
                        Request a Quote
                      </Link>
                    </div>
                  </div>
                </div>
              ) : filteredOrders.length === 0 ? (
                /* No results from filters */
                <div className="rounded-xl bg-[#111111] border border-[#2a2a2a] p-12 text-center">
                  <Package className="w-14 h-14 text-[#FF6B00]/50 mx-auto mb-4" />
                  <h2 className="text-white font-bold mb-2">No orders found</h2>
                  <p className="text-[#ffcc99]/70 text-sm mb-4">Try adjusting your search or filters.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setDateRange('all');
                    }}
                    className="text-[#FF6B00] text-sm font-medium hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                /* POPULATED STATE - Card list */
                <>
                  <div className="space-y-4">
                    {paginatedOrders.map((order) => {
                      const primaryItem = order.items[0];
                      const productName =
                        order.items.length > 1
                          ? `${primaryItem.product.title} +${order.items.length - 1} more`
                          : primaryItem.product.title;
                      const imageUrl =
                        primaryItem.product.images?.[0] ||
                        'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                      const sellerName = primaryItem.product.seller?.businessName ?? 'Seller';
                      const isVerified = primaryItem.product.seller?.isVerified ?? true;
                      const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);

                      return (
                        <div
                          key={order.id}
                          className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6 rounded-xl bg-[#111111] border border-[#2a2a2a] hover:border-[#FF6B00]/30 transition-colors"
                        >
                          {/* Left: Thumbnail */}
                          <div className="w-full sm:w-24 h-32 sm:h-24 rounded-lg overflow-hidden bg-[#1a1a1a] shrink-0">
                            <Image
                              src={imageUrl}
                              alt={productName}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Center */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[#ffcc99]/60 text-xs mb-1">Order {order.id}</p>
                            <p className="text-white font-bold text-base mb-1 line-clamp-2">{productName}</p>
                            <p className="text-[#ffcc99]/80 text-sm flex items-center gap-1.5 mb-2">
                              {sellerName}
                              {isVerified && (
                                <span className="inline-flex items-center gap-0.5 text-green-400 text-xs">
                                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                                </span>
                              )}
                            </p>
                            <p className="text-[#ffcc99]/60 text-xs">
                              {formatDate(order.createdAt)} · Qty: {totalQty}
                            </p>
                          </div>

                          {/* Right */}
                          <div className="flex flex-col sm:items-end gap-3 shrink-0">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium border ${
                                STATUS_STYLES[order.status] ?? 'bg-gray-500/20 text-gray-400 border-gray-400/30'
                              }`}
                            >
                              {order.status.replace(/_/g, ' ')}
                            </span>
                            <p className="text-[#FF6B00] font-bold text-lg">{formatPrice(order.amount)}</p>
                            <div className="flex flex-wrap gap-2">
                              <Link
                                href={`/buyer/orders/${order.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[#FF6B00] text-sm font-medium border border-[#FF6B00]/50 rounded-lg hover:bg-[#FF6B00]/10 transition"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </Link>
                              {(order.status === 'SHIPPED' || order.status === 'PROCESSING') && (
                                <Link
                                  href={`/buyer/track?orderId=${order.id}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6B00] text-black text-sm font-semibold rounded-lg hover:bg-[#ff8533] transition"
                                >
                                  <Truck className="w-4 h-4" />
                                  Track
                                </Link>
                              )}
                              <Link
                                href={`/buyer/products/${primaryItem.product.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[#ffcc99] text-sm font-medium border border-[#2a2a2a] rounded-lg hover:border-[#FF6B00]/40 transition"
                              >
                                <RotateCcw className="w-4 h-4" />
                                Reorder
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Load More / Pagination */}
                  {hasMore && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={() => setShowCount((c) => c + ITEMS_PER_PAGE)}
                        className="px-8 py-3 bg-[#111111] border border-[#2a2a2a] text-white font-medium rounded-lg hover:border-[#FF6B00]/50 hover:text-[#FF6B00] transition"
                      >
                        Load More
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </BuyerLayout>
      <ConfirmationDialog
        open={confirmation.open}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        variant={confirmation.variant}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
        loading={confirmation.loading}
      />
    </>
  );
}
