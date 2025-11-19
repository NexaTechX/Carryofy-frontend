import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import apiClient from '../../lib/api/client';
import {
  Truck,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  ArrowLeft,
  MapPin,
  Phone,
  Calendar,
  Loader2,
  AlertCircle,
  Navigation,
  Gift,
} from 'lucide-react';

const TrackMap = dynamic(() => import('../../components/buyer/TrackMap'), {
  ssr: false,
});

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    title: string;
    images: string[];
  };
}

interface Order {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  delivery?: {
    id: string;
    status: string;
    trackingNumber?: string;
    eta?: string;
  };
  items: OrderItem[];
}

interface Delivery {
  id: string;
  orderId: string;
  status: string;
  trackingNumber?: string;
  rider?: string;
  eta?: string;
  createdAt: string;
  updatedAt: string;
}

const ORDER_STEPS = [
  {
    key: 'ORDER_PLACED',
    label: 'Order Placed',
    description: 'We received your order details.',
  },
    {
    key: 'PAYMENT_CONFIRMED',
    label: 'Payment Confirmed',
    description: 'Payment has been verified successfully.',
  },
  {
    key: 'PROCESSING',
    label: 'Order Processing',
    description: 'Your order is being prepared by the seller.',
  },
  {
    key: 'SHIPPED',
    label: 'Out for Delivery',
    description: 'Package is on the way to your location.',
  },
  {
    key: 'DELIVERED',
    label: 'Delivered',
    description: 'Order delivered successfully.',
  },
];

