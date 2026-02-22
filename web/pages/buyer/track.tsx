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
import { formatDateTime, formatNgnFromKobo } from '../../lib/api/utils';
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
  Navigation,
  Gift,
  Share2,
  RefreshCw,
  BadgeCheck,
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
  seller?: { name: string } | null;
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

/** Steps: Order Placed → Confirmed → Picked Up → In Transit → Out for Delivery → Delivered */
const TRACKING_STEPS = [
  { key: 'ORDER_PLACED', label: 'Order Placed', description: 'Your order has been received.', icon: Package },
  { key: 'CONFIRMED', label: 'Confirmed', description: 'Payment verified and order confirmed.', icon: CheckCircle2 },
  { key: 'PICKED_UP', label: 'Picked Up', description: 'Package picked up from seller.', icon: Package },
  { key: 'IN_TRANSIT', label: 'In Transit', description: 'On the way to your address.', icon: Truck },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', description: 'Rider is on the way to you.', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', description: 'Order delivered successfully.', icon: CheckCircle2 },
];

interface BuyerOrder {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  items: Array<{
    id: string;
    product: { title: string };
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
    if (tokenManager.isAuthenticated() && delivery?.rider?.id) {
      const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/location', {
        extraHeaders: { Authorization: `Bearer ${tokenManager.getAccessToken()}` },
      });
      newSocket.on('connect', () => {
        if (delivery.rider?.id) newSocket.emit('subscribeToRider', { riderId: delivery.rider.id });
      });
      newSocket.on('riderLocationUpdated', (data: { riderId: string; lat: number; lng: number }) => {
        if (data.riderId === delivery.rider?.id) {
          setDelivery((prev) =>
            prev
              ? {
                  ...prev,
                  rider: prev.rider ? { ...prev.rider, currentLat: data.lat, currentLng: data.lng, lastLocationUpdate: new Date().toISOString() } : prev.rider,
                  mapData: { ...prev.mapData, riderLocation: { lat: data.lat, lng: data.lng, lastUpdate: new Date().toISOString() } },
                }
              : prev
          );
        }
      });
      setSocket(newSocket);
      return () => { newSocket.disconnect(); };
    }
  }, [delivery?.rider?.id]);

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
    fetchBuyerOrders();
  }, [router]);

  const fetchBuyerOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await apiClient.get('/orders');
      const responseData = response.data.data || response.data;
      let orders: BuyerOrder[] = [];
      if (responseData?.orders && Array.isArray(responseData.orders)) orders = responseData.orders;
      else if (Array.isArray(responseData)) orders = responseData;
      setBuyerOrders(orders.filter((o) => o.status !== 'DELIVERED'));
    } catch {
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
      const [orderRes, deliveryRes] = await Promise.allSettled([
        apiClient.get(`/orders/${orderId}`),
        apiClient.get(`/delivery/orders/${orderId}`),
      ]);
      if (orderRes.status === 'fulfilled') {
        const orderData = orderRes.value.data.data || orderRes.value.data;
        setOrder(orderData);
      } else throw orderRes.reason;
      if (deliveryRes.status === 'fulfilled') {
        const deliveryData = deliveryRes.value.data.data || deliveryRes.value.data;
        setDelivery(deliveryData);
      }
      setLastUpdatedAt(new Date().toISOString());
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Unable to retrieve tracking.';
      if (!opts?.silent) setError(msg);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = orderCode.trim();
    if (code) {
      router.push({ pathname: '/buyer/track', query: { orderId: code } }, undefined, { shallow: true });
      fetchTracking(code);
    }
  };

  const handleOrderSelect = (selectedId: string) => {
    if (!selectedId) {
      setOrderCode('');
      setOrder(null);
      setDelivery(null);
      router.push('/buyer/track', undefined, { shallow: true });
      return;
    }
    setOrderCode(selectedId);
    router.push({ pathname: '/buyer/track', query: { orderId: selectedId } }, undefined, { shallow: true });
    fetchTracking(selectedId);
  };

  const formatPrice = (k: number) => formatNgnFromKobo(k, { maximumFractionDigits: 2 });

  const activeStepIndex = useMemo(() => {
    if (!order) return 0;
    const s = order.status;
    const d = delivery?.status;
    if (s === 'DELIVERED') return 5;
    if (s === 'OUT_FOR_DELIVERY') return 4;
    if (d === 'IN_TRANSIT' || d === 'PICKED_UP') return 3;
    if (d === 'PICKED_UP' || s === 'PROCESSING') return 2;
    if (s === 'PAID') return 1;
    return 0;
  }, [order, delivery?.status]);

  const etaTarget = useMemo(() => {
    const eta = delivery?.eta || order?.delivery?.eta;
    if (!eta) return null;
    const t = new Date(eta).getTime();
    return Number.isFinite(t) ? t : null;
  }, [delivery?.eta, order?.delivery?.eta]);

  const etaDiffMs = useMemo(() => (etaTarget ? etaTarget - nowMs : null), [etaTarget, nowMs]);

  const etaText = useMemo(() => {
    if (etaDiffMs === null) return null;
    const abs = Math.abs(etaDiffMs);
    const totalSeconds = Math.floor(abs / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const parts = [h > 0 ? `${h}h` : null, `${m}m`].filter(Boolean);
    return etaDiffMs <= 0 ? `ETA passed • ${parts.join(' ')}` : `Arriving in ${parts.join(' ')}`;
  }, [etaDiffMs]);

  useEffect(() => {
    if (!order?.id) return;
    const terminal = new Set(['DELIVERED', 'CANCELED', 'CANCELLED', 'REFUNDED']);
    if (terminal.has(order.status)) return;
    const ms = order.status === 'OUT_FOR_DELIVERY' ? 15_000 : 30_000;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') fetchTracking(order.id, { silent: true });
    }, ms);
    return () => window.clearInterval(id);
  }, [order?.id, order?.status]);

  useEffect(() => {
    if (!etaTarget || (order?.status && new Set(['DELIVERED', 'CANCELED', 'CANCELLED', 'REFUNDED']).has(order.status))) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [etaTarget, order?.status]);

  const routeCoords = useMemo(() => {
    const destLat = delivery?.deliveryAddressInfo?.latitude ?? delivery?.mapData?.deliveryLocation?.lat;
    const destLng = delivery?.deliveryAddressInfo?.longitude ?? delivery?.mapData?.deliveryLocation?.lng;
    if (destLat == null || destLng == null) return [] as { lat: number; lng: number }[];
    const dest = { lat: destLat, lng: destLng };
    const rLat = delivery?.mapData?.riderLocation?.lat ?? delivery?.rider?.currentLat;
    const rLng = delivery?.mapData?.riderLocation?.lng ?? delivery?.rider?.currentLng;
    const start = rLat != null && rLng != null ? { lat: rLat, lng: rLng } : DEFAULT_WAREHOUSE;
    return [start, dest];
  }, [delivery?.deliveryAddressInfo?.latitude, delivery?.deliveryAddressInfo?.longitude, delivery?.mapData, delivery?.rider?.currentLat, delivery?.rider?.currentLng]);

  const currentCoord = useMemo(() => {
    if (!routeCoords.length) return null;
    if (order?.status === 'DELIVERED') return routeCoords[routeCoords.length - 1];
    const rLat = delivery?.mapData?.riderLocation?.lat ?? delivery?.rider?.currentLat;
    const rLng = delivery?.mapData?.riderLocation?.lng ?? delivery?.rider?.currentLng;
    if (rLat != null && rLng != null) return { lat: rLat, lng: rLng };
    return routeCoords[0];
  }, [routeCoords, order?.status, delivery?.mapData?.riderLocation, delivery?.rider?.currentLat, delivery?.rider?.currentLng]);

  const getDeliveryStatusText = (status?: string) => {
    const m: Record<string, string> = {
      PREPARING: 'Preparing Package',
      PICKED_UP: 'Picked Up',
      IN_TRANSIT: 'In Transit',
      DELIVERED: 'Delivered',
      ISSUE: 'Delivery Issue',
      CANCELLED: 'Delivery Cancelled',
      CANCELED: 'Delivery Cancelled',
      FAILED: 'Delivery Failed',
    };
    return status ? m[status] || status : 'Awaiting assignment';
  };

  const deliveryAddressDisplay = delivery?.deliveryAddressInfo?.fullAddress?.trim() ?? delivery?.deliveryAddress?.trim() ?? null;

  const handleShareTracking = async () => {
    if (!order?.id) return;
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/buyer/track?orderId=${order.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Track Order #${order.id.slice(0, 8)}`, text: 'Track my Carryofy order', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('Tracking link copied');
    } catch {
      toast.error('Unable to share');
    }
  };

  const displayOrders = buyerOrders;

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>Track Shipment - Carryofy</title>
        <meta name="description" content="Track your Carryofy order status and delivery progress" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <BuyerLayout>
        <div className="min-h-[70vh]">
          {/* Top Section */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-white text-2xl md:text-3xl font-bold flex items-center gap-3 mb-1">
              <Truck className="w-8 h-8 text-[#ff6600]" aria-hidden />
              Track Shipment
            </h1>
            <p className="text-[#ffcc99]/80 text-sm md:text-base">
              Select an order or enter a tracking number to see live updates.
            </p>
          </div>

          {/* Search / Select Input */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
              <div className="flex-1">
                {loadingOrders ? (
                  <div className="flex items-center gap-2 text-[#ffcc99]/70 py-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading orders...</span>
                  </div>
                ) : (
                  <select
                    id="order-select"
                    value={orderCode}
                    onChange={(e) => handleOrderSelect(e.target.value)}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white focus:outline-none focus:border-[#ff6600] focus:ring-1 focus:ring-[#ff6600]/50 appearance-none cursor-pointer"
                    aria-label="Select from your orders"
                  >
                    <option value="">Select from your orders</option>
                    {displayOrders.map((o) => {
                      const d = new Date(o.createdAt);
                      const dateStr = d.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
                      const timeStr = d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
                      const total = formatPrice(o.amount);
                      const status = o.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
                      const qty = o.items.reduce((s, i) => s + i.quantity, 0);
                      return (
                        <option key={o.id} value={o.id}>
                          #{o.id.slice(0, 8)} • {dateStr} {timeStr} • {qty} item{qty !== 1 ? 's' : ''} • {total} • {status}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div className="flex items-center gap-2 text-[#ffcc99]/50 text-sm shrink-0">
                <span className="w-8 h-px bg-[#ff6600]/30" aria-hidden />
                <span>OR</span>
                <span className="w-8 h-px bg-[#ff6600]/30" aria-hidden />
              </div>

              <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ffcc99]/50 pointer-events-none" aria-hidden />
                  <input
                    type="text"
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value)}
                    placeholder="Enter tracking number"
                    className="w-full pl-12 pr-4 py-3 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600]"
                    aria-label="Enter tracking number"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition whitespace-nowrap"
                >
                  Track
                </button>
              </form>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="py-16 text-center">
              <Loader2 className="w-12 h-12 text-[#ff6600] mx-auto animate-spin mb-4" />
              <p className="text-[#ffcc99]">Fetching tracking details...</p>
            </div>
          )}

          {/* Error */}
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

          {/* Empty State - no order selected */}
          {!loading && !error && !order && (
            <div className="rounded-2xl border border-[#ff6600]/20 bg-[#1a1a1a]/50 p-8 md:p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#ff6600]/10 text-[#ff6600] mb-6">
                <Truck className="w-10 h-10" aria-hidden />
              </div>
              <h2 className="text-white text-xl font-bold mb-2">Select an order above to see live tracking</h2>
              <p className="text-[#ffcc99]/80 text-sm mb-6 max-w-md mx-auto">
                Choose an order from the dropdown or enter your tracking number to view delivery progress and ETA.
              </p>
              <Link
                href="/buyer/orders"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition mb-6"
              >
                View My Orders
              </Link>
              <div className="pt-6 border-t border-[#ff6600]/20">
                <p className="text-[#ffcc99]/70 text-sm mb-3">Have a tracking number? Enter it above.</p>
                <form onSubmit={handleTrackSubmit} className="max-w-md mx-auto flex gap-2">
                  <input
                    type="text"
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value)}
                    placeholder="e.g. CFY-2024-7892"
                    className="flex-1 px-4 py-2.5 bg-black/60 border border-[#ff6600]/30 rounded-lg text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600] text-sm"
                  />
                  <button type="submit" className="px-4 py-2.5 bg-[#ff6600]/20 border border-[#ff6600]/50 text-[#ffcc99] rounded-lg font-medium hover:bg-[#ff6600]/30 transition text-sm">
                    Track
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Full Tracking View - Two columns when order selected */}
          {!loading && !error && order && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
              {/* Left Column */}
              <div className="lg:col-span-3 space-y-6">
                {/* Order Summary Card */}
                <div className="rounded-xl border border-[#ff6600]/30 bg-[#1a1a1a] p-5 md:p-6">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg bg-black/60 border border-[#ff6600]/20 shrink-0 overflow-hidden flex items-center justify-center">
                      {order.items[0]?.product?.images?.[0] ? (
                        <img src={order.items[0].product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-[#ffcc99]/50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold truncate">{order.items[0]?.product?.title ?? 'Order'}</h3>
                      <p className="text-[#ffcc99]/80 text-sm mt-0.5">Order ID: #{order.id.slice(0, 8)}</p>
                      <p className="text-[#ffcc99]/80 text-sm">
                        Qty: {order.items.reduce((s, i) => s + i.quantity, 0)} • Total {formatPrice(order.amount)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[#ffcc99] text-sm">
                          {order.seller?.name ?? 'Carryofy Seller'}
                        </span>
                        <BadgeCheck className="w-4 h-4 text-emerald-500 shrink-0" aria-label="Verified" />
                      </div>
                      {etaTarget && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#ff6600]/15 border border-[#ff6600]/30">
                          <Calendar className="w-4 h-4 text-[#ff6600]" />
                          <span className="text-[#ff6600] font-semibold text-sm">
                            Est. delivery: {formatDateTime(delivery?.eta ?? order.delivery?.eta ?? order.updatedAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tracking Timeline (vertical stepper) */}
                <div className="rounded-xl border border-[#ff6600]/30 bg-[#1a1a1a] p-5 md:p-6">
                  <h3 className="text-white font-bold text-lg mb-6">Tracking Timeline</h3>
                  <div className="relative">
                    <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-[#ff6600]/20" aria-hidden />
                    <div className="space-y-6">
                      {TRACKING_STEPS.map((step, idx) => {
                        const isCompleted = idx < activeStepIndex;
                        const isActive = idx === activeStepIndex;
                        const Icon = step.icon;
                        return (
                          <div key={step.key} className="relative flex gap-4">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 z-10 ${
                                isCompleted
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                  : isActive
                                    ? 'bg-[#ff6600] border-[#ff6600] text-black'
                                    : 'bg-[#0d0d0d] border-[#ff6600]/30 text-[#ffcc99]/50'
                              }`}
                            >
                              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                            </div>
                            <div className="pb-2">
                              <h4
                                className={`font-bold ${isCompleted ? 'text-emerald-400' : isActive ? 'text-[#ff6600]' : 'text-[#ffcc99]/60'}`}
                              >
                                {step.label}
                              </h4>
                              <p className="text-[#ffcc99]/70 text-sm">{step.description}</p>
                              {isActive && order.status !== 'DELIVERED' && (
                                <p className="text-[#ff6600] text-xs font-medium mt-1">
                                  {getDeliveryStatusText(delivery?.status)}
                                  {etaText && ` • ${etaText}`}
                                </p>
                              )}
                              {isActive && idx === 0 && order.createdAt && (
                                <p className="text-[#ffcc99]/60 text-xs mt-1">{formatDateTime(order.createdAt)}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Delivery Details Card */}
                <div className="rounded-xl border border-[#ff6600]/30 bg-[#1a1a1a] p-5 md:p-6">
                  <h3 className="text-white font-bold text-lg mb-4">Delivery Details</h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-[#ffcc99]/70 text-xs uppercase tracking-wide mb-1">Address</p>
                      <p className="text-white">{deliveryAddressDisplay ?? 'Address will be updated when assigned.'}</p>
                    </div>
                    {(delivery?.trackingNumber || order.delivery?.trackingNumber) && (
                      <div>
                        <p className="text-[#ffcc99]/70 text-xs uppercase tracking-wide mb-1">Courier / Tracking</p>
                        <p className="text-white">
                          Carryofy Logistics • {delivery?.trackingNumber ?? order.delivery?.trackingNumber}
                        </p>
                      </div>
                    )}
                    <Link
                      href="/buyer/help"
                      className="inline-flex items-center gap-2 text-[#ff6600] font-semibold hover:text-[#ff9933] transition"
                    >
                      Contact Support
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Column - Map */}
              <div className="lg:col-span-2">
                <div className="sticky top-24 space-y-4">
                  {routeCoords.length > 0 ? (
                    <div className="rounded-xl border border-[#ff6600]/30 bg-[#1a1a1a] overflow-hidden">
                      <div className="p-4 border-b border-[#ff6600]/20">
                        <h3 className="text-white font-bold">Live Map</h3>
                        {delivery?.status && (
                          <p className="text-[#ffcc99]/70 text-xs mt-0.5">{getDeliveryStatusText(delivery.status)}</p>
                        )}
                      </div>
                      <TrackMap routeCoords={routeCoords} currentCoord={currentCoord} />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#ff6600]/30 bg-[#0d0d0d] overflow-hidden">
                      <div className="aspect-[4/3] flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#ff6600]/10 flex items-center justify-center mb-4">
                          <MapPin className="w-8 h-8 text-[#ff6600]/60" />
                        </div>
                        <p className="text-[#ffcc99]/80 text-sm">Map placeholder</p>
                        <p className="text-[#ffcc99]/50 text-xs mt-1">Live tracking available when order is in transit</p>
                      </div>
                    </div>
                  )}
                  <p className="text-[#ffcc99]/50 text-xs text-center">
                    Live tracking available when order is in transit
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => order?.id && fetchTracking(order.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-black/60 border border-[#ff6600]/30 text-[#ffcc99] rounded-lg hover:bg-[#ff6600]/10 transition text-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                    <button
                      type="button"
                      onClick={handleShareTracking}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-black/60 border border-[#ff6600]/30 text-[#ffcc99] rounded-lg hover:bg-[#ff6600]/10 transition text-sm"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                    <Link
                      href="/buyer/orders"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff6600]/10 border border-[#ff6600]/30 text-[#ffcc99] rounded-lg hover:bg-[#ff6600]/20 transition text-sm"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      My Orders
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </BuyerLayout>
    </>
  );
}
