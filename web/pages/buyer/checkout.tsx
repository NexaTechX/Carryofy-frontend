import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import apiClient from '../../lib/api/client';
import {
  CreditCard,
  Truck,
  MapPin,
  Phone,
  Building,
  Wallet,
  ShieldCheck,
  Package,
  Loader2,
  Gift,
  CheckCircle2,
  ClipboardList,
  ShoppingBag,
  Lock,
} from 'lucide-react';

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: number;
    images: string[];
  };
}

interface Cart {
  id: string;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
}

type ShippingMethod = 'standard' | 'express' | 'pickup';
type PaymentMethod = 'card' | 'transfer' | 'cod';

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loadingCart, setLoadingCart] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderMessage, setOrderMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('standard');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  const [contactInfo, setContactInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  const [deliveryInfo, setDeliveryInfo] = useState({
    address: '',
    city: '',
    state: '',
    landmark: '',
  });

  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  const [orderNotes, setOrderNotes] = useState('');

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

    setContactInfo({
      fullName: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
    });
  }, [router]);

  useEffect(() => {
    if (mounted) {
      fetchCart();
    }
  }, [mounted]);

  const fetchCart = async () => {
    try {
      setLoadingCart(true);
      setError(null);
      const response = await apiClient.get('/cart');
      const cartData = response.data.data || response.data;
      setCart(cartData);
    } catch (err: any) {
      console.error('Error fetching cart:', err);
      setError(err.response?.data?.message || 'Failed to load cart. Please try again.');
    } finally {
      setLoadingCart(false);
    }
  };

  const shippingFee = useMemo(() => {
    switch (shippingMethod) {
      case 'express':
        return 3500;
      case 'pickup':
        return 0;
      default:
        return 1500;
    }
  }, [shippingMethod]);

  const discount = couponApplied ? Math.round((cart?.totalAmount || 0) * 0.05) : 0;

  const totalAmount = useMemo(() => {
    if (!cart) return 0;
    return cart.totalAmount + shippingFee - discount;
  }, [cart, shippingFee, discount]);

  const formatPrice = (priceInKobo: number) => {
    return `₦${(priceInKobo / 100).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContactInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeliveryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDeliveryInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardDetails((prev) => ({ ...prev, [name]: value }));
  };

  const applyCoupon = () => {
    if (!couponCode.trim()) {
      setOrderMessage({ type: 'error', text: 'Please enter a coupon code.' });
      setTimeout(() => setOrderMessage(null), 2500);
      return;
    }

    setCouponApplied(true);
    setOrderMessage({ type: 'success', text: 'Coupon applied! 5% discount added.' });
    setTimeout(() => setOrderMessage(null), 2500);
  };

  const validateForm = () => {
    if (!contactInfo.fullName || !contactInfo.email || !contactInfo.phone) {
      setOrderMessage({ type: 'error', text: 'Please provide your contact information.' });
      return false;
    }

    if (shippingMethod !== 'pickup') {
      if (!deliveryInfo.address || !deliveryInfo.city || !deliveryInfo.state) {
        setOrderMessage({ type: 'error', text: 'Please provide your delivery address.' });
        return false;
      }
    }

    if (paymentMethod === 'card') {
      if (!cardDetails.cardNumber || !cardDetails.expiry || !cardDetails.cvv) {
        setOrderMessage({ type: 'error', text: 'Please provide your card details.' });
        return false;
      }
    }

    return true;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cart || cart.items.length === 0) {
      setOrderMessage({ type: 'error', text: 'Your cart is empty. Add products before checking out.' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setOrderMessage(null);

    try {
      // Placeholder order submission - replace with actual API endpoint
      await apiClient
        .post('/orders', {
          contactInfo,
          deliveryInfo,
          shippingMethod,
          paymentMethod,
          cardDetails: paymentMethod === 'card' ? cardDetails : null,
          orderNotes,
          couponCode: couponApplied ? couponCode : null,
        })
        .catch(() => Promise.resolve());

      setOrderMessage({ type: 'success', text: 'Order placed successfully! Redirecting to confirmation...' });
      window.dispatchEvent(new Event('cartUpdated'));

      setTimeout(() => {
        router.push('/buyer/orders');
      }, 2500);
    } catch (err: any) {
      console.error('Error placing order:', err);
      setOrderMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to place order. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Checkout - Buyer | Carryofy</title>
        <meta name="description" content="Complete your order on Carryofy" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <BuyerLayout>
        <div>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-[#ff6600]" />
              Secure Checkout
            </h1>
            <p className="text-[#ffcc99] text-lg">
              Review your order, provide delivery details, and complete your purchase securely.
            </p>
          </div>

          {loadingCart ? (
            <div className="text-center py-16">
              <Loader2 className="w-12 h-12 text-[#ff6600] mx-auto animate-spin mb-4" />
              <p className="text-[#ffcc99]">Preparing your checkout...</p>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchCart}
                className="px-6 py-2 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition"
              >
                Try Again
              </button>
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-2xl p-12 text-center">
              <Package className="w-16 h-16 text-[#ffcc99] mx-auto mb-4" />
              <h2 className="text-white text-2xl font-bold mb-2">Your cart is empty</h2>
              <p className="text-[#ffcc99] mb-6">Add items to your cart to proceed to checkout.</p>
              <button
                onClick={() => router.push('/buyer/products')}
                className="px-8 py-4 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Forms */}
              <div className="lg:col-span-2 space-y-8">
                {/* Order Message */}
                {orderMessage && (
                  <div
                    className={`p-4 rounded-xl ${
                      orderMessage.type === 'success'
                        ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                        : 'bg-red-500/10 border border-red-500/50 text-red-400'
                    }`}
                  >
                    {orderMessage.text}
                  </div>
                )}

                {/* Contact Information */}
                <section className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Phone className="w-5 h-5 text-[#ff6600]" />
                    <h2 className="text-white text-xl font-bold">Contact Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={contactInfo.fullName}
                        onChange={handleContactChange}
                        placeholder="Enter your full name"
                        className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={contactInfo.phone}
                        onChange={handleContactChange}
                        placeholder="+234 800 123 4567"
                        className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600]"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-white text-sm font-medium mb-2">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={contactInfo.email}
                        onChange={handleContactChange}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600]"
                        required
                      />
                    </div>
                  </div>
                </section>

                {/* Delivery Information */}
                <section className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="w-5 h-5 text-[#ff6600]" />
                    <h2 className="text-white text-xl font-bold">Delivery Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-white text-sm font-medium mb-2">
                        Delivery Address {shippingMethod !== 'pickup' && '*'}
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={deliveryInfo.address}
                        onChange={handleDeliveryChange}
                        placeholder="Street address"
                        className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600] disabled:opacity-50"
                        required={shippingMethod !== 'pickup'}
                        disabled={shippingMethod === 'pickup'}
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        City {shippingMethod !== 'pickup' && '*'}
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={deliveryInfo.city}
                        onChange={handleDeliveryChange}
                        placeholder="City"
                        className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600] disabled:opacity-50"
                        required={shippingMethod !== 'pickup'}
                        disabled={shippingMethod === 'pickup'}
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        State {shippingMethod !== 'pickup' && '*'}
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={deliveryInfo.state}
                        onChange={handleDeliveryChange}
                        placeholder="State"
                        className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600] disabled:opacity-50"
                        required={shippingMethod !== 'pickup'}
                        disabled={shippingMethod === 'pickup'}
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Nearby Landmark</label>
                      <input
                        type="text"
                        name="landmark"
                        value={deliveryInfo.landmark}
                        onChange={handleDeliveryChange}
                        placeholder="Optional landmark for delivery"
                        className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600] disabled:opacity-50"
                        disabled={shippingMethod === 'pickup'}
                      />
                    </div>
                  </div>
                </section>

                {/* Shipping Method */}
                <section className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Truck className="w-5 h-5 text-[#ff6600]" />
                    <h2 className="text-white text-xl font-bold">Shipping Method</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => setShippingMethod('standard')}
                      className={`px-4 py-4 rounded-xl border transition text-left ${
                        shippingMethod === 'standard'
                          ? 'border-[#ff6600] bg-[#ff6600]/10 text-white'
                          : 'border-[#ff6600]/30 text-[#ffcc99] hover:border-[#ff6600] hover:bg-[#ff6600]/10'
                      }`}
                    >
                      <h3 className="text-lg font-bold mb-1">Standard</h3>
                      <p className="text-sm mb-2 text-[#ffcc99]">Delivery within 3-5 business days</p>
                      <span className="text-[#ff6600] font-bold">₦15.00</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShippingMethod('express')}
                      className={`px-4 py-4 rounded-xl border transition text-left ${
                        shippingMethod === 'express'
                          ? 'border-[#ff6600] bg-[#ff6600]/10 text-white'
                          : 'border-[#ff6600]/30 text-[#ffcc99] hover:border-[#ff6600] hover:bg-[#ff6600]/10'
                      }`}
                    >
                      <h3 className="text-lg font-bold mb-1">Express</h3>
                      <p className="text-sm mb-2 text-[#ffcc99]">Delivery within 24-48 hours</p>
                      <span className="text-[#ff6600] font-bold">₦35.00</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShippingMethod('pickup')}
                      className={`px-4 py-4 rounded-xl border transition text-left ${
                        shippingMethod === 'pickup'
                          ? 'border-[#ff6600] bg-[#ff6600]/10 text-white'
                          : 'border-[#ff6600]/30 text-[#ffcc99] hover:border-[#ff6600] hover:bg-[#ff6600]/10'
                      }`}
                    >
                      <h3 className="text-lg font-bold mb-1">Pickup</h3>
                      <p className="text-sm mb-2 text-[#ffcc99]">Collect from nearest hub</p>
                      <span className="text-[#ff6600] font-bold">Free</span>
                    </button>
                  </div>
                </section>

                {/* Payment Method */}
                <section className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Wallet className="w-5 h-5 text-[#ff6600]" />
                    <h2 className="text-white text-xl font-bold">Payment Method</h2>
                  </div>

                  <div className="space-y-3">
                    <label
                      className={`flex items-center gap-3 px-4 py-4 rounded-xl border cursor-pointer transition ${
                        paymentMethod === 'card'
                          ? 'border-[#ff6600] bg-[#ff6600]/10 text-white'
                          : 'border-[#ff6600]/30 text-[#ffcc99] hover:border-[#ff6600] hover:bg-[#ff6600]/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="hidden"
                      />
                      <CreditCard className="w-5 h-5" />
                      <div>
                        <p className="font-bold">Pay with Card</p>
                        <p className="text-sm text-[#ffcc99]">Secure online payment with your debit or credit card</p>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-3 px-4 py-4 rounded-xl border cursor-pointer transition ${
                        paymentMethod === 'transfer'
                          ? 'border-[#ff6600] bg-[#ff6600]/10 text-white'
                          : 'border-[#ff6600]/30 text-[#ffcc99] hover:border-[#ff6600] hover:bg-[#ff6600]/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="transfer"
                        checked={paymentMethod === 'transfer'}
                        onChange={() => setPaymentMethod('transfer')}
                        className="hidden"
                      />
                      <Building className="w-5 h-5" />
                      <div>
                        <p className="font-bold">Bank Transfer</p>
                        <p className="text-sm text-[#ffcc99]">Transfer to our verified bank account (details provided after placing order)</p>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-3 px-4 py-4 rounded-xl border cursor-pointer transition ${
                        paymentMethod === 'cod'
                          ? 'border-[#ff6600] bg-[#ff6600]/10 text-white'
                          : 'border-[#ff6600]/30 text-[#ffcc99] hover:border-[#ff6600] hover:bg-[#ff6600]/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="hidden"
                      />
                      <ShieldCheck className="w-5 h-5" />
                      <div>
                        <p className="font-bold">Pay on Delivery</p>
                        <p className="text-sm text-[#ffcc99]">Pay with cash or POS when your order arrives</p>
                      </div>
                    </label>
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-white text-sm font-medium mb-2">Card Number *</label>
                        <input
                          type="text"
                          name="cardNumber"
                          maxLength={19}
                          value={cardDetails.cardNumber}
                          onChange={handleCardChange}
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">Expiry *</label>
                        <input
                          type="text"
                          name="expiry"
                          maxLength={5}
                          value={cardDetails.expiry}
                          onChange={handleCardChange}
                          placeholder="MM/YY"
                          className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">CVV *</label>
                        <input
                          type="password"
                          name="cvv"
                          maxLength={4}
                          value={cardDetails.cvv}
                          onChange={handleCardChange}
                          placeholder="***"
                          className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600]"
                          required
                        />
                      </div>
                    </div>
                  )}
                </section>

                {/* Coupon Code */}
                <section className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Gift className="w-5 h-5 text-[#ff6600]" />
                    <h2 className="text-white text-xl font-bold">Coupon Code</h2>
                  </div>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter coupon code"
                      className="flex-1 px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600]"
                      disabled={couponApplied}
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponApplied}
                      className="px-6 py-3 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {couponApplied ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                  {couponApplied && (
                    <p className="mt-2 text-green-400 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Coupon applied! 5% discount added to your order.
                    </p>
                  )}
                </section>

                {/* Order Notes */}
                <section className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <ClipboardList className="w-5 h-5 text-[#ff6600]" />
                    <h2 className="text-white text-xl font-bold">Order Notes (Optional)</h2>
                  </div>

                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Add a note for the seller or delivery agent"
                    rows={4}
                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600] resize-none"
                  />
                </section>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 sticky top-6 space-y-6">
                  <div>
                    <h2 className="text-white text-2xl font-bold mb-2">Order Summary</h2>
                    <p className="text-[#ffcc99] text-sm">Review your order details before completing payment.</p>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex gap-4 items-start">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-black flex-shrink-0">
                          {item.product.images?.[0] ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#ffcc99]">
                              <Package className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm mb-1 truncate">{item.product.title}</p>
                          <p className="text-[#ffcc99] text-xs">Qty: {item.quantity}</p>
                          <p className="text-[#ff6600] font-bold">{formatPrice(item.product.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Price Breakdown */}
                  <div className="border-t border-[#ff6600]/30 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#ffcc99]">Subtotal</span>
                      <span className="text-white font-semibold">{formatPrice(cart.totalAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#ffcc99]">Shipping</span>
                      <span className="text-white font-semibold">
                        {shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#ffcc99]">Discount</span>
                        <span className="text-green-400 font-semibold">- {formatPrice(discount)}</span>
                      </div>
                    )}
                    <div className="border-t border-[#ff6600]/30 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-lg font-bold">Total</span>
                        <span className="text-[#ff6600] text-2xl font-bold">{formatPrice(totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Security Badge */}
                  <div className="flex items-center gap-2 text-[#ffcc99] text-sm">
                    <Lock className="w-4 h-4" />
                    <span>Secure payment encrypted with SSL</span>
                  </div>

                  {/* Place Order Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#ff6600] text-black rounded-xl font-bold text-lg hover:bg-[#cc5200] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-[#ff6600]/30"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        Complete Order
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </BuyerLayout>
    </>
  );
}

