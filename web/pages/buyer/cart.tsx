import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import apiClient from '../../lib/api/client';
import { ShoppingCart, Trash2, Plus, Minus, Package, ArrowRight, ShoppingBag } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../../lib/ui/toast';

interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  resolvedUnitPrice: number;
  resolvedTotalPrice: number;
  sellingContext: 'B2C' | 'B2B';
  product: {
    id: string;
    title: string;
    price: number;
    images: string[];
    quantity: number;
    status: string;
    sellingMode?: string;
    moq?: number;
  };
}

interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export default function CartPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItems, setUpdatingItems] = useState<{ [key: string]: boolean }>({});

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
    }
  }, [router]);

  useEffect(() => {
    if (mounted) {
      fetchCart();
    }
  }, [mounted]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/cart');
      
      // Handle API response wrapping
      const cartData = response.data.data || response.data;
      setCart(cartData);
    } catch (err: any) {
      console.error('Error fetching cart:', err);
      setError(err.response?.data?.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1 || !cart) return;

    // Optimistic update: show new quantity immediately for better UX
    const previousCart = cart;
    setCart((prev) => {
      if (!prev) return prev;
      const items = prev.items.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
      return { ...prev, items, totalItems, totalAmount: prev.totalAmount };
    });

    try {
      setUpdatingItems((prev) => ({ ...prev, [itemId]: true }));
      const response = await apiClient.put(`/cart/items/${itemId}`, { quantity: newQuantity });
      const cartData = response.data.data || response.data;
      setCart(cartData);
    } catch (err: any) {
      console.error('Error updating quantity:', err);
      setCart(previousCart); // Revert on failure
      showErrorToast(err.response?.data?.message || 'Failed to update quantity');
    } finally {
      setUpdatingItems((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setUpdatingItems((prev) => ({ ...prev, [itemId]: true }));
      const response = await apiClient.delete(`/cart/items/${itemId}`);

      const cartData = response.data.data || response.data;
      setCart(cartData);
      window.dispatchEvent(new Event('cartUpdated'));
      showSuccessToast('Item removed from cart');
    } catch (err: any) {
      console.error('Error removing item:', err);
      showErrorToast(err.response?.data?.message || 'Failed to remove item');
    } finally {
      setUpdatingItems((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const formatPrice = (priceInKobo: number) => {
    return `₦${(priceInKobo / 100).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const calculateSubtotal = () => {
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => sum + (item.resolvedTotalPrice ?? item.resolvedUnitPrice * item.quantity), 0);
  };

  const shippingFee = 500; // ₦5.00
  const discount = 0; // No discount for now
  const subtotal = calculateSubtotal();
  const total = subtotal + shippingFee - discount;

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Shopping Cart - Buyer | Carryofy</title>
        <meta
          name="description"
          content="View and manage your shopping cart on Carryofy."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 102, 0, 0.1);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #ff6600;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #cc5200;
          }
        `}</style>
      </Head>
      <BuyerLayout>
        <div>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-[#ff6600]" />
              Shopping Cart
            </h1>
            <p className="text-[#ffcc99] text-lg">
              {cart?.totalItems ? `${cart.totalItems} item${cart.totalItems > 1 ? 's' : ''} in your cart` : 'Your cart is empty'}
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6600]"></div>
              <p className="text-[#ffcc99] mt-4">Loading cart...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchCart}
                className="px-6 py-2 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Cart Content */}
          {!loading && !error && cart && (
            <>
              {cart.items.length === 0 ? (
                // Empty Cart State
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-2xl p-12 text-center">
                  <ShoppingBag className="w-20 h-20 text-[#ffcc99] mx-auto mb-4" />
                  <h2 className="text-white text-2xl font-bold mb-2">Your cart is empty</h2>
                  <p className="text-[#ffcc99] mb-6">
                    Start shopping and add items to your cart!
                  </p>
                  <Link
                    href="/buyer/products"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Browse Products
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Cart Items - Left Column (2/3) */}
                  <div className="lg:col-span-2">
                    {/* Items count info */}
                    <div className="mb-4 text-[#ffcc99]">
                      Showing all {cart.items.length} item{cart.items.length !== 1 ? 's' : ''}
                    </div>
                    
                    {/* Scrollable container for many items */}
                    <div className={`space-y-4 ${cart.items.length > 10 ? 'max-h-[800px] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
                      {cart.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 hover:border-[#ff6600] transition"
                      >
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            <div className="w-full md:w-32 h-32 bg-black rounded-lg overflow-hidden">
                              {item.product.images && item.product.images.length > 0 ? (
                                <img
                                  src={item.product.images[0]}
                                  alt={item.product.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#ffcc99]">
                                  <Package className="w-12 h-12" />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Product Details */}
                          <div className="flex-1">
                            {/* Stock Status */}
                            <div className="mb-2">
                              {item.product.status === 'ACTIVE' && item.product.quantity > 0 ? (
                                <span className="inline-flex items-center gap-1 text-green-400 text-sm font-medium">
                                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                  In Stock
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-red-400 text-sm font-medium">
                                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                  Out of Stock
                                </span>
                              )}
                            </div>

                            {/* Product Name */}
                            <Link 
                              href={`/buyer/products/${item.product.id}`}
                              className="text-white text-xl font-bold hover:text-[#ff6600] transition block mb-2"
                            >
                              {item.product.title}
                            </Link>

                            {/* Price - server-provided only */}
                            <p className="text-[#ff6600] text-2xl font-bold mb-4">
                              {formatPrice(item.resolvedUnitPrice)}
                              {item.sellingContext === 'B2B' && (
                                <span className="ml-2 text-xs font-medium px-2 py-0.5 bg-[#ff6600]/20 text-[#ff6600] rounded">B2B</span>
                              )}
                            </p>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-4 mb-4">
                              <span className="text-[#ffcc99] text-sm">Quantity:</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1 || updatingItems[item.id]}
                                  className="w-8 h-8 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-lg text-white hover:bg-[#ff6600] hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                  <Minus className="w-4 h-4 mx-auto" />
                                </button>
                                <span className="text-white text-lg font-bold w-12 text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  disabled={item.quantity >= item.product.quantity || updatingItems[item.id]}
                                  className="w-8 h-8 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-lg text-white hover:bg-[#ff6600] hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                  <Plus className="w-4 h-4 mx-auto" />
                                </button>
                              </div>
                            </div>

                            {/* Subtotal & Remove */}
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[#ffcc99]/70 text-sm">Subtotal</p>
                                <p className="text-white text-xl font-bold">
                                  {formatPrice(item.resolvedTotalPrice)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                disabled={updatingItems[item.id]}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Summary - Right Column (1/3) */}
                  <div className="lg:col-span-1">
                    <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 lg:sticky lg:top-6">
                      <h2 className="text-white text-2xl font-bold mb-6">Order Summary</h2>

                      {/* Summary Items */}
                      <div className="space-y-4 mb-6">
                        <div className="flex items-center justify-between">
                          <span className="text-[#ffcc99]">Subtotal</span>
                          <span className="text-white font-bold">{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#ffcc99]">Shipping</span>
                          <span className="text-white font-bold">{formatPrice(shippingFee)}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-[#ffcc99]">Discount</span>
                            <span className="text-green-400 font-bold">-{formatPrice(discount)}</span>
                          </div>
                        )}
                        <div className="border-t border-[#ff6600]/30 pt-4">
                          <div className="flex items-center justify-between">
                            <span className="text-white text-lg font-bold">Total</span>
                            <span className="text-[#ff6600] text-2xl font-bold">{formatPrice(total)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        <button
                          onClick={() => router.push('/buyer/checkout')}
                          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#ff6600] text-black rounded-xl font-bold text-lg hover:bg-[#cc5200] transition shadow-lg shadow-[#ff6600]/30"
                        >
                          Proceed to Checkout
                          <ArrowRight className="w-5 h-5" />
                        </button>
                        <Link
                          href="/buyer/products"
                          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#0d0d0d] border-2 border-[#ff6600]/50 text-white rounded-xl font-bold hover:bg-[#ff6600]/10 hover:border-[#ff6600] transition"
                        >
                          <ShoppingBag className="w-5 h-5" />
                          Continue Shopping
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </BuyerLayout>
    </>
  );
}