export default function TrackOrderPage() {
  const router = useRouter();
  const { orderId: queryOrderId } = router.query;
  const [mounted, setMounted] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState('');
  const [vehicleIndex, setVehicleIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
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
  }, [router]);

  useEffect(() => {
    if (mounted && typeof queryOrderId === 'string') {
      setOrderCode(queryOrderId);
      fetchTracking(queryOrderId);
    }
  }, [mounted, queryOrderId]);

  const fetchTracking = async (orderId: string) => {
    if (!orderId) return;

    try {
      setLoading(true);
      setError(null);
      setOrder(null);
      setDelivery(null);

      const [orderResponse, deliveryResponse] = await Promise.allSettled([
        apiClient.get(`/orders/${orderId}`),
        apiClient.get(`/delivery/orders/${orderId}`),
      ]);

      if (orderResponse.status === 'fulfilled') {
        const orderData = orderResponse.value.data.data || orderResponse.value.data;
        setOrder(orderData);
      } else {
        throw orderResponse.reason;
      }

      if (deliveryResponse.status === 'fulfilled') {
        const deliveryData = deliveryResponse.value.data.data || deliveryResponse.value.data;
        setDelivery(deliveryData);
      }
    } catch (err: any) {
      console.error('Error fetching tracking:', err);
      setError(err.response?.data?.message || 'Unable to retrieve order tracking information.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderCode.trim()) {
      router.push({ pathname: '/buyer/track', query: { orderId: orderCode.trim() } }, undefined, { shallow: true });
      fetchTracking(orderCode.trim());
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
    return date.toLocaleString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const activeStepIndex = useMemo(() => {
    if (!order) return 0;
    const status = order.status;
    switch (status) {
      case 'PENDING_PAYMENT':
        return 0;
      case 'PAID':
        return 1;
      case 'PROCESSING':
        return 2;
      case 'SHIPPED':
        return 3;
      case 'DELIVERED':
        return 4;
      case 'CANCELLED':
      case 'REFUNDED':
        return 2;
      default:
        return 0;
    }
  }, [order]);

  const routeCoords = useMemo(() => {
    if (!order) {
      return [] as { lat: number; lng: number }[];
    }

    const warehouse = { lat: 6.5244, lng: 3.3792 };
    const hash = order.id
      .split('')
      .reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), 0);

    const latOffset = ((hash % 50) - 25) / 1000; // ~±0.025
    const lngOffset = ((((hash / 3) | 0) % 50) - 25) / 1000;
    const destination = {
      lat: warehouse.lat + latOffset,
      lng: warehouse.lng + lngOffset,
    };

    return [
      warehouse,
      {
        lat: warehouse.lat + (destination.lat - warehouse.lat) * 0.3,
        lng: warehouse.lng + (destination.lng - warehouse.lng) * 0.3,
      },
      {
        lat: warehouse.lat + (destination.lat - warehouse.lat) * 0.6,
        lng: warehouse.lng + (destination.lng - warehouse.lng) * 0.6,
      },
      destination,
    ];
  }, [order]);

  useEffect(() => {
    if (!routeCoords.length) {
      return;
    }

    if (order?.status === 'DELIVERED') {
      setVehicleIndex(routeCoords.length - 1);
      return;
    }

    setVehicleIndex((prev) => prev % routeCoords.length);

    const interval = window.setInterval(() => {
      setVehicleIndex((prev) => ((prev + 1) % routeCoords.length));
    }, 4000);

    return () => window.clearInterval(interval);
  }, [routeCoords, order?.status]);

  const currentCoord = routeCoords.length ? routeCoords[Math.min(vehicleIndex, routeCoords.length - 1)] : null;

  const getDeliveryStatusText = (status?: string) => {
    if (!status) return 'Awaiting assignment';
    const map: Record<string, string> = {
      PREPARING: 'Preparing Package',
      IN_TRANSIT: 'In Transit',
      DELIVERED: 'Delivered',
      CANCELLED: 'Delivery Cancelled',
      FAILED: 'Delivery Failed',
    };
    return map[status] || status;
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Track Order - Buyer | Carryofy</title>
        <meta name="description" content="Track your Carryofy order status" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <BuyerLayout>
        <div>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <Truck className="w-8 h-8 text-[#ff6600]" />
              Track Order
            </h1>
            <p className="text-[#ffcc99] text-lg">
              Enter your order ID to see real-time tracking updates and delivery progress.
            </p>
          </div>

          {/* Track Form */}
          <form onSubmit={handleTrackSubmit} className="mb-8 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ffcc99]/50" />
              <input
                type="text"
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                placeholder="Enter order ID (e.g. 06b43a97...)"
                className="w-full pl-12 pr-4 py-3 bg-black border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600]"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition flex items-center gap-2 justify-center"
            >
              Track Order
            </button>
          </form>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-16">
              <Loader2 className="w-12 h-12 text-[#ff6600] mx-auto animate-spin mb-4" />
              <p className="text-[#ffcc99]">Fetching tracking details...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => orderCode && fetchTracking(orderCode)}
                className="px-6 py-2 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition"
              >
                Try Again
              </button>
            </div>
          )}

              {/* Tracking Details */}
          {!loading && !error && order && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <p className="text-[#ffcc99] text-sm">Order ID</p>
                    <h2 className="text-white text-2xl font-bold mb-3">#{order.id}</h2>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#ffcc99]">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Placed {formatDate(order.createdAt)}
                      </span>
                      <span className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-2">
                        <Gift className="w-4 h-4" />
                        Total {formatPrice(order.amount)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href="/buyer/orders"
                      className="flex items-center gap-2 px-4 py-2 bg-[#ff6600]/10 border border-[#ff6600]/30 text-[#ff6600] rounded-lg hover:bg-[#ff6600]/20 hover:border-[#ff6600] transition text-sm font-medium"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Orders
                    </Link>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                <h3 className="text-white text-xl font-bold mb-6">Delivery Timeline</h3>
                <div className="relative">
                  <div className="absolute left-5 top-4 bottom-4 w-1 bg-[#ff6600]/30" aria-hidden />
                  <div className="space-y-6">
                    {ORDER_STEPS.map((step, index) => {
                      const isActive = index <= activeStepIndex;
                      const isLast = index === ORDER_STEPS.length - 1;
                      const StatusIcon = index < activeStepIndex
                        ? CheckCircle2
                        : index === activeStepIndex
                        ? Truck
                        : Clock;

                      const showCancelled = order.status === 'CANCELLED' || order.status === 'REFUNDED';

                      if (showCancelled && index > 2) {
                        return null;
                      }

                      return (
                        <div key={step.key} className="relative flex gap-6">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition ${
                                isActive ? 'bg-[#ff6600] border-[#ff6600] text-black' : 'bg-black border-[#ff6600]/30 text-[#ffcc99]/60'
                              }`}
                            >
                              <StatusIcon className="w-5 h-5" />
                            </div>
                            {!isLast && (
                              <div className="flex-1 w-px bg-[#ff6600]/30" aria-hidden />
                            )}
                          </div>
                          <div className="pb-6">
                            <h4 className={`text-lg font-bold ${isActive ? 'text-white' : 'text-[#ffcc99]'}`}>
                              {step.label}
                            </h4>
                            <p className="text-[#ffcc99]/80 text-sm leading-relaxed">{step.description}</p>
                            {index === activeStepIndex && delivery?.status && (
                              <p className="mt-2 text-[#ff6600] text-sm font-medium">
                                {getDeliveryStatusText(delivery.status)}
                                {delivery?.eta && ` • ETA ${formatDate(delivery.eta)}`}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {(order.status === 'CANCELLED' || order.status === 'REFUNDED') && (
                      <div className="relative flex gap-6">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 bg-red-500 border-red-500 text-white">
                            <XCircle className="w-5 h-5" />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white">
                            {order.status === 'CANCELLED' ? 'Order Cancelled' : 'Order Refunded'}
                          </h4>
                          <p className="text-[#ffcc99]/80 text-sm">
                            {order.status === 'CANCELLED'
                              ? 'This order was cancelled. If payment was made, it will be reversed shortly.'
                              : 'This order has been refunded. Please check your account for the refund.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Map */}
              {routeCoords.length > 0 && (
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white text-xl font-bold">Live Location</h3>
                    {delivery?.status && (
                      <span className="text-[#ffcc99] text-sm">
                        {getDeliveryStatusText(delivery.status)}
                      </span>
                    )}
                  </div>
                  <TrackMap routeCoords={routeCoords} currentCoord={currentCoord} />
                  <p className="text-[#ffcc99]/70 text-xs mt-3">
                    Location updates refresh automatically every few seconds.
                  </p>
                </div>
              )}

              {/* Delivery Details */}
              {(delivery || order.delivery) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                    <h3 className="text-white text-xl font-bold mb-4">Delivery Details</h3>
                    {delivery ? (
                      <div className="space-y-3 text-[#ffcc99] text-sm">
                        <p className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-[#ff6600]" />
                          Status: <span className="text-white font-medium">{getDeliveryStatusText(delivery.status)}</span>
                        </p>
                        {delivery.trackingNumber && (
                          <p className="flex items-center gap-2">
                            <Navigation className="w-4 h-4 text-[#ff6600]" />
                            Tracking Number: <span className="text-white">{delivery.trackingNumber}</span>
                          </p>
                        )}
                        {delivery.rider && (
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-[#ff6600]" />
                            Rider: <span className="text-white">{delivery.rider}</span>
                          </p>
                        )}
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#ff6600]" />
                          Updated: <span className="text-white">{formatDate(delivery.updatedAt)}</span>
                        </p>
                        {delivery.eta && (
                          <p className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#ff6600]" />
                            Estimated Arrival: <span className="text-white">{formatDate(delivery.eta)}</span>
                          </p>
                        )}
                      </div>
                    ) : order.delivery ? (
                      <div className="text-[#ffcc99]/80 text-sm">
                        <p>No live delivery updates yet. We'll notify you once your package is picked up.</p>
                      </div>
                    ) : (
                      <div className="text-[#ffcc99]/80 text-sm">
                        <p>Delivery has not been assigned for this order yet.</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                    <h3 className="text-white text-xl font-bold mb-4">Need Help?</h3>
                    <p className="text-[#ffcc99]/80 text-sm mb-4">
                      Have questions about this delivery? Contact our support team and we'll assist you right away.
                    </p>
                    <Link
                      href="/buyer/help"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition"
                    >
                      <MapPin className="w-4 h-4" />
                      Contact Support
                    </Link>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                <h3 className="text-white text-xl font-bold mb-4">Items in this Order</h3>
                <div className="space-y-4">
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
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-[#ffcc99]">Quantity: {item.quantity}</span>
                          <span className="text-[#ff6600] font-bold">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </BuyerLayout>
    </>
  );
}

