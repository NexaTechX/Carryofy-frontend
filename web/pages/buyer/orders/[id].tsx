import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState, ReactElement } from 'react';
import Link from 'next/link';
import BuyerLayout from '../../../components/buyer/BuyerLayout';
import apiClient from '../../../lib/api/client';
import { AxiosError } from 'axios';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Gift,
  Loader2,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
  XCircle,
} from 'lucide-react';
import { showErrorToast, showSuccessToast } from '../../../lib/ui/toast';
import { userManager, tokenManager } from '../../../lib/auth';
import SubmitReviewModal from '../../../components/buyer/SubmitReviewModal';
import RiderRatingModal from '../../../components/buyer/RiderRatingModal';
import RefundRequestModal from '../../../components/buyer/RefundRequestModal';
import { useConfirmation } from '../../../lib/hooks/useConfirmation';
import { formatDateTime, formatNgnFromKobo } from '../../../lib/api/utils';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';

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
      businessName: string;
    };
  };
}

interface Delivery {
  id: string;
  status: string;
  trackingNumber?: string;
  eta?: string;
  updatedAt: string;
  riderId?: string;
  rider?: { id: string; name: string };
}

interface OrderDetail {
  id: string;
  userId: string;
  amount: number;
  status: string;
  paymentRef?: string;
  paystackReference?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  delivery?: Delivery;
}

