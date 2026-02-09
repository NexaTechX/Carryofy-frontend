import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';
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
  Share2,
  RefreshCw,
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
  updatedAt: string;
  delivery?: {
    id: string;
    status: string;
    trackingNumber?: string;
    eta?: string;
  };
  items: OrderItem[];
}

const DEFAULT_WAREHOUSE = { lat: 6.5244, lng: 3.3792 };

interface Delivery {
  id: string;
  orderId: string;
  status: string;
  trackingNumber?: string;
  rider?: {
    id: string;
    name: string;
    phone?: string;
    currentLat?: number | null;
    currentLng?: number | null;
    lastLocationUpdate?: string | null;
  } | null;
  eta?: string;
  deliveryAddress?: string;
  deliveryAddressInfo?: {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    country: string;
    postalCode?: string | null;
    fullAddress: string;
    latitude?: number;
    longitude?: number;
  } | null;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
  mapData?: {
    riderLocation?: { lat: number; lng: number; lastUpdate?: string | null } | null;
    deliveryLocation?: { lat?: number; lng?: number; address?: string; city?: string; state?: string } | null;
    pickupLocation?: { address?: string } | null;
  } | null;
}

const ORDER_STEPS = [
  {
    key: 'PENDING_PAYMENT',
    label: 'Order Placed',
    description: 'We received your order details and are preparing to confirm payment.',
  },
  {
    key: 'PAID',
    label: 'Payment Confirmed',
    description: 'Payment has been verified successfully.',
  },
  {
    key: 'PROCESSING',
    label: 'Packaging',
    description: 'We are currently packaging your goods for shipment.',
  },
  {
    key: 'OUT_FOR_DELIVERY',
    label: 'Out for Delivery',
    description: 'Package is on the way to your location.',
  },
  {
    key: 'DELIVERED',
    label: 'Delivered',
    description: 'Order delivered successfully.',
  },
];

interface BuyerOrder {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  items: Array<{
    id: string;
    product: {
      title: string;
    };
    quantity: number;
  }>;
}

