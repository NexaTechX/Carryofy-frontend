import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import apiClient from '../../lib/api/client';
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Calendar,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { showErrorToast, showSuccessToast } from '../../lib/ui/toast';

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

export default function OrdersPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Check authentication
    if (!tokenManager.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    const user = userManager.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role && user.role !== 'BUYER' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    // Fetch orders
    fetchOrders();
  }, [router]);

  // Handle payment redirect status
  useEffect(() => {
    if (!mounted || !router.isReady) return;

    const paymentStatus = router.query.payment as string;
    const message = router.query.message as string;

    if (paymentStatus === 'success') {
      showSuccessToast('Payment successful! Your order is being processed.');
      // Remove query params from URL
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
      
      // Handle API response wrapping - support both paginated and array responses
      const responseData = response.data.data || response.data;
      // Handle paginated response: { orders: [...], pagination: {...} } or direct array
      if (responseData && typeof responseData === 'object' && 'orders' in responseData && Array.isArray(responseData.orders)) {
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

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      setCancellingOrder(orderId);
      await apiClient.put(`/orders/${orderId}/cancel`);
      
      // Refresh orders
      fetchOrders();
    } catch (err: any) {
      console.error('Error cancelling order:', err);
      alert(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingOrder(null);
    }
  };

  const formatPrice = (priceInKobo: number) => {
    return `₦${(priceInKobo / 100).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { label: string; color: string; icon: any } } = {
      PENDING_PAYMENT: {
        label: 'Pending Payment',
        color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
        icon: Clock,
      },
      PAID: {
        label: 'Paid',
        color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        icon: CreditCard,
      },
      PROCESSING: {
        label: 'Processing',
        color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        icon: Package,
      },
      SHIPPED: {
        label: 'Shipped',
        color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
        icon: Truck,
      },
      DELIVERED: {
        label: 'Delivered',
        color: 'bg-green-500/10 text-green-400 border-green-500/30',
        icon: CheckCircle2,
      },
      CANCELLED: {
        label: 'Cancelled',
        color: 'bg-red-500/10 text-red-400 border-red-500/30',
        icon: XCircle,
      },
      REFUNDED: {
        label: 'Refunded',
        color: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
        icon: AlertCircle,
      },
    };

    const config = statusConfig[status] || {
      label: status,
      color: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
      icon: Package,
    };

    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const canCancelOrder = (status: string) => {
    return ['PENDING_PAYMENT', 'PAID', 'PROCESSING'].includes(status);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((item) => item.product.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>My Orders - Buyer | Carryofy</title>
        <meta name="description" content="View all your orders on Carryofy" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <BuyerLayout>
        <div>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <Package className="w-8 h-8 text-[#ff6600]" />
              My Orders
            </h1>
            <p className="text-[#ffcc99] text-lg">
              Track and manage all your orders in one place.
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ffcc99]/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders by ID or product name..."
                className="w-full pl-12 pr-4 py-3 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600]"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ffcc99]/50" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-12 pr-10 py-3 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white focus:outline-none focus:border-[#ff6600] appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="PENDING_PAYMENT">Pending Payment</option>
                <option value="PAID">Paid</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-16">
              <Loader2 className="w-12 h-12 text-[#ff6600] mx-auto animate-spin mb-4" />
              <p className="text-[#ffcc99]">Loading your orders...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchOrders}
                className="px-6 py-2 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Orders List */}
          {!loading && !error && (
            <>
              {filteredOrders.length === 0 ? (
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-2xl p-12 text-center">
                  <Package className="w-16 h-16 text-[#ffcc99] mx-auto mb-4" />
                  <h2 className="text-white text-2xl font-bold mb-2">
                    {orders.length === 0 ? 'No Orders Yet' : 'No Orders Found'}
                  </h2>
                  <p className="text-[#ffcc99] mb-6">
                    {orders.length === 0
                      ? "You haven't placed any orders yet. Start shopping to see your orders here!"
                      : 'Try adjusting your search or filter criteria.'}
                  </p>
                  {orders.length === 0 && (
                    <Link
                      href="/buyer/products"
                      className="inline-flex items-center gap-2 px-8 py-4 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition"
                    >
                      <Package className="w-5 h-5" />
                      Browse Products
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 hover:border-[#ff6600] transition"
                    >
                      {/* Order Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#ff6600]/30">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="text-white text-lg font-bold">Order #{order.id.slice(0, 8)}</h3>
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-[#ffcc99]">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(order.createdAt)}</span>
                            </div>
                            {order.paymentRef && (
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                <span>Ref: {order.paymentRef.slice(0, 12)}...</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {canCancelOrder(order.status) && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={cancellingOrder === order.id}
                              className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                            >
                              {cancellingOrder === order.id ? 'Cancelling...' : 'Cancel Order'}
                            </button>
                          )}
                          <Link
                            href={`/buyer/orders/${order.id}`}
                            className="flex items-center gap-2 px-4 py-2 bg-[#ff6600]/10 border border-[#ff6600]/30 text-[#ff6600] rounded-lg hover:bg-[#ff6600]/20 hover:border-[#ff6600] transition text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </Link>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="space-y-4 mb-6">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex gap-4 items-start">
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-black flex-shrink-0">
                              {item.product.images && item.product.images.length > 0 ? (
                                <img
                                  src={item.product.images[0]}
                                  alt={item.product.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#ffcc99]">
                                  <Package className="w-8 h-8" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/buyer/products/${item.product.id}`}
                                className="text-white font-bold hover:text-[#ff6600] transition block mb-1"
                              >
                                {item.product.title}
                              </Link>
                              {item.product.seller && (
                                <p className="text-[#ffcc99] text-sm mb-2">
                                  Seller: {item.product.seller.businessName}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-[#ffcc99]">Quantity: {item.quantity}</span>
                                <span className="text-[#ff6600] font-bold">
                                  {formatPrice(item.price * item.quantity)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Order Footer */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 border-t border-[#ff6600]/30">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div>
                            <p className="text-[#ffcc99] text-sm mb-1">Total Amount</p>
                            <p className="text-[#ff6600] text-2xl font-bold">{formatPrice(order.amount)}</p>
                          </div>
                          {order.delivery && (
                            <div>
                              <p className="text-[#ffcc99] text-sm mb-1">Delivery Status</p>
                              <p className="text-white font-medium">{order.delivery.status}</p>
                              {order.delivery.trackingNumber && (
                                <p className="text-[#ffcc99] text-xs mt-1">
                                  Tracking: {order.delivery.trackingNumber}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {order.delivery && order.delivery.status !== 'DELIVERED' && (
                            <Link
                              href={`/buyer/track?orderId=${order.id}`}
                              className="flex items-center gap-2 px-4 py-2 bg-[#ff6600] text-black rounded-lg hover:bg-[#cc5200] transition text-sm font-bold"
                            >
                              <Truck className="w-4 h-4" />
                              Track Order
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </BuyerLayout>
    </>
  );
}

