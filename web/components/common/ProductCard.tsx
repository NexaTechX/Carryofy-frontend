import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Heart, Package, GitCompare, ShoppingCart, ShieldCheck, Truck } from 'lucide-react';
import { useWishlist } from '../../lib/hooks/useWishlist';
import { useCart } from '../../lib/contexts/CartContext';
import { tokenManager } from '../../lib/auth';

export interface ProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    images: string[];
    quantity: number;
    status?: string;
    seller: {
      id: string;
      businessName: string;
    };
    keyFeatures?: string[];
    category?: string;
    sellingMode?: string;
    moq?: number;
    b2bProductType?: string;
  };
  onAddToComparison?: (product: any) => void;
  href?: string;
  showFeatures?: boolean;
  className?: string;
}

export default function ProductCard({
  product,
  onAddToComparison,
  href,
  showFeatures = true,
  className = '',
}: ProductCardProps) {
  const router = useRouter();
  const isAuthenticated = tokenManager.isAuthenticated();
  const { isInWishlist, toggleWishlist, loading: wishlistLoading, initialized } = useWishlist();
  const { addToCart } = useCart();
  const [isToggling, setIsToggling] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Get current wishlist status
  const inWishlist = isAuthenticated && initialized ? isInWishlist(product.id) : false;

  // Sync wishlist state when it changes
  React.useEffect(() => {
    // This effect ensures the component re-renders when wishlist state changes
    // The inWishlist value is computed from the hook, so it will update automatically
  }, [inWishlist, isAuthenticated, initialized]);

  const formatPrice = (priceInKobo: number) => {
    return `₦${(priceInKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      // Could redirect to login or show a toast
      return;
    }

    if (isToggling || wishlistLoading) return;

    try {
      setIsToggling(true);
      await toggleWishlist(product.id);
      // State will update automatically via the hook
    } catch (error: any) {
      console.error('Error toggling wishlist:', error);
      // Optionally show error toast
    } finally {
      setIsToggling(false);
    }
  };

  const handleComparisonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToComparison) {
      onAddToComparison(product);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push(`/auth/signup?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }

    if (product.quantity === 0) {
      return;
    }

    // B2B products with MOQ: add MOQ so quantity is valid; B2C: add 1
    const qty =
      (product.sellingMode === 'B2B_ONLY' || product.sellingMode === 'B2C_AND_B2B') &&
      product.moq != null &&
      product.moq > 0
        ? product.moq
        : 1;

    try {
      setIsAddingToCart(true);
      await addToCart(product.id, qty);
    } catch (error) {
      // Error is handled by the cart context (toast notification)
    } finally {
      setIsAddingToCart(false);
    }
  };

  const productHref = href || `/buyer/products/${product.id}`;

  return (
    <article
      className={`group bg-[#1a1a1a] border border-[#ff6600]/20 rounded-xl overflow-hidden hover:border-[#ff6600] hover:shadow-lg hover:shadow-[#ff6600]/20 transition-all duration-300 ${className}`}
    >
      <Link href={productHref} className="h-full flex flex-col">
        {/* Product Image */}
        <div className="aspect-square bg-linear-to-br from-black to-[#1a1a1a] relative overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#ffcc99]/50">
              <Package className="w-12 h-12" />
            </div>
          )}
          
          {/* Stock Status Overlay */}
          {product.quantity === 0 && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10">
              <span className="text-red-400 font-bold text-sm px-3 py-1 bg-black/50 rounded-full border border-red-400/50">
                Out of Stock
              </span>
            </div>
          )}
          
          {product.quantity > 0 && product.quantity <= 5 && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full z-10">
              Only {product.quantity} left
            </div>
          )}

          {(product.sellingMode === 'B2B_ONLY' || product.sellingMode === 'B2C_AND_B2B') && (
            <div className="absolute bottom-10 left-2 z-10 flex flex-wrap gap-1">
              <span className="px-2 py-1 bg-[#ff6600]/90 text-black text-[10px] font-bold rounded-md">B2B</span>
              {product.moq != null && product.moq > 0 && (
                <span className="px-2 py-1 bg-black/70 text-white text-[10px] font-medium rounded-md">MOQ: {product.moq}</span>
              )}
            </div>
          )}

          {/* Fulfillment label */}
          <div className="absolute bottom-2 left-2 right-2 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium rounded-md">
              <Package className="w-3 h-3" />
              Fulfilled by Carryofy
            </span>
          </div>

          {/* Action Buttons */}
          <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-10">
            {/* Comparison Button */}
            {onAddToComparison && (
              <button
                onClick={handleComparisonClick}
                className="bg-black/80 backdrop-blur-sm text-white p-2 rounded-full hover:bg-[#ff6600] transition z-10"
                title="Add to comparison"
              >
                <GitCompare className="w-4 h-4" />
              </button>
            )}
            
            {/* Wishlist Button */}
            {isAuthenticated && (
              <button
                onClick={handleWishlistToggle}
                disabled={isToggling || wishlistLoading}
                className={`bg-black/80 backdrop-blur-sm text-white p-2 rounded-full transition z-10 ${
                  inWishlist
                    ? 'bg-[#ff6600] hover:bg-[#ff6600]/80'
                    : 'hover:bg-[#ff6600]'
                } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart
                  className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-white font-bold text-base mb-2 line-clamp-2 group-hover:text-[#ff6600] transition-colors leading-snug min-h-10">
            {product.title}
          </h3>
          
          {/* Key Features */}
          {showFeatures && product.keyFeatures && product.keyFeatures.length > 0 && (
            <ul className="mb-2 space-y-1">
              {product.keyFeatures.slice(0, 2).map((feature, idx) => (
                <li key={idx} className="text-[#ff6600] text-xs flex items-start gap-1.5">
                  <span className="mt-0.5">•</span>
                  <span className="line-clamp-1">{feature}</span>
                </li>
              ))}
            </ul>
          )}
          
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/buyer/products?seller=${product.seller.id}`);
              }}
              className="text-[#ffcc99] hover:text-[#ff6600] text-xs font-medium truncate transition-colors text-left"
            >
              {product.seller.businessName}
            </button>
            <span className="inline-flex items-center gap-0.5 text-[10px] text-green-400" title="Verified seller">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified
            </span>
          </div>

          <div className="mt-auto">
            <p className="text-[#ff6600] font-bold text-lg mb-2">
              {formatPrice(product.price)}
            </p>
            {product.quantity > 0 && (
              <span className="text-green-400 text-xs flex items-center gap-1 mb-3">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                In Stock
              </span>
            )}
            
            {/* B2B_ONLY: View details only. B2C: Add to Cart (or signup link) */}
            {product.quantity > 0 && (
              product.sellingMode === 'B2B_ONLY' ? (
                <Link
                  href={productHref}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0d0d0d] border-2 border-[#ff6600]/50 text-white rounded-lg font-semibold hover:bg-[#ff6600]/10 hover:border-[#ff6600] transition-all duration-200 text-sm"
                  title="View details for wholesale pricing"
                >
                  View details
                </Link>
              ) : !isAuthenticated ? (
                <Link
                  href={`/auth/signup?redirect=${encodeURIComponent(router.asPath || '/')}`}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ff6600] text-white rounded-lg font-semibold hover:bg-[#cc5200] transition-all duration-200 text-sm"
                  title="Sign up to add to cart"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </Link>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ff6600] text-white rounded-lg font-semibold hover:bg-[#cc5200] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                  title="Add to cart"
                >
                  <ShoppingCart className={`w-4 h-4 ${isAddingToCart ? 'animate-pulse' : ''}`} />
                  <span>{isAddingToCart ? 'Adding...' : 'Add to Cart'}</span>
                </button>
              )
            )}
            {product.quantity === 0 && (
              <div className="w-full px-4 py-2.5 bg-gray-700/50 text-gray-400 rounded-lg text-center text-sm font-medium cursor-not-allowed">
                Out of Stock
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