export default function TrackOrderPage() {
  const router = useRouter();
  const { orderId: queryOrderId } = router.query;
  const [mounted, setMounted] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [buyerOrders, setBuyerOrders] = useState<BuyerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);


  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Socket connection for real-time rider updates
    if (tokenManager.isAuthenticated() && delivery?.rider?.id) {
      const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/location', {
        extraHeaders: {
          Authorization: `Bearer ${tokenManager.getAccessToken()}`,
        },
      });

      newSocket.on('connect', () => {
        console.log('Connected to location gateway');
        if (delivery.rider?.id) {
          newSocket.emit('subscribeToRider', { riderId: delivery.rider.id });
        }
      });

      newSocket.on('riderLocationUpdated', (data: { riderId: string; lat: number; lng: number }) => {
        if (data.riderId === delivery.rider?.id) {
          setDelivery((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              rider: {
                ...prev.rider!,
                currentLat: data.lat,
                currentLng: data.lng,
                lastLocationUpdate: new Date().toISOString(),
              },
              mapData: {
                ...prev.mapData,
                riderLocation: {
                  lat: data.lat,
                  lng: data.lng,
                  lastUpdate: new Date().toISOString(),
                }
              }
            };
          });
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [delivery?.rider?.id]);

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

    // Fetch buyer's orders for dropdown
    fetchBuyerOrders();
  }, [router]);

  const fetchBuyerOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await apiClient.get('/orders');

      // Handle API response wrapping - support both paginated and array responses
      const responseData = response.data.data || response.data;
      let orders: BuyerOrder[] = [];
      if (responseData && typeof responseData === 'object' && 'orders' in responseData && Array.isArray(responseData.orders)) {
        orders = responseData.orders;
      } else if (Array.isArray(responseData)) {
        orders = responseData;
      }
      // Only show orders that can still be tracked (exclude delivered)
      setBuyerOrders(orders.filter((o) => o.status !== 'DELIVERED'));
    } catch (err: any) {
      console.error('Error fetching buyer orders:', err);
      setBuyerOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (mounted && typeof queryOrderId === 'string') {
      setOrderCode(queryOrderId);
      fetchTracking(queryOrderId);
    }
  }, [mounted, queryOrderId]);

  const fetchTracking = async (orderId: string, opts?: { silent?: boolean }) => {
    if (!orderId) return;

    try {
      if (!opts?.silent) {
        setLoading(true);
        setError(null);
        setOrder(null);
        setDelivery(null);
      }
      setError(null);

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

      setLastUpdatedAt(new Date().toISOString());
    } catch (err: any) {
      console.error('Error fetching tracking:', err);
      if (!opts?.silent) {
        setError(err.response?.data?.message || 'Unable to retrieve order tracking information.');
      }
    } finally {
      if (!opts?.silent) {
        setLoading(false);
      }
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderCode.trim()) {
      router.push({ pathname: '/buyer/track', query: { orderId: orderCode.trim() } }, undefined, { shallow: true });
      fetchTracking(orderCode.trim());
    }
  };

  const handleOrderSelect = (selectedOrderId: string) => {
    if (selectedOrderId) {
      setOrderCode(selectedOrderId);
      router.push({ pathname: '/buyer/track', query: { orderId: selectedOrderId } }, undefined, { shallow: true });
      fetchTracking(selectedOrderId);
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
      case 'OUT_FOR_DELIVERY':
        return 3;
      case 'DELIVERED':
        return 4;
      case 'CANCELED':
      case 'CANCELLED':
      case 'REFUNDED':
        return 2;
      default:
        return 0;
    }
  }, [order]);

  const progressPercentage = useMemo(() => {
    if (!order) return 0;
    const status = order.status;
    const progressMap: Record<string, number> = {
      PENDING_PAYMENT: 0,
      PAID: 20,
      PROCESSING: 40,
      OUT_FOR_DELIVERY: 70,
      DELIVERED: 100,
      CANCELED: 0,
      CANCELLED: 0,
      REFUNDED: 0,
    };
    return progressMap[status] ?? 0;
  }, [order]);

  const etaTarget = useMemo(() => {
    const etaCandidate = delivery?.eta || order?.delivery?.eta;
    if (!etaCandidate) return null;
    const etaMs = new Date(etaCandidate).getTime();
    return Number.isFinite(etaMs) ? etaMs : null;
  }, [delivery?.eta, order?.delivery?.eta]);

  const etaDiffMs = useMemo(() => {
    if (!etaTarget) return null;
    return etaTarget - nowMs;
  }, [etaTarget, nowMs]);

  const etaText = useMemo(() => {
    if (etaDiffMs === null) return null;
    const abs = Math.abs(etaDiffMs);
    const totalSeconds = Math.floor(abs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [
      hours > 0 ? `${hours}h` : null,
      `${minutes}m`,
      `${seconds}s`,
    ].filter(Boolean);

    if (etaDiffMs <= 0) {
      return `ETA passed • ${parts.join(' ')}`;
    }
    return `Arriving in ${parts.join(' ')}`;
  }, [etaDiffMs]);

  // Real-time map: refresh more often when out for delivery so rider location updates
  useEffect(() => {
    if (!order?.id) return;

    const terminalStatuses = new Set(['DELIVERED', 'CANCELED', 'CANCELLED', 'REFUNDED']);
    if (terminalStatuses.has(order.status)) return;

    const intervalMs = order.status === 'OUT_FOR_DELIVERY' ? 15_000 : 30_000;
    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      fetchTracking(order.id, { silent: true });
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [order?.id, order?.status]);

  // Tick clock for ETA countdown
  useEffect(() => {
    if (!etaTarget) return;
    const terminalStatuses = new Set(['DELIVERED', 'CANCELED', 'CANCELLED', 'REFUNDED']);
    if (order?.status && terminalStatuses.has(order.status)) return;

    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [etaTarget, order?.status]);

  // Real-time route: warehouse (or rider) → delivery address. Uses live rider location when available.
  const routeCoords = useMemo(() => {
    const destLat = delivery?.deliveryAddressInfo?.latitude ?? delivery?.mapData?.deliveryLocation?.lat;
    const destLng = delivery?.deliveryAddressInfo?.longitude ?? delivery?.mapData?.deliveryLocation?.lng;
    if (destLat == null || destLng == null) {
      return [] as { lat: number; lng: number }[];
    }
    const destination = { lat: destLat, lng: destLng };
    const riderLat = delivery?.mapData?.riderLocation?.lat ?? delivery?.rider?.currentLat;
    const riderLng = delivery?.mapData?.riderLocation?.lng ?? delivery?.rider?.currentLng;
    const start =
      riderLat != null && riderLng != null
        ? { lat: riderLat, lng: riderLng }
        : DEFAULT_WAREHOUSE;
    return [start, destination];
  }, [delivery?.deliveryAddressInfo?.latitude, delivery?.deliveryAddressInfo?.longitude, delivery?.mapData?.riderLocation, delivery?.mapData?.deliveryLocation, delivery?.rider?.currentLat, delivery?.rider?.currentLng]);

  // Live rider position, or delivery address when delivered, or start of route
  const currentCoord = useMemo(() => {
    if (!routeCoords.length) return null;
    if (order?.status === 'DELIVERED') return routeCoords[routeCoords.length - 1];
    const riderLat = delivery?.mapData?.riderLocation?.lat ?? delivery?.rider?.currentLat;
    const riderLng = delivery?.mapData?.riderLocation?.lng ?? delivery?.rider?.currentLng;
    if (riderLat != null && riderLng != null) return { lat: riderLat, lng: riderLng };
    return routeCoords[0];
  }, [routeCoords, order?.status, delivery?.mapData?.riderLocation, delivery?.rider?.currentLat, delivery?.rider?.currentLng]);

  const getDeliveryStatusText = (status?: string) => {
    if (!status) return 'Awaiting assignment';
    const map: Record<string, string> = {
      PREPARING: 'Preparing Package',
      PICKED_UP: 'Picked Up',
      IN_TRANSIT: 'In Transit',
      DELIVERED: 'Delivered',
      ISSUE: 'Delivery Issue',
      CANCELLED: 'Delivery Cancelled',
      CANCELED: 'Delivery Cancelled',
      FAILED: 'Delivery Failed',
    };
    return map[status] || status;
  };

  const deliveryAddressDisplay = useMemo(() => {
    const full = delivery?.deliveryAddressInfo?.fullAddress?.trim();
    if (full) return full;
    const fallback = delivery?.deliveryAddress?.trim();
    if (fallback) return fallback;
    return null;
  }, [delivery?.deliveryAddressInfo?.fullAddress, delivery?.deliveryAddress]);

  const statusHistory = useMemo(() => {
    const events: Array<{ event: string; timestamp: string; meta?: string }> = [];

    if (order?.createdAt) {
      events.push({ event: 'Order Placed', timestamp: order.createdAt });
    }

    if (delivery?.assignedAt) {
      events.push({ event: 'Delivery Assigned', timestamp: delivery.assignedAt });
    }

    if (delivery?.pickedUpAt) {
      events.push({ event: 'Package Picked Up', timestamp: delivery.pickedUpAt });
    }

    if (delivery?.deliveredAt) {
      events.push({ event: 'Delivered', timestamp: delivery.deliveredAt });
    }

    if (delivery?.updatedAt) {
      events.push({
        event: 'Last Delivery Update',
        timestamp: delivery.updatedAt,
        meta: delivery.status ? getDeliveryStatusText(delivery.status) : undefined,
      });
    }

    if (order?.updatedAt) {
      events.push({
        event: 'Last Order Update',
        timestamp: order.updatedAt,
        meta: order.status,
      });
    }

    const unique = new Map<string, { event: string; timestamp: string; meta?: string }>();
    for (const e of events) {
      const key = `${e.event}-${e.timestamp}-${e.meta ?? ''}`;
      unique.set(key, e);
    }

    return Array.from(unique.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [order?.createdAt, order?.updatedAt, order?.status, delivery?.assignedAt, delivery?.pickedUpAt, delivery?.deliveredAt, delivery?.updatedAt, delivery?.status]);

  const handleShareTracking = async () => {
    if (!order?.id) return;
    try {
      const url = `${window.location.origin}/buyer/track?orderId=${order.id}`;

      if (navigator.share) {
        await navigator.share({
          title: `Track Order #${order.id.slice(0, 8)}`,
          text: 'Track my Carryofy order',
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      toast.success('Tracking link copied to clipboard');
    } catch (err) {
      console.error('Share failed', err);
      toast.error('Unable to share tracking link right now');
    }
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
              Select an order from your list to see real-time tracking updates and delivery progress.
            </p>
          </div>

          {/* Track Form */}
          <div className="mb-8 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
            <div className="flex flex-col gap-4">
              <div className="flex-1">
                <label htmlFor="order-select" className="block text-[#ffcc99] text-sm font-medium mb-2">
                  Select Order to Track
                </label>
                {loadingOrders ? (
                  <div className="flex items-center gap-2 text-[#ffcc99]/70">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading your orders...</span>
                  </div>
                ) : buyerOrders.length === 0 ? (
                  <div className="bg-black/40 border border-[#ff6600]/20 rounded-xl p-4 text-center">
                    <p className="text-[#ffcc99]/70 text-sm mb-3">You don't have any orders yet.</p>
                    <Link
                      href="/buyer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff6600] text-black rounded-lg font-semibold hover:bg-[#cc5200] transition text-sm"
                    >
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <select
                    id="order-select"
                    value={orderCode}
                    onChange={(e) => handleOrderSelect(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-[#ff6600]/30 rounded-xl text-white focus:outline-none focus:border-[#ff6600] appearance-none cursor-pointer"
                  >
                    <option value="">-- Select an order to track --</option>
                    {buyerOrders.map((buyerOrder) => {
                      const orderDate = new Date(buyerOrder.createdAt);
                      const formattedDate = orderDate.toLocaleDateString('en-NG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      });
                      const formattedTime = orderDate.toLocaleTimeString('en-NG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const totalPrice = formatPrice(buyerOrder.amount);
                      const statusLabel = buyerOrder.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
                      const itemCount = buyerOrder.items.reduce((sum, item) => sum + item.quantity, 0);

                      return (
                        <option key={buyerOrder.id} value={buyerOrder.id}>
                          #{buyerOrder.id.slice(0, 8)} • {formattedDate} {formattedTime} • {itemCount} item{itemCount !== 1 ? 's' : ''} • {totalPrice} • {statusLabel}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
              {buyerOrders.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-[#ffcc99]/70">
                  <Search className="w-4 h-4" />
                  <span>Or manually enter order ID below</span>
                </div>
              )}
              {buyerOrders.length > 0 && (
                <form onSubmit={handleTrackSubmit} className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ffcc99]/50" />
                    <input
                      type="text"
                      value={orderCode}
                      onChange={(e) => setOrderCode(e.target.value)}
                      placeholder="Enter order ID manually (e.g. 06b43a97...)"
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
              )}
            </div>
          </div>

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
                    <div className="mt-3 space-y-1 text-xs text-[#ffcc99]/70">
                      {etaText && (
                        <p className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#ff6600]" />
                          {etaText}
                        </p>
                      )}
                      <p className="flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 text-[#ff6600]" />
                        Auto-updates every 30 seconds
                        {lastUpdatedAt ? ` • Last updated ${formatDate(lastUpdatedAt)}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fetchTracking(order.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-black border border-[#ff6600]/30 text-[#ffcc99] rounded-lg hover:bg-[#ff6600]/10 hover:border-[#ff6600] transition text-sm font-medium"
                      title="Refresh tracking"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                    <button
                      type="button"
                      onClick={handleShareTracking}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-black border border-[#ff6600]/30 text-[#ffcc99] rounded-lg hover:bg-[#ff6600]/10 hover:border-[#ff6600] transition text-sm font-medium"
                      title="Share tracking link"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                    {order.status === 'OUT_FOR_DELIVERY' && (
                      <Link
                        href={`/buyer/orders/${order.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-[#ff6600] text-black rounded-lg hover:bg-[#cc5200] transition text-sm font-bold"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Confirm delivery
                      </Link>
                    )}
                    <Link
                      href="/buyer/orders"
                      className="flex items-center gap-2 px-4 py-2 bg-[#ff6600]/10 border border-[#ff6600]/30 text-[#ffcc99] rounded-lg hover:bg-[#ff6600]/20 hover:border-[#ff6600] transition text-sm font-medium"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Orders
                    </Link>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[#ffcc99] text-sm font-medium">Progress</p>
                    <p className="text-white text-sm font-semibold">{progressPercentage}%</p>
                  </div>
                  <div className="h-2 rounded-full bg-black border border-[#ff6600]/20 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${progressPercentage >= 100 ? 'bg-green-500' : 'bg-[#ff6600]'
                        }`}
                      style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
                    />
                  </div>
                  {delivery?.eta && (
                    <p className="mt-2 text-xs text-[#ffcc99]/70">
                      ETA: <span className="text-white">{formatDate(delivery.eta)}</span>
                    </p>
                  )}
                </div>
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

                      const showCancelled =
                        order.status === 'CANCELED' || order.status === 'CANCELLED' || order.status === 'REFUNDED';

                      if (showCancelled && index > 2) {
                        return null;
                      }

                      return (
                        <div key={step.key} className="relative flex gap-6">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition ${isActive ? 'bg-[#ff6600] border-[#ff6600] text-black' : 'bg-black border-[#ff6600]/30 text-[#ffcc99]/60'
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
                                {etaText ? ` • ${etaText}` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {(order.status === 'CANCELED' || order.status === 'CANCELLED' || order.status === 'REFUNDED') && (
                      <div className="relative flex gap-6">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 bg-red-500 border-red-500 text-white">
                            <XCircle className="w-5 h-5" />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white">
                            {order.status === 'REFUNDED' ? 'Order Refunded' : 'Order Cancelled'}
                          </h4>
                          <p className="text-[#ffcc99]/80 text-sm">
                            {order.status === 'REFUNDED'
                              ? 'This order has been refunded. Please check your account for the refund.'
                              : 'This order was cancelled. If payment was made, it will be reversed shortly.'}
                          </p>
                          <p className="text-[#ffcc99]/60 text-xs mt-2">
                            If you still need the items, you can place a new order from the marketplace.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status History */}
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                <h3 className="text-white text-xl font-bold mb-4">Status History</h3>
                {statusHistory.length === 0 ? (
                  <p className="text-[#ffcc99]/80 text-sm">No history available yet.</p>
                ) : (
                  <div className="space-y-3">
                    {statusHistory.map((event) => (
                      <div
                        key={`${event.event}-${event.timestamp}-${event.meta ?? ''}`}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-[#ff6600]/20 bg-black/40 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="text-white font-semibold text-sm">{event.event}</p>
                          {event.meta ? (
                            <p className="text-[#ffcc99]/70 text-xs truncate">{event.meta}</p>
                          ) : null}
                        </div>
                        <p className="text-[#ffcc99]/80 text-xs sm:text-sm whitespace-nowrap">
                          {formatDate(event.timestamp)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Real-time map: rider → your address (or warehouse → your address before rider sets off) */}
              {routeCoords.length > 0 ? (
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white text-xl font-bold">Real-time map</h3>
                    {delivery?.status && (
                      <span className="text-[#ffcc99] text-sm">
                        {getDeliveryStatusText(delivery.status)}
                      </span>
                    )}
                  </div>
                  <TrackMap routeCoords={routeCoords} currentCoord={currentCoord} />
                  <p className="text-[#ffcc99]/70 text-xs mt-3">
                    {delivery?.mapData?.riderLocation ?? delivery?.rider?.currentLat != null
                      ? 'Rider location updates every 15s while out for delivery.'
                      : 'Route from warehouse to your address. Rider position will appear once they start.'}
                  </p>
                </div>
              ) : (delivery || order?.delivery) && (
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                  <p className="text-[#ffcc99]/80 text-sm">
                    Map will appear when your delivery address has location data. You can still track status above.
                  </p>
                </div>
              )}

              {/* Delivery Details */}
              {(delivery || order.delivery) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                    <h3 className="text-white text-xl font-bold mb-4">Delivery Details</h3>
                    {delivery ? (
                      <div className="space-y-4 text-[#ffcc99] text-sm">
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

                        <div className="rounded-lg border border-[#ff6600]/20 bg-black/40 p-4 space-y-2">
                          <p className="text-xs uppercase tracking-wide text-[#ffcc99]/70 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#ff6600]" />
                            Delivery Address
                          </p>
                          <p className="text-white text-sm leading-relaxed">
                            {deliveryAddressDisplay ?? 'Address will be updated when delivery is assigned.'}
                          </p>
                        </div>

                        {delivery.rider?.name ? (
                          <div className="rounded-lg border border-[#ff6600]/20 bg-black/40 p-4 space-y-2">
                            <p className="text-xs uppercase tracking-wide text-[#ffcc99]/70 flex items-center gap-2">
                              <Phone className="w-4 h-4 text-[#ff6600]" />
                              Rider Contact
                            </p>
                            <p className="text-white text-sm font-semibold">{delivery.rider.name}</p>
                            {delivery.rider.phone ? (
                              <div className="flex flex-wrap gap-2 pt-1">
                                <a
                                  href={`tel:${delivery.rider.phone}`}
                                  className="inline-flex items-center gap-2 rounded-lg bg-[#ff6600] px-4 py-2 text-black font-bold hover:bg-[#cc5200] transition text-sm"
                                >
                                  <Phone className="w-4 h-4" />
                                  Call Rider
                                </a>
                                <a
                                  href={`sms:${delivery.rider.phone}`}
                                  className="inline-flex items-center gap-2 rounded-lg border border-[#ff6600]/40 px-4 py-2 text-[#ffcc99] hover:bg-[#ff6600]/10 hover:border-[#ff6600] transition text-sm font-semibold"
                                >
                                  Message
                                </a>
                              </div>
                            ) : (
                              <p className="text-[#ffcc99]/70 text-xs">Phone number is not available yet.</p>
                            )}
                          </div>
                        ) : null}

                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#ff6600]" />
                          Updated: <span className="text-white">{formatDate(delivery.updatedAt)}</span>
                        </p>
                        {delivery.eta && (
                          <>
                            <p className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-[#ff6600]" />
                              Estimated Arrival: <span className="text-white">{formatDate(delivery.eta)}</span>
                            </p>
                            <p className="text-[#ffcc99]/70 text-xs mt-1">
                              Based on distance from rider (or warehouse) to your address; updates as the rider moves.
                            </p>
                          </>
                        )}
                        {etaText ? (
                          <p className="text-[#ff6600] text-sm font-semibold">
                            {etaText}
                          </p>
                        ) : null}
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