const ORDER_STEPS = [
  { key: 'PENDING_PAYMENT', label: 'Pending Payment', description: 'We are waiting for payment confirmation.' },
  { key: 'PAID', label: 'Payment Confirmed', description: 'Your payment has been recorded successfully.' },
  { key: 'PROCESSING', label: 'Packaging', description: 'We are currently packaging your goods for shipment.' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', description: 'The rider has picked up your package and is en route.' },
  { key: 'DELIVERED', label: 'Delivered', description: 'Order delivered successfully.' },
];

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; className: string; icon: ReactElement }> = {
    PENDING_PAYMENT: {
      label: 'Pending Payment',
      className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      icon: <Clock className="w-3 h-3" />,
    },
    PAID: {
      label: 'Payment Confirmed',
      className: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      icon: <ShieldCheck className="w-3 h-3" />,
    },
    PROCESSING: {
      label: 'Packaging',
      className: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      icon: <Package className="w-3 h-3" />,
    },
    OUT_FOR_DELIVERY: {
      label: 'Out for Delivery',
      className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      icon: <Truck className="w-3 h-3" />,
    },
    DELIVERED: {
      label: 'Delivered',
      className: 'bg-green-500/10 text-green-400 border-green-500/30',
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    CANCELED: {
      label: 'Canceled',
      className: 'bg-red-500/10 text-red-400 border-red-500/30',
      icon: <XCircle className="w-3 h-3" />,
    },
    REFUNDED: {
      label: 'Refunded',
      className: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
      icon: <Gift className="w-3 h-3" />,
    },
  };

  const data = map[status] ?? {
    label: status,
    className: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
    icon: <Clock className="w-3 h-3" />,
  };

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${data.className}`}>
      {data.icon}
      {data.label}
    </span>
  );
};

export default function BuyerOrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewItem, setReviewItem] = useState<OrderItem | null>(null);
  const [reviewedProducts, setReviewedProducts] = useState<Record<string, boolean>>({});
  const [riderRatingModalOpen, setRiderRatingModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [hasRefund, setHasRefund] = useState(false);
  const [refundInfo, setRefundInfo] = useState<{ id: string; status: string; createdAt: string; updatedAt: string } | null>(null);
  const [paymentVerifying, setPaymentVerifying] = useState(false);
  const confirmation = useConfirmation();

  // Fetch order details
  const fetchOrder = async (orderId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/orders/${orderId}`);
      const orderData = response.data.data || response.data;
      setOrder(orderData);
    } catch (err: unknown) {
      console.error('Error fetching order:', err);
      const errorMessage = err instanceof AxiosError && err.response?.data?.message 
        ? err.response.data.message 
        : 'Failed to load order details';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!router.isReady || typeof id !== 'string') {
      return;
    }

    fetchOrder(id);
    checkRefundStatus(id);
  }, [router.isReady, id]);

  // Handle payment redirect status
  useEffect(() => {
    if (!router.isReady || typeof id !== 'string') return;

    const paymentStatus = router.query.payment as string;
    const message = router.query.message as string;

    if (paymentStatus === 'success') {
      showSuccessToast('Payment successful! Your order is being processed.');
      router.replace(`/buyer/orders/${id}`, undefined, { shallow: true });
      setTimeout(() => {
        fetchOrder(id);
        checkRefundStatus(id);
      }, 500);
      setTimeout(() => {
        fetchOrder(id);
      }, 2500);
    } else if (paymentStatus === 'verifying') {
      showSuccessToast('Confirming your payment… Please wait a moment.');
      router.replace(`/buyer/orders/${id}`, undefined, { shallow: true });
      setPaymentVerifying(true);
    } else if (paymentStatus === 'failed') {
      showErrorToast('Payment failed. Please try again or contact support.');
      router.replace(`/buyer/orders/${id}`, undefined, { shallow: true });
      setTimeout(() => fetchOrder(id), 500);
    } else if (paymentStatus === 'error') {
      router.replace(`/buyer/orders/${id}`, undefined, { shallow: true });
      // Backend may redirect with error due to race with webhook; if order is PAID, show success
      apiClient.get(`/orders/${id}`).then((res) => {
        const data = res.data?.data ?? res.data;
        if (data?.status === 'PAID') {
          showSuccessToast('Payment successful! Your order is being processed.');
        } else {
          showErrorToast(message || 'Payment verification failed. Please contact support.');
        }
        fetchOrder(id);
        checkRefundStatus(id);
      }).catch(() => {
        showErrorToast(message || 'Payment verification failed. Please contact support.');
        fetchOrder(id);
      });
    }
  }, [router.isReady, router.query.payment, router.query.message, id]);

  // Poll order when payment is verifying (Paystack pending/ongoing); stop when PAID or timeout
  useEffect(() => {
    if (!paymentVerifying || typeof id !== 'string') return;

    const maxAttempts = 24;
    const intervalMs = 5000;
    let attempts = 0;
    let stopped = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (stopped || attempts >= maxAttempts) {
        setPaymentVerifying(false);
        return;
      }
      attempts += 1;
      try {
        const res = await apiClient.get(`/orders/${id}`);
        const data = res.data?.data ?? res.data;
        if (data?.status === 'PAID') {
          stopped = true;
          setPaymentVerifying(false);
          showSuccessToast('Payment confirmed! Your order is being processed.');
          fetchOrder(id);
          checkRefundStatus(id);
          return;
        }
      } catch {
        /* ignore */
      }
      if (!stopped && attempts < maxAttempts) {
        timeoutId = setTimeout(poll, intervalMs);
      } else {
        setPaymentVerifying(false);
      }
    };

    timeoutId = setTimeout(poll, intervalMs);
    return () => {
      stopped = true;
      clearTimeout(timeoutId);
    };
  }, [paymentVerifying, id]);

  const checkRefundStatus = async (orderId: string) => {
    try {
      const response = await apiClient.get(`/refunds/my-refunds`);
      const refunds = (response.data.data || response.data) as any[];
      const orderRefund = refunds.find((r: any) => r.orderId === orderId);
      setHasRefund(!!orderRefund);
      setRefundInfo(
        orderRefund
          ? {
              id: orderRefund.id,
              status: orderRefund.status,
              createdAt: orderRefund.createdAt,
              updatedAt: orderRefund.updatedAt,
            }
          : null,
      );
    } catch (err) {
      console.warn('Error checking refund status:', err);
    }
  };

  useEffect(() => {
    const currentUser = userManager.getUser();
    setCurrentUserId(currentUser?.id ?? null);
  }, []);

  useEffect(() => {
    const loadReviewedProducts = async () => {
      if (!order || !currentUserId) return;
      const productIds = Array.from(new Set(order.items.map((item) => item.productId)));

      try {
        const results = await Promise.all(
          productIds.map(async (productId) => {
            try {
              const response = await apiClient.get(`/products/${productId}/reviews/mine`);
              const data = response.data.data || response.data;
              return { productId, hasReview: Array.isArray(data) && data.length > 0 };
            } catch (err) {
              console.warn('Failed to fetch user review status', err);
              return { productId, hasReview: false };
            }
          })
        );

        const map = results.reduce<Record<string, boolean>>((acc, item) => {
          acc[item.productId] = item.hasReview;
          return acc;
        }, {});

        setReviewedProducts(map);
      } catch (err) {
        console.warn('Unable to determine reviewed products', err);
      }
    };

    loadReviewedProducts();
  }, [order, currentUserId]);

  const pendingReviewItems = useMemo(() => {
    if (!order || order.status !== 'DELIVERED') return [] as OrderItem[];
    return order.items.filter((item) => !reviewedProducts[item.productId]);
  }, [order, reviewedProducts]);

  const handleOpenReview = (item: OrderItem) => {
    setReviewItem(item);
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!order || !reviewItem) return;

    try {
      await apiClient.post(`/products/${reviewItem.productId}/reviews`, {
        rating,
        comment,
        orderId: order.id,
      });
      setReviewedProducts((prev) => ({ ...prev, [reviewItem.productId]: true }));
      showSuccessToast('Review submitted. Thanks for your feedback!');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('reviews:updated', {
            detail: { productId: reviewItem.productId },
          })
        );
      }
    } catch (err: unknown) {
      console.error('Error saving review', err);
      const errorMessage = err instanceof AxiosError && err.response?.data?.message
        ? err.response.data.message
        : err instanceof Error
        ? err.message
        : 'Unable to save review right now.';
      showErrorToast(errorMessage);
      throw err;
    }
  };

  const formatPrice = (priceInKobo: number) => formatNgnFromKobo(priceInKobo, { maximumFractionDigits: 2 });

  const activeStepIndex = useMemo(() => {
    if (!order) return 0;
    const statusOrder = ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const idx = statusOrder.indexOf(order.status);
    return idx >= 0 ? idx : 0;
  }, [order]);

  // Buyer can confirm delivery when order is out for delivery (package arrived)
  const canConfirm = useMemo(() => {
    return order?.status === 'OUT_FOR_DELIVERY';
  }, [order]);

  // Check if order can be canceled
  const canCancel = useMemo(() => {
    return order && ['PENDING_PAYMENT', 'PAID', 'PROCESSING'].includes(order.status);
  }, [order]);

  // Check if order can be refunded (not if they already requested refund or left a product review)
  const canRefund = useMemo(() => {
    if (!order || hasRefund) return false;
    const hasReviewedAny = order.items.some((item) => reviewedProducts[item.productId]);
    if (hasReviewedAny) return false;
    return ['PAID', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status);
  }, [order, hasRefund, reviewedProducts]);

  // Handle marking order as received → then rider rating → then product reviews
  const handleMarkAsReceived = async () => {
    if (!order) return;

    try {
      setMarking(true);
      const response = await apiClient.put(`/orders/${order.id}/confirm`);
      const updatedOrder = response.data.data || response.data;
      setOrder(updatedOrder);
      showSuccessToast('Order marked as received!');
      // Open rider rating modal if delivery had a rider; after submit we open product review
      if (updatedOrder.delivery?.id && updatedOrder.delivery?.riderId) {
        setRiderRatingModalOpen(true);
      } else if (updatedOrder.items?.length > 0) {
        const first = updatedOrder.items.find((item: OrderItem) => !reviewedProducts[item.productId]);
        if (first) {
          setReviewItem(first);
          setReviewModalOpen(true);
        }
      }
    } catch (err: unknown) {
      console.error('Error marking order as received:', err);
      const errorMessage = err instanceof AxiosError && err.response?.data?.message
        ? err.response.data.message
        : 'Failed to mark order as received';
      showErrorToast(errorMessage);
    } finally {
      setMarking(false);
    }
  };

  // Handle canceling order
  const handleCancelOrder = async () => {
    if (!order) return;

    const confirmed = await confirmation.confirm({
      title: 'Cancel Order',
      message: 'Are you sure you want to cancel this order?',
      confirmText: 'Cancel Order',
      cancelText: 'Keep Order',
      variant: 'warning',
    });

    if (!confirmed) return;

    try {
      setCanceling(true);
      confirmation.setLoading(true);
      await apiClient.put(`/orders/${order.id}/cancel`);
      showSuccessToast('Order canceled successfully');
      // Refresh order details
      await fetchOrder(order.id);
    } catch (err: unknown) {
      console.error('Error canceling order:', err);
      const errorMessage = err instanceof AxiosError && err.response?.data?.message
        ? err.response.data.message
        : 'Failed to cancel order';
      showErrorToast(errorMessage);
    } finally {
      setCanceling(false);
      confirmation.setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Order Detail - Buyer | Carryofy</title>
        <meta name="description" content="View order details, timeline, and delivery status." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <BuyerLayout>
        <div>
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Link
                  href="/buyer/orders"
                  className="inline-flex items-center gap-2 text-[#ffcc99]/80 hover:text-[#ffcc99] transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Orders
                </Link>
              </div>
              <h1 className="text-white text-3xl md:text-4xl font-bold mb-2">Order Details</h1>
              <p className="text-[#ffcc99] text-lg">Keep track of your purchase and manage the next steps.</p>
            </div>
            {order && (
              <div className="flex flex-wrap items-center gap-3">
                {statusBadge(order.status)}
                {paymentVerifying && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Confirming payment…
                  </span>
                )}
                <span className="text-[#ffcc99]/70 text-sm">Order ID: {order.id}</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-[#ff6600] animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => typeof id === 'string' && fetchOrder(id)}
                className="px-6 py-3 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition"
              >
                Retry
              </button>
            </div>
          ) : order ? (
            <div className="space-y-6">
              {/* Overview cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-5">
                  <p className="text-[#ffcc99]/70 text-sm">Order placed</p>
                  <p className="text-white text-xl font-bold mt-2">{formatDateTime(order.createdAt)}</p>
                  <p className="text-[#ffcc99]/60 text-xs mt-2">
                    We&apos;ll keep you posted on every update.
                  </p>
                </div>
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-5">
                  <p className="text-[#ffcc99]/70 text-sm">Total amount</p>
                  <p className="text-[#ff6600] text-2xl font-bold mt-2">{formatPrice(order.amount)}</p>
                  <p className="text-[#ffcc99]/60 text-xs mt-2">
                    Charges captured at checkout.
                  </p>
                </div>
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-5">
                  <p className="text-[#ffcc99]/70 text-sm">Paystack reference</p>
                  <p className="text-white text-lg font-semibold mt-2">
                    {order.paystackReference ?? order.paymentRef ?? 'Pending'}
                  </p>
                  <p className="text-[#ffcc99]/60 text-xs mt-2">
                    Save this reference if you need to contact support.
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                <h2 className="text-white text-xl font-bold mb-6">Order Timeline</h2>
                <div className="relative">
                  <div className="absolute left-5 top-4 bottom-4 w-1 bg-[#ff6600]/30" aria-hidden />
                  <div className="space-y-6">
                    {ORDER_STEPS.map((step, index) => {
                      const isActive = index <= activeStepIndex;
                      const isLast = index === ORDER_STEPS.length - 1;

                      if (order.status === 'CANCELED' && index > 2) {
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
                              {index < activeStepIndex ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : index === activeStepIndex ? (
                                <Truck className="w-5 h-5" />
                              ) : (
                                <Clock className="w-5 h-5" />
                              )}
                            </div>
                            {!isLast && <div className="flex-1 w-px bg-[#ff6600]/30" aria-hidden />}
                          </div>
                          <div className="pb-6">
                            <h3 className={`text-lg font-bold ${isActive ? 'text-white' : 'text-[#ffcc99]'}`}>
                              {step.label}
                            </h3>
                            <p className="text-[#ffcc99]/80 text-sm leading-relaxed">{step.description}</p>
                          </div>
                        </div>
                      );
                    })}

                    {order.status === 'CANCELED' && (
                      <div className="relative flex gap-6">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 bg-red-500 border-red-500 text-white">
                            <XCircle className="w-5 h-5" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">Order Canceled</h3>
                          <p className="text-[#ffcc99]/80 text-sm">
                            This order was canceled. If you still need the items, you can place a new order.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions and summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-white text-xl font-bold">Items in this Order</h2>
                      <span className="text-[#ffcc99]/70 text-sm">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex gap-4 items-start">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-black flex-shrink-0">
                            {item.product.images?.[0] ? (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#ffcc99]">
                                <Package className="w-7 h-7" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/buyer/products/${item.product.id}`}
                              className="text-white font-semibold hover:text-[#ff6600] transition block mb-1"
                            >
                              {item.product.title}
                            </Link>
                            {item.product.seller?.businessName && (
                              <p className="text-[#ffcc99]/70 text-sm mb-1">
                                Seller: {item.product.seller.businessName}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-[#ffcc99]/70">Qty: {item.quantity}</span>
                              <span className="text-[#ff6600] font-bold">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {refundInfo ? (
                    <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                      <h2 className="text-white text-xl font-bold mb-2">Refund Timeline</h2>
                      <p className="text-[#ffcc99]/70 text-sm mb-6">
                        Refunds can take time to process depending on your bank and the payment provider.
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {(['REQUESTED', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED'] as const).map((step) => {
                          const isActive =
                            refundInfo.status === step ||
                            (refundInfo.status === 'COMPLETED' && step !== 'REJECTED') ||
                            (refundInfo.status === 'PROCESSING' &&
                              ['REQUESTED', 'APPROVED', 'PROCESSING'].includes(step)) ||
                            (refundInfo.status === 'APPROVED' && ['REQUESTED', 'APPROVED'].includes(step)) ||
                            (refundInfo.status === 'REQUESTED' && step === 'REQUESTED') ||
                            (refundInfo.status === 'REJECTED' &&
                              ['REQUESTED', 'APPROVED', 'PROCESSING', 'REJECTED'].includes(step));

                          const tone =
                            step === 'REJECTED'
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : step === 'COMPLETED'
                              ? 'bg-green-500/10 text-green-400 border-green-500/30'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30';

                          return (
                            <span
                              key={step}
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
                                isActive ? tone : 'bg-black border-[#ff6600]/30 text-[#ffcc99]/60'
                              }`}
                            >
                              {step}
                            </span>
                          );
                        })}
                      </div>
                      <p className="text-[#ffcc99]/60 text-xs mt-4">
                        Last updated: {refundInfo.updatedAt ? formatDateTime(refundInfo.updatedAt) : '—'}
                      </p>
                    </div>
                  ) : null}

                  <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                    <h2 className="text-white text-xl font-bold mb-3">Delivery Information</h2>
                    <div className="text-[#ffcc99]/80 text-sm space-y-2">
                      {order.delivery ? (
                        <>
                          <p className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-[#ff6600]" />
                            Status: <span className="text-white font-medium">{order.delivery.status}</span>
                          </p>
                          {order.delivery.trackingNumber && (
                            <p className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-[#ff6600]" />
                              Tracking: <span className="text-white">{order.delivery.trackingNumber}</span>
                            </p>
                          )}
                          {order.delivery.eta && (
                            <p className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-[#ff6600]" />
                              Estimated arrival: <span className="text-white">{formatDateTime(order.delivery.eta)}</span>
                            </p>
                          )}
                        </>
                      ) : (
                        <p>No live delivery updates yet. We will update you once your package is on the move.</p>
                      )}
                      <div className="pt-3 border-t border-[#ff6600]/20">
                        <p>Delivery address is managed under your saved addresses. Ensure your preferred location is up to date before placing your next order.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 lg:sticky lg:top-6">
                    <h2 className="text-white text-xl font-bold mb-4">Order Summary</h2>
                    <div className="space-y-3 text-sm text-[#ffcc99]/80">
                      <div className="flex items-center justify-between">
                        <span>Subtotal</span>
                        <span className="text-white font-semibold">{formatPrice(order.amount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Shipping</span>
                        <span className="text-white font-semibold">Calculated at checkout</span>
                      </div>
                      <div className="border-t border-[#ff6600]/20 pt-3 flex items-center justify-between">
                        <span className="text-white font-bold">Total paid</span>
                        <span className="text-[#ff6600] text-xl font-bold">{formatPrice(order.amount)}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-3">
                      {canConfirm && (
                        <button
                          onClick={handleMarkAsReceived}
                          disabled={marking}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {marking ? 'Confirming...' : 'Mark as received'}
                        </button>
                      )}
                      {canRefund && (
                        <button
                          onClick={() => setRefundModalOpen(true)}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl font-bold hover:bg-blue-500/20 hover:border-blue-500 transition"
                        >
                          <Gift className="w-4 h-4" />
                          Request Refund
                        </button>
                      )}
                      {hasRefund && (
                        <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl font-semibold">
                          <Gift className="w-4 h-4" />
                          Refund Requested
                        </div>
                      )}
                      {canCancel && (
                        <button
                          onClick={handleCancelOrder}
                          disabled={canceling}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl font-bold hover:bg-red-500/20 hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <XCircle className="w-4 h-4" />
                          {canceling ? 'Canceling...' : 'Cancel Order'}
                        </button>
                      )}
                    </div>
                  </div>

                  {pendingReviewItems.length > 0 && (
                    <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 space-y-4">
                      <div>
                        <h2 className="text-white text-xl font-bold">How was everything?</h2>
                        <p className="text-[#ffcc99]/80 text-sm">
                          Share quick feedback on items you received to help other buyers.
                        </p>
                      </div>
                      <div className="space-y-3">
                        {pendingReviewItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-3 border border-[#ff6600]/20 rounded-lg px-4 py-3">
                            <div>
                              <p className="text-white text-sm font-semibold">{item.product.title}</p>
                              <p className="text-[#ffcc99]/60 text-xs">Qty {item.quantity}</p>
                            </div>
                            <button
                              onClick={() => handleOpenReview(item)}
                              className="inline-flex items-center gap-2 rounded-lg border border-[#ff6600]/40 px-3 py-2 text-xs font-semibold text-[#ff6600] hover:bg-[#ff6600]/15 transition"
                            >
                              Share review
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                    <h2 className="text-white text-xl font-bold mb-3">Invoice</h2>
                    <p className="text-[#ffcc99]/80 text-sm mb-4">
                      Download your invoice for this order. The invoice will open in a new window where you can print or save as PDF.
                    </p>
                    <button
                      onClick={async () => {
                        if (!tokenManager.getAccessToken()) {
                          showErrorToast('Please log in to download invoice');
                          return;
                        }
                        try {
                          const response = await apiClient.get(`/orders/${order.id}/invoice`, {
                            responseType: 'text',
                          });
                          const html = typeof response.data === 'string' ? response.data : (response.data as any)?.data ?? '';
                          if (!html) {
                            showErrorToast('Invoice could not be loaded.');
                            return;
                          }
                          const win = window.open('', '_blank');
                          if (win) {
                            win.document.write(html);
                            win.document.close();
                          } else {
                            showErrorToast('Please allow pop-ups to view the invoice.');
                          }
                        } catch (err: unknown) {
                          const msg = err && typeof err === 'object' && err !== null && 'response' in err
                            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                            : null;
                          showErrorToast(msg || 'Failed to load invoice.');
                        }
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition"
                    >
                      <Download className="w-4 h-4" />
                      Download Invoice
                    </button>
                  </div>

                  <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                    <h2 className="text-white text-xl font-bold mb-3">Need help?</h2>
                    <p className="text-[#ffcc99]/80 text-sm mb-4">
                      If something doesn&apos;t look right, contact our support team and we&apos;ll jump in to assist.
                    </p>
                    <Link
                      href="/buyer/help"
                      className="inline-flex items-center gap-2 px-4 py-3 bg-[#ff6600]/10 border border-[#ff6600]/30 text-[#ff6600] rounded-xl hover:bg-[#ff6600]/20 hover:border-[#ff6600] transition text-sm font-semibold"
                    >
                      <Eye className="w-4 h-4" />
                      Open support center
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </BuyerLayout>

      {order?.delivery?.id && (
        <RiderRatingModal
          open={riderRatingModalOpen}
          riderName={order.delivery.rider?.name}
          onClose={() => setRiderRatingModalOpen(false)}
          onSubmit={async (rating, comment) => {
            await apiClient.post(`/delivery/${order.delivery!.id}/rate-rider`, { rating, comment });
            showSuccessToast('Thanks for rating your rider!');
            setRiderRatingModalOpen(false);
            const first = order.items?.find((item) => !reviewedProducts[item.productId]);
            if (first) {
              setReviewItem(first);
              setReviewModalOpen(true);
            }
          }}
        />
      )}

      <SubmitReviewModal
        open={reviewModalOpen}
        productTitle={reviewItem?.product.title || ''}
        productId={reviewItem?.productId || ''}
        onClose={() => setReviewModalOpen(false)}
        onSubmit={async (rating, comment) => {
          await handleSubmitReview(rating, comment);
          setReviewModalOpen(false);
          if (!order?.items?.length || !reviewItem) return;
          const currentIdx = order.items.findIndex((i) => i.productId === reviewItem.productId);
          const nextItem = order.items[currentIdx + 1];
          if (nextItem) {
            setReviewItem(nextItem);
            setReviewModalOpen(true);
          }
        }}
      />

      {order && (
        <RefundRequestModal
          open={refundModalOpen}
          orderId={order.id}
          orderAmount={order.amount}
          onClose={() => setRefundModalOpen(false)}
          onSuccess={() => {
            setHasRefund(true);
            fetchOrder(order.id);
          }}
        />
      )}
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

