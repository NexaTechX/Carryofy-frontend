import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { X, ShoppingCart, Trash2, Plus, Minus, Package, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../../lib/contexts/CartContext';

export default function CartDrawer() {
  const router = useRouter();
  const {
    cart,
    loading,
    error,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    fetchCart,
  } = useCart();

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };

    if (isDrawerOpen) {
      window.addEventListener('keydown', handleEsc);
      return () => {
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isDrawerOpen, closeDrawer]);

  const formatPrice = (priceInKobo: number) => {
    return `₦${(priceInKobo / 100).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const calculateSubtotal = () => {
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const discount = 0;
  const subtotal = calculateSubtotal();
  const total = subtotal - discount;

  const handleCheckout = () => {
    closeDrawer();
    router.push('/buyer/checkout');
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop/Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={closeDrawer}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[90vw] sm:w-full sm:max-w-md bg-black border-l border-[#ff6600]/30 z-50 flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#ff6600]/30">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-[#ff6600]" />
                <h2 className="text-white text-xl sm:text-2xl font-bold">
                  Shopping Cart
                  {cart?.totalItems ? ` (${cart.totalItems})` : ''}
                </h2>
              </div>
              <button
                onClick={closeDrawer}
                className="p-2 text-[#ffcc99] hover:text-white hover:bg-[#1a1a1a] rounded-lg transition touch-target btn-mobile"
                aria-label="Close cart"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6600]"></div>
                  <p className="text-[#ffcc99] mt-4">Loading cart...</p>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 m-4 text-center">
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
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                      <ShoppingBag className="w-20 h-20 text-[#ffcc99] mb-4" />
                      <h3 className="text-white text-xl font-bold mb-2">Your cart is empty</h3>
                      <p className="text-[#ffcc99] mb-6 text-center">
                        Start shopping and add items to your cart!
                      </p>
                      <Link
                        href="/buyer/products"
                        onClick={closeDrawer}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        Browse Products
                      </Link>
                    </div>
                  ) : (
                    <div className="p-4 space-y-4">
                      {/* Cart Items */}
                      {cart.items.map((item) => (
                        <div
                          key={item.id}
                          className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-4 hover:border-[#ff6600] transition"
                        >
                          <div className="flex gap-4">
                            {/* Product Image */}
                            <div className="flex-shrink-0">
                              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-black rounded-lg overflow-hidden">
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
                            </div>

                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              {/* Stock Status */}
                              <div className="mb-1">
                                {item.product.status === 'ACTIVE' && item.product.quantity > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-green-400 text-xs font-medium">
                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                                    In Stock
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-red-400 text-xs font-medium">
                                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                                    Out of Stock
                                  </span>
                                )}
                              </div>

                              {/* Product Name */}
                              <Link
                                href={`/buyer/products/${item.product.id}`}
                                onClick={closeDrawer}
                                className="text-white text-sm sm:text-base font-bold hover:text-[#ff6600] transition block mb-1 line-clamp-2"
                              >
                                {item.product.title}
                              </Link>

                              {/* Price */}
                              <p className="text-[#ff6600] text-lg font-bold mb-3">
                                {formatPrice(item.product.price)}
                              </p>

                              {/* Quantity Controls */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                    className="w-7 h-7 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-lg text-white hover:bg-[#ff6600] hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="text-white text-sm font-bold w-8 text-center">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    disabled={item.quantity >= item.product.quantity}
                                    className="w-7 h-7 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-lg text-white hover:bg-[#ff6600] hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  className="p-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 hover:border-red-500 transition flex items-center justify-center"
                                  aria-label="Remove item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Item Subtotal */}
                              <div className="mt-2 pt-2 border-t border-[#ff6600]/20">
                                <p className="text-[#ffcc99]/70 text-xs">Subtotal</p>
                                <p className="text-white text-sm font-bold">
                                  {formatPrice(item.product.price * item.quantity)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer - Order Summary & Actions */}
            {!loading && !error && cart && cart.items.length > 0 && (
              <div className="border-t border-[#ff6600]/30 bg-black">
                <div className="p-4 sm:p-6 space-y-4">
                  {/* Order Summary */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#ffcc99]">Subtotal</span>
                      <span className="text-white font-bold">{formatPrice(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#ffcc99]">Discount</span>
                        <span className="text-green-400 font-bold">-{formatPrice(discount)}</span>
                      </div>
                    )}
                    <div className="border-t border-[#ff6600]/30 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-bold">Total</span>
                        <span className="text-[#ff6600] text-xl font-bold">{formatPrice(total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={handleCheckout}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition shadow-lg shadow-[#ff6600]/30"
                    >
                      Proceed to Checkout
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <Link
                      href="/buyer/products"
                      onClick={closeDrawer}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#0d0d0d] border-2 border-[#ff6600]/50 text-white rounded-xl font-bold hover:bg-[#ff6600]/10 hover:border-[#ff6600] transition"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      Continue Shopping
                    </Link>
                    <Link
                      href="/buyer/cart"
                      onClick={closeDrawer}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-[#ffcc99] hover:text-white transition text-sm"
                    >
                      View Full Cart Page
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
