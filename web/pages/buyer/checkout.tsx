import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import apiClient from '../../lib/api/client';
import { validateCoupon } from '../../lib/api/coupons';
import { fetchShippingQuote } from '../../lib/api/shipping';
import {
  Truck,
  MapPin,
  Phone,
  ShieldCheck,
  Package,
  Loader2,
  Gift,
  CheckCircle2,
  ClipboardList,
  Lock,
  ChevronRight,
  ChevronLeft,
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

const STEPS = [
  { id: 1, label: 'Order summary', icon: ClipboardList },
  { id: 2, label: 'Delivery details', icon: MapPin },
  { id: 3, label: 'Confirmation', icon: ShieldCheck },
] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loadingCart, setLoadingCart] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderMessage, setOrderMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('standard');
  const [standardShippingFee, setStandardShippingFee] = useState<number>(0);
  const [expressShippingFee, setExpressShippingFee] = useState<number>(0);
  const [shippingQuoteLoading, setShippingQuoteLoading] = useState(false);
  const [shippingQuoteError, setShippingQuoteError] = useState<string | null>(null);
  const shippingFee = shippingMethod === 'pickup' ? 0 : shippingMethod === 'express' ? expressShippingFee : standardShippingFee;
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponValidating, setCouponValidating] = useState(false);

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

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [saveNewAddress, setSaveNewAddress] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

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
      fetchAddresses();
    }
  }, [mounted]);

  // Fetch shipping quotes for STANDARD and EXPRESS when cart and address available
  useEffect(() => {
    if (!cart?.items?.length) {
      setStandardShippingFee(0);
      setExpressShippingFee(0);
      setShippingQuoteError(null);
      return;
    }
    const addressId = selectedAddressId;
    if (!addressId) {
      setShippingQuoteError('Select address to see shipping cost');
      setStandardShippingFee(0);
      setExpressShippingFee(0);
      return;
    }
    let cancelled = false;
    setShippingQuoteLoading(true);
    setShippingQuoteError(null);
    const items = cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
    Promise.all([
      fetchShippingQuote({ addressId, items, shippingMethod: 'STANDARD' }),
      fetchShippingQuote({ addressId, items, shippingMethod: 'EXPRESS' }),
    ])
      .then(([standardRes, expressRes]) => {
        if (!cancelled) {
          setStandardShippingFee(standardRes.shippingFeeKobo);
          setExpressShippingFee(expressRes.shippingFeeKobo);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setStandardShippingFee(0);
          setExpressShippingFee(0);
          setShippingQuoteError(err.response?.data?.message || 'Could not get shipping quote');
        }
      })
      .finally(() => {
        if (!cancelled) setShippingQuoteLoading(false);
      });
    return () => { cancelled = true; };
  }, [cart?.items, selectedAddressId]);

  const fetchAddresses = async () => {
    // Only fetch addresses if user is authenticated
    if (!tokenManager.isAuthenticated()) {
      setSavedAddresses([]);
      setLoadingAddresses(false);
      return;
    }

    // Check if token exists
    const token = tokenManager.getAccessToken();
    if (!token) {
      setSavedAddresses([]);
      setLoadingAddresses(false);
      return;
    }

    try {
      setLoadingAddresses(true);
      const response = await apiClient.get('/users/me/addresses');
      const addressesData = response.data.data || response.data;
      setSavedAddresses(Array.isArray(addressesData) ? addressesData : []);
      
      // Auto-select first address if available and not showing new address form
      if (addressesData && Array.isArray(addressesData) && addressesData.length > 0 && !selectedAddressId && !showNewAddressForm) {
        const firstAddress = addressesData[0];
        setSelectedAddressId(firstAddress.id);
        // Pre-fill delivery info from selected address
        setDeliveryInfo({
          address: firstAddress.line1 || '',
          city: firstAddress.city || '',
          state: firstAddress.state || '',
          landmark: firstAddress.line2 || '',
        });
      }
    } catch (err: any) {
      // Silently handle errors - addresses are optional for checkout
      // The user can still enter a new address manually
      if (err.response?.status === 400) {
        // Bad request - user info might be missing, but this is not critical
        // User can still proceed with manual address entry
        console.warn('Could not fetch saved addresses:', err.response?.data?.message || 'User information missing');
      } else if (err.response?.status === 401) {
        // Unauthorized - token might be expired, but user is already on checkout page
        console.warn('Authentication issue when fetching addresses');
      } else {
        console.error('Error fetching addresses:', err);
      }
      
      // Don't show error to user - addresses are optional
      // Just continue with empty addresses array
      setSavedAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    const selectedAddress = savedAddresses.find(addr => addr.id === addressId);
    if (selectedAddress) {
      setDeliveryInfo({
        address: selectedAddress.line1 || '',
        city: selectedAddress.city || '',
        state: selectedAddress.state || '',
        landmark: selectedAddress.line2 || '',
      });
    }
  };

  const handleCreateNewAddress = () => {
    setSelectedAddressId(null);
    setShowNewAddressForm(true);
    setDeliveryInfo({
      address: '',
      city: '',
      state: '',
      landmark: '',
    });
  };

  const handleSelectSavedAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    setShowNewAddressForm(false);
    handleAddressSelect(addressId);
  };

  const fetchCart = async () => {
    try {
      setLoadingCart(true);
      setError(null);
      
      // Check authentication first
      if (!tokenManager.isAuthenticated()) {
        setError('Please log in to view your cart.');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
        return;
      }
      
      const response = await apiClient.get('/cart');
      const cartData = response.data.data || response.data;
      setCart(cartData);
    } catch (err: any) {
      console.error('Error fetching cart:', err);
      console.error('Error details:', {
        code: err.code,
        message: err.message,
        response: err.response,
        config: err.config,
      });
      
      // Handle network errors specifically
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error' || err.code === 'ECONNREFUSED') {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com/api/v1';
        const fullUrl = `${apiBase}/cart`;
        
        setError(
          `Cannot connect to backend server.\n\n` +
          `API URL: ${fullUrl}\n\n` +
          `Please check:\n` +
          `1. Backend server is running (cd apps/api && npm run start:dev)\n` +
          `2. Backend is on port 3000\n` +
          `3. Environment variable NEXT_PUBLIC_API_BASE is set correctly\n` +
          `4. No firewall is blocking the connection`
        );
      } else if (err.response?.status === 401) {
        // Unauthorized - token might be expired
        setError('Your session has expired. Redirecting to login...');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load cart. Please try again.');
      }
    } finally {
      setLoadingCart(false);
    }
  };

  const discount = couponDiscount;

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

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setOrderMessage({ type: 'error', text: 'Please enter a coupon code.' });
      setTimeout(() => setOrderMessage(null), 2500);
      return;
    }

    if (!cart || cart.items.length === 0) {
      setOrderMessage({ type: 'error', text: 'Cart is empty.' });
      setTimeout(() => setOrderMessage(null), 2500);
      return;
    }

    try {
      setCouponValidating(true);
      setOrderMessage(null);
      
      const subtotal = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const result = await validateCoupon({
        code: couponCode.trim(),
        orderAmount: subtotal,
      });

      if (result.valid) {
        setCouponApplied(true);
        setCouponDiscount(result.discountAmount);
        setOrderMessage({ 
          type: 'success', 
          text: result.message || `Coupon applied! Discount: ₦${(result.discountAmount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
        });
        setTimeout(() => setOrderMessage(null), 3000);
      } else {
        setCouponApplied(false);
        setCouponDiscount(0);
        setOrderMessage({ 
          type: 'error', 
          text: result.message || 'Invalid coupon code' 
        });
        setTimeout(() => setOrderMessage(null), 3000);
      }
    } catch (err: any) {
      console.error('Error validating coupon:', err);
      setCouponApplied(false);
      setCouponDiscount(0);
      setOrderMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to validate coupon code' 
      });
      setTimeout(() => setOrderMessage(null), 3000);
    } finally {
      setCouponValidating(false);
    }
  };

  const validateForm = () => {
    if (!contactInfo.fullName || !contactInfo.email || !contactInfo.phone) {
      setOrderMessage({ type: 'error', text: 'Please provide your contact information.' });
      return false;
    }

    // Validate phone number format
    if (contactInfo.phone) {
      const cleaned = contactInfo.phone.replace(/[\s-]/g, '');
      if (!/^\+[1-9]\d{9,14}$/.test(cleaned)) {
        setOrderMessage({ 
          type: 'error', 
          text: 'Phone number must be in international format (e.g., +2348012345678)' 
        });
        return false;
      }
    }

    if (shippingMethod !== 'pickup') {
      if (!selectedAddressId) {
        if (!deliveryInfo.address || !deliveryInfo.city || !deliveryInfo.state) {
          setOrderMessage({ type: 'error', text: 'Please provide your delivery address or select a saved address.' });
          return false;
        }
      }
    }

    return true;
  };

  const goToStep = (step: 1 | 2 | 3) => {
    if (step === 2 && currentStep === 1) {
      setOrderMessage(null);
      setCurrentStep(2);
    } else if (step === 3 && currentStep === 2) {
      if (!validateForm()) return;
      setOrderMessage(null);
      setCurrentStep(3);
    } else if (step < currentStep) {
      setCurrentStep(step);
    }
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
      // Step 1: Create or get address
      let addressId: string;
      
      if (shippingMethod !== 'pickup') {
        // Use selected address if available, otherwise create new one
        if (selectedAddressId) {
          addressId = selectedAddressId;
        } else {
          // Validate required fields before creating address
          if (!deliveryInfo.address?.trim() || !deliveryInfo.city?.trim() || !deliveryInfo.state?.trim()) {
            setOrderMessage({ 
              type: 'error', 
              text: 'Please provide complete delivery address (address, city, and state).' 
            });
            setSubmitting(false);
            return;
          }

          try {
            // Create address from delivery info
            const addressData = {
              label: deliveryInfo.city ? `${deliveryInfo.city} Address` : 'Delivery Address',
              line1: deliveryInfo.address.trim(),
              line2: deliveryInfo.landmark?.trim() || undefined,
              city: deliveryInfo.city.trim(),
              state: deliveryInfo.state.trim(),
              country: 'Nigeria',
            };
            
            const addressResponse = await apiClient.post('/users/me/addresses', addressData);
            addressId = addressResponse.data.id || addressResponse.data.data?.id;
            
            if (!addressId) {
              throw new Error('Failed to create address: No address ID returned');
            }

            // If user wants to save the address, it's already saved above
            // If not, we still need the addressId for the order, but we could delete it after
            // For now, we'll always save it since it's useful for the user
            if (saveNewAddress) {
              // Refresh addresses list
              await fetchAddresses();
            }
          } catch (err: any) {
            console.error('Error creating address:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to create delivery address. Please try again.';
            setOrderMessage({ 
              type: 'error', 
              text: errorMessage 
            });
            setSubmitting(false);
            return;
          }
        }
      } else {
        // For pickup, use selected address or create a minimal one
        if (selectedAddressId) {
          addressId = selectedAddressId;
        } else {
          try {
            const addressResponse = await apiClient.post('/users/me/addresses', {
              label: 'Pickup Location',
              line1: 'Store Pickup',
              city: 'Lagos',
              state: 'Lagos',
              country: 'Nigeria',
            });
            addressId = addressResponse.data.id || addressResponse.data.data?.id;
            
            if (!addressId) {
              throw new Error('Failed to create address: No address ID returned');
            }
          } catch (err: any) {
            console.error('Error creating pickup address:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to create pickup address. Please try again.';
            setOrderMessage({ 
              type: 'error', 
              text: errorMessage 
            });
            setSubmitting(false);
            return;
          }
        }
      }

      // Step 2: Create order with cart items
      const orderItems = cart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const orderResponse = await apiClient.post('/orders', {
        addressId,
        items: orderItems,
        shippingMethod: shippingMethod === 'express' ? 'EXPRESS' : shippingMethod === 'pickup' ? 'PICKUP' : 'STANDARD',
        couponCode: couponApplied ? couponCode.trim() || undefined : undefined,
      });

      const orderId = orderResponse.data.id || orderResponse.data.data?.id;

      // Initialize Paystack and redirect to Paystack checkout page
      const paymentInitResponse = await apiClient.post('/payments/initialize', {
        orderId,
      });

      const paymentData = paymentInitResponse.data.data || paymentInitResponse.data;

      if (!paymentData.authorization_url) {
        throw new Error('Failed to initialize payment. Please try again.');
      }

      // Redirect directly to Paystack checkout page; user completes payment there
      window.location.href = paymentData.authorization_url;
      return;
    } catch (err: any) {
      console.error('Error placing order:', err);
      console.error('Error details:', {
        response: err.response,
        data: err.response?.data,
        message: err.message,
      });

      // Handle validation errors (400 Bad Request)
      if (err.response?.status === 400) {
        const errorData = err.response.data;
        console.error('Validation error details:', {
          status: err.response.status,
          data: errorData,
          requestData: err.config?.data ? JSON.parse(err.config.data) : null,
        });
        
        let errorMessage = '';
        
        if (Array.isArray(errorData.message)) {
          // NestJS validation errors are arrays
          errorMessage = errorData.message.join('\n');
        } else if (typeof errorData.message === 'string') {
          errorMessage = errorData.message;
        } else if (errorData.message) {
          errorMessage = String(errorData.message);
        } else {
          errorMessage = 'Invalid data provided. Please check your input and try again.';
        }
        
        setOrderMessage({
          type: 'error',
          text: errorMessage || 'Validation failed. Please check your card details and try again.',
        });
      } else {
        setOrderMessage({
          type: 'error',
          text: err.response?.data?.message || err.message || 'Failed to place order. Please try again.',
        });
      }
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
            <p className="text-[#ffcc99] text-lg mb-4">
              Review your order, provide delivery details, and complete your purchase securely.
            </p>
          </div>

          {loadingCart ? (
            <div className="text-center py-16">
              <Loader2 className="w-12 h-12 text-[#ff6600] mx-auto animate-spin mb-4" />
              <p className="text-[#ffcc99]">Preparing your checkout...</p>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6">
              <div className="text-center mb-4">
                <p className="text-red-400 font-semibold mb-2">Failed to Load Cart</p>
                <p className="text-red-300 text-sm whitespace-pre-line">{error}</p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={fetchCart}
                  className="px-6 py-2 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push('/buyer/products')}
                  className="px-6 py-2 bg-gray-600 text-white rounded-xl font-bold hover:bg-gray-700 transition"
                >
                  Browse Products
                </button>
              </div>
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
            <div className="space-y-8">
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

              {/* Step indicator */}
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                  {STEPS.map((step, index) => {
                    const isActive = currentStep === step.id;
                    const isPast = currentStep > step.id;
                    return (
                      <div key={step.id} className="flex items-center flex-1 last:flex-none">
                        <button
                          type="button"
                          onClick={() => step.id < currentStep && goToStep(step.id as 1 | 2 | 3)}
                          className={`flex items-center gap-2 rounded-xl px-4 py-2 transition ${
                            isActive ? 'bg-[#ff6600]/20 text-[#ff6600] ring-2 ring-[#ff6600]' : isPast ? 'text-[#ff6600] hover:bg-[#ff6600]/10' : 'text-[#ffcc99]/60'
                          } ${step.id < currentStep ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${isActive || isPast ? 'bg-[#ff6600] text-black' : 'bg-[#333] text-[#ffcc99]'}`}>
                            {isPast ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                          </span>
                          <span className="hidden sm:inline font-medium">{step.label}</span>
                        </button>
                        {index < STEPS.length - 1 && (
                          <ChevronRight className={`w-5 h-5 shrink-0 mx-1 ${currentStep > step.id ? 'text-[#ff6600]' : 'text-[#ffcc99]/40'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Step 1: Order summary */}
                {currentStep === 1 && (
                  <>
                    <div className="lg:col-span-2 space-y-6">
                      {/* Cart items + shipping + coupon */}
                      <section className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <ClipboardList className="w-5 h-5 text-[#ff6600]" />
                          <h2 className="text-white text-xl font-bold">Your order</h2>
                        </div>
                        <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                          {cart?.items.map((item) => (
                            <div key={item.id} className="flex gap-4 items-center py-3 border-b border-[#ff6600]/20 last:border-0">
                              <div className="w-14 h-14 rounded-lg overflow-hidden bg-black shrink-0">
                                {item.product.images?.[0] ? (
                                  <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[#ffcc99]"><Package className="w-6 h-6" /></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-sm truncate">{item.product.title}</p>
                                <p className="text-[#ffcc99] text-xs">Qty: {item.quantity}</p>
                              </div>
                              <p className="text-[#ff6600] font-bold">{formatPrice(item.product.price * item.quantity)}</p>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Truck className="w-5 h-5 text-[#ff6600]" />
                          <h2 className="text-white text-xl font-bold">Shipping method</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { id: 'standard' as const, label: 'Standard', desc: '3–5 business days' },
                            { id: 'express' as const, label: 'Express', desc: '24–48 hours' },
                            { id: 'pickup' as const, label: 'Pickup', desc: 'Collect from hub' },
                          ].map((opt) => {
                            const price = opt.id === 'pickup' ? 0 : opt.id === 'express' ? expressShippingFee : standardShippingFee;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setShippingMethod(opt.id)}
                                className={`px-4 py-4 rounded-xl border transition text-left ${
                                  shippingMethod === opt.id ? 'border-[#ff6600] bg-[#ff6600]/10 text-white' : 'border-[#ff6600]/30 text-[#ffcc99] hover:border-[#ff6600] hover:bg-[#ff6600]/10'
                                }`}
                              >
                                <h3 className="text-lg font-bold mb-1">{opt.label}</h3>
                                <p className="text-sm mb-2 text-[#ffcc99]">{opt.desc}</p>
                                <span className="text-[#ff6600] font-bold">
                                  {opt.id === 'pickup' ? 'Free' : shippingQuoteLoading ? (
                                    <span className="flex items-center gap-2">
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Calculating...
                                    </span>
                                  ) : (
                                    formatPrice(price)
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </section>

                      <section className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Gift className="w-5 h-5 text-[#ff6600]" />
                          <h2 className="text-white text-xl font-bold">Coupon code</h2>
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
                            disabled={couponApplied || couponValidating}
                            className="px-6 py-3 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {couponValidating ? 'Validating...' : couponApplied ? 'Applied' : 'Apply'}
                          </button>
                        </div>
                        {couponApplied && (
                          <p className="mt-2 text-green-400 text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Discount: ₦{(couponDiscount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        )}
                      </section>
                    </div>
                    <div className="lg:col-span-1">
                      <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 sticky top-6 space-y-6">
                        <h2 className="text-white text-xl font-bold">Order summary</h2>
                        <div className="space-y-3 border-t border-[#ff6600]/30 pt-4">
                          <div className="flex justify-between"><span className="text-[#ffcc99]">Subtotal</span><span className="text-white font-semibold">{formatPrice(cart?.totalAmount ?? 0)}</span></div>
                          <div className="flex justify-between">
                            <span className="text-[#ffcc99]">Shipping</span>
                            <span className="text-white font-semibold">
                              {shippingQuoteLoading ? (
                                <span className="flex items-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Calculating...
                                </span>
                              ) : shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}
                            </span>
                          </div>
                          {shippingQuoteError && shippingMethod !== 'pickup' && (
                            <p className="text-amber-400 text-xs">{shippingQuoteError}</p>
                          )}
                          {discount > 0 && <div className="flex justify-between"><span className="text-[#ffcc99]">Discount</span><span className="text-green-400 font-semibold">- {formatPrice(discount)}</span></div>}
                          <div className="border-t border-[#ff6600]/30 pt-3 flex justify-between">
                            <span className="text-white font-bold">Total</span><span className="text-[#ff6600] text-xl font-bold">{formatPrice(totalAmount)}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => goToStep(2)}
                          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition"
                        >
                          Continue to delivery <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Step 2: Delivery details */}
                {currentStep === 2 && (
                  <>
                    <div className="lg:col-span-2 space-y-6">
                      <section className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Phone className="w-5 h-5 text-[#ff6600]" />
                          <h2 className="text-white text-xl font-bold">Contact information</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-white text-sm font-medium mb-2">Full name *</label>
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
                            <label className="block text-white text-sm font-medium mb-2">Phone *</label>
                            <input
                              type="tel"
                              name="phone"
                              value={contactInfo.phone}
                              onChange={handleContactChange}
                              placeholder="+234 916 678 3040"
                              className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600]"
                              required
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-white text-sm font-medium mb-2">Email *</label>
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

                      <section className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <MapPin className="w-5 h-5 text-[#ff6600]" />
                          <h2 className="text-white text-xl font-bold">Delivery address</h2>
                        </div>

                        {shippingMethod !== 'pickup' && (
                    <>
                      {/* Saved Addresses Selection */}
                      {loadingAddresses ? (
                        <div className="flex items-center gap-2 text-[#ffcc99]/70 py-3 mb-6">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Loading addresses...</span>
                        </div>
                      ) : savedAddresses.length > 0 && !showNewAddressForm ? (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <label className="block text-white text-sm font-medium">
                              Select Delivery Address
                            </label>
                            <button
                              type="button"
                              onClick={handleCreateNewAddress}
                              className="text-[#ff6600] text-sm font-medium hover:text-[#cc5200] transition flex items-center gap-2"
                            >
                              <MapPin className="w-4 h-4" />
                              Add New Address
                            </button>
                          </div>
                          
                          {/* Address Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {savedAddresses.map((address) => (
                              <button
                                key={address.id}
                                type="button"
                                onClick={() => handleSelectSavedAddress(address.id)}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${
                                  selectedAddressId === address.id
                                    ? 'border-[#ff6600] bg-[#ff6600]/10'
                                    : 'border-[#ff6600]/30 bg-[#0d0d0d] hover:border-[#ff6600]/50'
                                }`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <MapPin className={`w-4 h-4 ${selectedAddressId === address.id ? 'text-[#ff6600]' : 'text-[#ffcc99]'}`} />
                                    <p className="text-white font-semibold text-sm">
                                      {address.label || 'Delivery Address'}
                                    </p>
                                  </div>
                                  {selectedAddressId === address.id && (
                                    <CheckCircle2 className="w-5 h-5 text-[#ff6600]" />
                                  )}
                                </div>
                                <p className="text-[#ffcc99] text-xs mb-1">
                                  {address.line1}
                                  {address.line2 && `, ${address.line2}`}
                                </p>
                                <p className="text-[#ffcc99] text-xs">
                                  {address.city}, {address.state}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* New Address Form */}
                      {showNewAddressForm && (
                        <div className="space-y-4 mb-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-semibold">New Delivery Address</h3>
                            {savedAddresses.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowNewAddressForm(false);
                                  if (savedAddresses.length > 0 && selectedAddressId) {
                                    handleSelectSavedAddress(selectedAddressId);
                                  }
                                }}
                                className="text-[#ffcc99] text-sm hover:text-white transition"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-white text-sm font-medium mb-2">
                                Delivery Address *
                              </label>
                              <input
                                type="text"
                                name="address"
                                value={deliveryInfo.address}
                                onChange={handleDeliveryChange}
                                placeholder="Street address"
                                className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600]"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-white text-sm font-medium mb-2">
                                City *
                              </label>
                              <input
                                type="text"
                                name="city"
                                value={deliveryInfo.city}
                                onChange={handleDeliveryChange}
                                placeholder="City"
                                className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600]"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-white text-sm font-medium mb-2">
                                State *
                              </label>
                              <input
                                type="text"
                                name="state"
                                value={deliveryInfo.state}
                                onChange={handleDeliveryChange}
                                placeholder="State"
                                className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600]"
                                required
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
                                className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600]"
                              />
                            </div>
                          </div>

                          {/* Save Address Checkbox */}
                          <div className="flex items-center gap-2 p-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl">
                            <input
                              type="checkbox"
                              id="saveAddress"
                              checked={saveNewAddress}
                              onChange={(e) => setSaveNewAddress(e.target.checked)}
                              className="w-4 h-4 text-[#ff6600] bg-[#0d0d0d] border-[#ff6600]/30 rounded focus:ring-[#ff6600] focus:ring-2"
                            />
                            <label htmlFor="saveAddress" className="text-[#ffcc99] text-sm cursor-pointer">
                              Save this address for future orders
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Show form if no saved addresses */}
                      {savedAddresses.length === 0 && !showNewAddressForm && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-white text-sm font-medium mb-2">
                                Delivery Address *
                              </label>
                              <input
                                type="text"
                                name="address"
                                value={deliveryInfo.address}
                                onChange={handleDeliveryChange}
                                placeholder="Street address"
                                className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600]"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-white text-sm font-medium mb-2">
                                City *
                              </label>
                              <input
                                type="text"
                                name="city"
                                value={deliveryInfo.city}
                                onChange={handleDeliveryChange}
                                placeholder="City"
                                className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600]"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-white text-sm font-medium mb-2">
                                State *
                              </label>
                              <input
                                type="text"
                                name="state"
                                value={deliveryInfo.state}
                                onChange={handleDeliveryChange}
                                placeholder="State"
                                className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600]"
                                required
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
                                className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600]"
                              />
                            </div>
                          </div>
                          
                          {/* Save Address Checkbox */}
                          <div className="flex items-center gap-2 p-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl">
                            <input
                              type="checkbox"
                              id="saveAddressFirst"
                              checked={saveNewAddress}
                              onChange={(e) => setSaveNewAddress(e.target.checked)}
                              className="w-4 h-4 text-[#ff6600] bg-[#0d0d0d] border-[#ff6600]/30 rounded focus:ring-[#ff6600] focus:ring-2"
                            />
                            <label htmlFor="saveAddressFirst" className="text-[#ffcc99] text-sm cursor-pointer">
                              Save this address for future orders
                            </label>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {shippingMethod === 'pickup' && (
                    <div className="bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl p-4">
                      <p className="text-[#ffcc99] text-sm">
                        <strong className="text-white">Pickup Location:</strong> You'll collect your order from our nearest hub. We'll notify you when it's ready for pickup.
                      </p>
                    </div>
                  )}
                        </section>

                      <section className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <ClipboardList className="w-5 h-5 text-[#ff6600]" />
                          <h2 className="text-white text-xl font-bold">Order notes (optional)</h2>
                        </div>
                        <textarea
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          placeholder="Add a note for the seller or delivery agent"
                          rows={3}
                          className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600] resize-none"
                        />
                      </section>
                    </div>
                    <div className="lg:col-span-1">
                      <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 sticky top-6 space-y-6">
                        <h2 className="text-white text-xl font-bold">Summary</h2>
                        <div className="space-y-3 border-t border-[#ff6600]/30 pt-4">
                          <div className="flex justify-between"><span className="text-[#ffcc99]">Subtotal</span><span className="text-white font-semibold">{formatPrice(cart?.totalAmount ?? 0)}</span></div>
                          <div className="flex justify-between"><span className="text-[#ffcc99]">Shipping</span><span className="text-white font-semibold">{shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}</span></div>
                          {discount > 0 && <div className="flex justify-between"><span className="text-[#ffcc99]">Discount</span><span className="text-green-400 font-semibold">- {formatPrice(discount)}</span></div>}
                          <div className="border-t border-[#ff6600]/30 pt-3 flex justify-between">
                            <span className="text-white font-bold">Total</span><span className="text-[#ff6600] text-xl font-bold">{formatPrice(totalAmount)}</span>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => goToStep(1)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#333] text-[#ffcc99] rounded-xl font-bold hover:bg-[#444] transition"
                          >
                            <ChevronLeft className="w-5 h-5" /> Back
                          </button>
                          <button
                            type="button"
                            onClick={() => goToStep(3)}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition"
                          >
                            Continue to confirmation <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Step 3: Confirmation */}
                {currentStep === 3 && (
                  <>
                    <div className="lg:col-span-2 space-y-6">
                      <section className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <ShieldCheck className="w-5 h-5 text-[#ff6600]" />
                          <h2 className="text-white text-xl font-bold">Review your order</h2>
                        </div>
                        <p className="text-[#ffcc99] text-sm mb-6">Confirm everything is correct. Click &quot;Complete Payment&quot; to go to Paystack and pay securely.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><Phone className="w-4 h-4 text-[#ff6600]" /> Contact</h3>
                            <p className="text-[#ffcc99] text-sm">{contactInfo.fullName}</p>
                            <p className="text-[#ffcc99] text-sm">{contactInfo.email}</p>
                            <p className="text-[#ffcc99] text-sm">{contactInfo.phone}</p>
                          </div>
                          <div>
                            <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><MapPin className="w-4 h-4 text-[#ff6600]" /> Delivery</h3>
                            <p className="text-[#ffcc99] text-sm">
                              {shippingMethod === 'pickup'
                                ? 'Store pickup'
                                : selectedAddressId
                                  ? (() => {
                                      const addr = savedAddresses.find((a) => a.id === selectedAddressId);
                                      return addr ? `${addr.line1}, ${addr.city}, ${addr.state}` : `${deliveryInfo.address}, ${deliveryInfo.city}, ${deliveryInfo.state}`;
                                    })()
                                  : `${deliveryInfo.address}, ${deliveryInfo.city}, ${deliveryInfo.state}`}
                            </p>
                            <p className="text-[#ffcc99] text-xs mt-1">
                              {shippingMethod === 'standard' && 'Standard (3–5 days)'}
                              {shippingMethod === 'express' && 'Express (24–48 hours)'}
                              {shippingMethod === 'pickup' && 'Pickup from hub'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-[#ff6600]/30">
                          <h3 className="text-white font-semibold mb-3">Items</h3>
                          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                            {cart?.items.map((item) => (
                              <div key={item.id} className="flex gap-3 items-center py-2 border-b border-[#ff6600]/20 last:border-0">
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-black shrink-0">
                                  {item.product.images?.[0] ? (
                                    <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                                  ) : <div className="w-full h-full flex items-center justify-center text-[#ffcc99]"><Package className="w-5 h-5" /></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm font-medium truncate">{item.product.title}</p>
                                  <p className="text-[#ffcc99] text-xs">Qty: {item.quantity}</p>
                                </div>
                                <p className="text-[#ff6600] font-bold text-sm">{formatPrice(item.product.price * item.quantity)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </section>
                    </div>

                    <div className="lg:col-span-1">
                      <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 sticky top-6 space-y-6">
                        <h2 className="text-white text-xl font-bold">Total</h2>
                        <div className="space-y-3 border-t border-[#ff6600]/30 pt-4">
                          <div className="flex justify-between"><span className="text-[#ffcc99]">Subtotal</span><span className="text-white font-semibold">{formatPrice(cart?.totalAmount ?? 0)}</span></div>
                          <div className="flex justify-between"><span className="text-[#ffcc99]">Shipping</span><span className="text-white font-semibold">{shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}</span></div>
                          {discount > 0 && <div className="flex justify-between"><span className="text-[#ffcc99]">Discount</span><span className="text-green-400 font-semibold">- {formatPrice(discount)}</span></div>}
                          <div className="border-t border-[#ff6600]/30 pt-3 flex justify-between">
                            <span className="text-white font-bold">Total</span><span className="text-[#ff6600] text-xl font-bold">{formatPrice(totalAmount)}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-xl">
                          <p className="text-[#ffcc99] text-xs">
                            <strong className="text-white">Secure payment:</strong> You will be redirected to Paystack to complete payment. No card details are entered on this site.
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#333] text-[#ffcc99] rounded-xl font-bold hover:bg-[#444] transition"
                          >
                            <ChevronLeft className="w-5 h-5" /> Back
                          </button>
                          <button
                            type="submit"
                            disabled={submitting || (!!shippingQuoteError && shippingMethod !== 'pickup')}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-[#ff6600]/30"
                          >
                            {submitting ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Redirecting...
                              </>
                            ) : (
                              <>
                                <Lock className="w-5 h-5" />
                                Complete Payment
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </form>
            </div>
          )}
        </div>
      </BuyerLayout>
    </>
  );
}

