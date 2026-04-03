import Head from 'next/head';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import SellerLayout from '../../../../components/seller/SellerLayout';
import { useAuth } from '../../../../lib/auth';
import apiClient from '../../../../lib/api/client';
import { ArrowLeft, Package, MapPin, CreditCard, Calendar, Loader2 } from 'lucide-react';
import { formatNgnFromKobo, formatDateTime } from '../../../../lib/api/utils';
import toast from 'react-hot-toast';

interface OrderItem {
  id: string;
  productId: string;
  price: number;
  quantity: number;
  product?: {
    id: string;
    title: string;
    images: string[];
  };
}

interface Delivery {
  id: string;
  status: string;
  address: string;
  rider?: string;
  eta?: string;
  createdAt: string;
  updatedAt: string;
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
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export default function OrderDetailPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { id } = router.query;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [markingReady, setMarkingReady] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!id || typeof id !== 'string') return;
    setLoading(true);
    setLoadError(null);
    try {
      const response = await apiClient.get(`/orders/${id}`);
      const orderData = (response.data as { data?: Order }).data ?? (response.data as Order);
      setOrder(orderData);
    } catch (error: unknown) {
      const msg =
        typeof error === 'object' && error !== null && 'response' in error
          ? String((error as { response?: { data?: { message?: string } } }).response?.data?.message)
          : null;
      setLoadError(msg || 'Could not load order. Please try again.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

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

    if (id) {
      fetchOrder();
    }
  }, [router, id, authLoading, isAuthenticated, user, fetchOrder]);

  const handleReadyForPickup = async () => {
    if (!id || typeof id !== 'string' || !order) return;
    setMarkingReady(true);
    try {
      const res = await apiClient.put(`/seller/orders/${id}/ready-for-pickup`);
      const updated = (res.data as { data?: Order }).data ?? (res.data as Order);
      setOrder(updated);
      toast.success('Marked as ready for pickup');
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e !== null && 'response' in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message)
          : 'Could not update order';
      toast.error(msg);
    } finally {
      setMarkingReady(false);
    }
  };

  const formatPrice = (priceInKobo: number) => formatNgnFromKobo(priceInKobo);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'PAID':
      case 'PROCESSING':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'OUT_FOR_DELIVERY':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'DELIVERED':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'CANCELED':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return 'Pending Payment';
      case 'PAID':
        return 'Payment Confirmed';
      case 'PROCESSING':
        return 'Packaging';
      case 'OUT_FOR_DELIVERY':
        return 'Out for Delivery';
      case 'DELIVERED':
        return 'Delivered';
      case 'CANCELED':
        return 'Canceled';
      default:
        return status;
    }
  };

  /** Prisma DeliveryStatus */
  const DELIVERY_STATUS_LABELS: Record<string, string> = {
    AWAITING_ASSIGNMENT: 'Awaiting pickup',
    ASSIGNED: 'Rider assigned',
    PICKED_UP: 'Picked up by rider',
    IN_TRANSIT: 'On the way',
    DELIVERED: 'Delivered',
    FAILED_DELIVERY: 'Delivery failed',
    RETURNING: 'Returning',
    CANCELED: 'Canceled',
    ISSUE: 'Issue reported',
  };

  const getDeliveryStatusDisplay = (status: string) =>
    DELIVERY_STATUS_LABELS[status] || status.replace(/_/g, ' ');

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'IN_TRANSIT':
      case 'PICKED_UP':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'FAILED_DELIVERY':
      case 'ISSUE':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'CANCELED':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    }
  };

  // Show loading state while auth is initializing
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

  // Don't render until auth check is complete
  if (!isAuthenticated || !user) {
    return null;
  }

  if (loading) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#ffcc99]">Loading order...</p>
          </div>
        </div>
      </SellerLayout>
    );
  }

  if (loadError || !order) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center min-h-[400px] px-4">
          <div className="text-center max-w-md">
            <p className="text-white text-xl mb-2">{loadError ? 'Something went wrong' : 'Order not found'}</p>
            <p className="text-[#ffcc99]/80 text-sm mb-6">
              {loadError || 'This order may have been removed or you may not have access.'}
            </p>
            <button
              type="button"
              onClick={() => fetchOrder()}
              className="inline-flex items-center justify-center px-6 py-2.5 bg-[#ff6600] text-black font-semibold rounded-lg hover:bg-[#cc5200] transition mb-4 mr-4"
            >
              Try again
            </button>
            <Link
              href="/seller/orders"
              className="inline-block text-[#ff6600] hover:text-[#cc5200] transition"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </SellerLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Order #{order.id.slice(0, 8)} - Seller Portal | Carryofy</title>
        <meta
          name="description"
          content="View order details on Carryofy."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SellerLayout>
        <div>
          {/* Header */}
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <div className="flex items-center gap-4">
              <Link
                href="/seller/orders"
                className="p-2 hover:bg-[#1a1a1a] rounded-lg transition"
              >
                <ArrowLeft className="w-6 h-6 text-[#ffcc99]" />
              </Link>
              <div>
                <p className="text-white tracking-light text-[32px] font-bold leading-tight">
                  Order #{order.id.slice(0, 8)}
                </p>
                <p className="text-[#ffcc99] text-sm font-normal leading-normal mt-1">
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className={`px-4 py-2 rounded-xl border ${getStatusColor(order.status)}`}>
                <span className="font-medium">{getStatusDisplay(order.status)}</span>
              </div>
              {(order.status === 'PAID' || order.status === 'PROCESSING') && user?.role === 'SELLER' && (
                <button
                  type="button"
                  disabled={markingReady}
                  onClick={handleReadyForPickup}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff6600] text-black font-semibold hover:bg-[#ff8533] disabled:opacity-50"
                >
                  {markingReady ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Mark as Ready for Pickup
                </button>
              )}
            </div>
          </div>

          <div className="px-4 py-3">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Order Items */}
              <div className="lg:col-span-2">
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Package className="w-5 h-5 text-[#ff6600]" />
                    <h2 className="text-white text-xl font-bold">Order Items</h2>
                  </div>

                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-black rounded-xl border border-[#ff6600]/20">
                        <div
                          className="w-16 h-16 bg-center bg-cover rounded-lg flex-shrink-0"
                          style={{
                            backgroundImage: item.product?.images?.[0]
                              ? `url(${item.product.images[0]})`
                              : 'none',
                            backgroundColor: '#333',
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-white font-medium">{item.product?.title || 'Product'}</p>
                          <p className="text-[#ffcc99] text-sm">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{formatPrice(item.price)}</p>
                          <p className="text-[#ffcc99] text-sm">each</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-[#ff6600]/30">
                    <div className="flex justify-between items-center">
                      <span className="text-white text-lg font-bold">Total Amount</span>
                      <span className="text-[#ff6600] text-2xl font-bold">{formatPrice(order.amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                {order.delivery && (
                  <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 mt-6">
                    <div className="flex items-center gap-2 mb-6">
                      <MapPin className="w-5 h-5 text-[#ff6600]" />
                      <h2 className="text-white text-xl font-bold">Delivery Information</h2>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-[#ffcc99] text-sm mb-1">Status</p>
                        <div className={`inline-block px-3 py-1 rounded-lg border ${getDeliveryStatusColor(order.delivery.status)}`}>
                          <span className="text-sm font-medium">{getDeliveryStatusDisplay(order.delivery.status)}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[#ffcc99] text-sm mb-1">Delivery Address</p>
                        <p className="text-white">{order.delivery.address}</p>
                      </div>
                      {order.delivery.rider && (
                        <div>
                          <p className="text-[#ffcc99] text-sm mb-1">Rider</p>
                          <p className="text-white">{order.delivery.rider}</p>
                        </div>
                      )}
                      {order.delivery.eta && (
                        <div>
                          <p className="text-[#ffcc99] text-sm mb-1">Estimated Delivery</p>
                          <p className="text-white">{formatDateTime(order.delivery.eta)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Payment Information */}
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <CreditCard className="w-5 h-5 text-[#ff6600]" />
                    <h2 className="text-white text-xl font-bold">Payment</h2>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-[#ffcc99] text-sm mb-1">Payment Status</p>
                      <div className={`inline-block px-3 py-1 rounded-lg border ${getStatusColor(order.status)}`}>
                        <span className="text-sm font-medium">{getStatusDisplay(order.status)}</span>
                      </div>
                    </div>
                    {order.paymentRef && (
                      <div>
                        <p className="text-[#ffcc99] text-sm mb-1">Payment Reference</p>
                        <p className="text-white text-sm font-mono break-all">{order.paymentRef}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Calendar className="w-5 h-5 text-[#ff6600]" />
                    <h2 className="text-white text-xl font-bold">Timeline</h2>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-[#ffcc99] text-sm mb-1">Created</p>
                      <p className="text-white text-sm">{formatDateTime(order.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-[#ffcc99] text-sm mb-1">Last Updated</p>
                      <p className="text-white text-sm">{formatDateTime(order.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SellerLayout>
    </>
  );
}

