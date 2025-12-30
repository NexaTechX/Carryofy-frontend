import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Package, GitCompare } from 'lucide-react';
import { useWishlist } from '../../lib/hooks/useWishlist';
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
  const isAuthenticated = tokenManager.isAuthenticated();
  const { isInWishlist, toggleWishlist, loading: wishlistLoading, initialized } = useWishlist();
  const [isToggling, setIsToggling] = useState(false);

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

  const productHref = href || `/products/${product.id}`;

  return (
    <article
      className={`group bg-[#1a1a1a] border border-[#ff6600]/20 rounded-xl overflow-hidden hover:border-[#ff6600] hover:shadow-lg hover:shadow-[#ff6600]/20 transition-all duration-300 ${className}`}
    >
      <Link href={productHref} className="block h-full flex flex-col">
        {/* Product Image */}
        <div className="aspect-square bg-gradient-to-br from-black to-[#1a1a1a] relative overflow-hidden">
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
          <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2 group-hover:text-[#ff6600] transition-colors leading-snug min-h-[2.5rem]">
            {product.title}
          </h3>
          
          {/* Key Features */}
          {showFeatures && product.keyFeatures && product.keyFeatures.length > 0 && (
            <ul className="mb-2 space-y-1">
              {product.keyFeatures.slice(0, 2).map((feature, idx) => (
                <li key={idx} className="text-[#ffcc99]/80 text-xs flex items-start gap-1.5">
                  <span className="text-[#ff6600] mt-0.5">•</span>
                  <span className="line-clamp-1">{feature}</span>
                </li>
              ))}
            </ul>
          )}
          
          <p className="text-[#ffcc99]/60 text-xs mb-3 truncate">
            by {product.seller.businessName}
          </p>
          
          <div className="mt-auto">
            <p className="text-[#ff6600] font-bold text-lg mb-1">
              {formatPrice(product.price)}
            </p>
            {product.quantity > 0 && (
              <span className="text-green-400 text-xs flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                In Stock
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

