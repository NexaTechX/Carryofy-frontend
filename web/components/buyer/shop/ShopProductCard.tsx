'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Heart, Package, ShoppingCart, ShieldCheck } from 'lucide-react';
import { useWishlist } from '../../../lib/hooks/useWishlist';
import { useCart } from '../../../lib/contexts/CartContext';
import { tokenManager } from '../../../lib/auth';

export interface ShopProductCardProduct {
  id: string;
  title: string;
  price: number;
  images: string[];
  quantity: number;
  status?: string;
  seller: {
    id: string;
    businessName: string;
    isVerified?: boolean;
  };
  keyFeatures?: string[];
  category?: string;
  sellingMode?: string;
  moq?: number;
  b2bProductType?: string;
  requestQuoteOnly?: boolean;
  priceTiers?: { minQuantity: number; maxQuantity: number; priceKobo: number }[];
  tags?: string[];
  fulfilledByCarryofy?: boolean;
}

interface ShopProductCardProps {
  product: ShopProductCardProduct;
  href?: string;
}

function ShopProductCard({ product, href }: ShopProductCardProps) {
  const router = useRouter();
  const isAuthenticated = tokenManager.isAuthenticated();
  const { isInWishlist, toggleWishlist, loading: wishlistLoading, initialized } = useWishlist();
  const { addToCart } = useCart();
  const [isToggling, setIsToggling] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const inWishlist = isAuthenticated && initialized ? isInWishlist(product.id) : false;

  const formatPrice = (priceInKobo: number) => {
    return `₦${(priceInKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const needsQuote =
    product.requestQuoteOnly === true ||
    (product.priceTiers != null && product.priceTiers.length > 0) ||
    (product.moq != null && product.moq > 1);

  const getPriceDisplay = (): string => {
    if (product.requestQuoteOnly) return 'Price on request';
    if (product.priceTiers && product.priceTiers.length > 0) {
      const sorted = [...product.priceTiers].sort((a, b) => a.minQuantity - b.minQuantity);
      const lowest = sorted[0];
      return `From ${formatPrice(lowest.priceKobo)}`;
    }
    if (product.moq != null && product.moq > 1 && product.price < 100) {
      return 'Price on request';
    }
    return formatPrice(product.price);
  };

  const priceDisplay = getPriceDisplay();
  const productHref = href || `/buyer/products/${product.id}`;
  const fulfilled = product.fulfilledByCarryofy !== false;

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated || isToggling || wishlistLoading) return;
    try {
      setIsToggling(true);
      await toggleWishlist(product.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsToggling(false);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push(`/auth/signup?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }
    if (product.quantity === 0) return;
    const qty = needsQuote && product.moq ? product.moq : 1;
    try {
      setIsAddingToCart(true);
      await addToCart(product.id, qty);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const features = (product.keyFeatures || []).slice(0, 2);
  const isVerified = product.seller?.isVerified !== false;

  return (
    <article className="group bg-[#1A1A1A] border border-[#2a2a2a] rounded-xl overflow-hidden hover:border-[#FF6B00]/50 transition-all duration-300 flex flex-col">
      <Link href={productHref} className="flex flex-col flex-1">
        {/* Image */}
        <div className="aspect-square bg-[#111111] relative overflow-hidden">
          {product.images?.length > 0 ? (
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#ffcc99]/30">
              <Package className="w-14 h-14" />
            </div>
          )}

          {fulfilled && (
            <span className="absolute bottom-2 left-2 px-2 py-1 bg-[#FF6B00]/90 text-black text-[10px] font-bold rounded-md flex items-center gap-1 shadow-lg">
              <Package className="w-3 h-3" />
              Fulfilled by Carryofy
            </span>
          )}

          {/* Wishlist */}
          {isAuthenticated && (
            <button
              onClick={handleWishlistToggle}
              disabled={isToggling || wishlistLoading}
              className={`absolute top-2 right-2 p-2 rounded-full bg-black/70 hover:bg-[#FF6B00] transition-colors z-10 ${
                inWishlist ? 'bg-[#FF6B00] text-black' : 'text-white'
              } ${isToggling ? 'opacity-50' : ''}`}
              aria-label={inWishlist ? 'Remove from saved list' : 'Add to saved list'}
            >
              <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
            </button>
          )}

          {product.quantity === 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-red-400 font-semibold text-sm">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-white font-semibold text-sm line-clamp-2 mb-2 group-hover:text-[#FF6B00] transition-colors min-h-[2.5rem]">
            {product.title}
          </h3>

          {features.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {features.map((f, i) => (
                <span key={i} className="text-[#FF6B00] text-xs font-semibold px-1.5 py-0.5 rounded bg-[#FF6B00]/10">
                  {f}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[#ffcc99] text-xs truncate">{product.seller?.businessName || 'Seller'}</span>
            {isVerified && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-green-400 shrink-0">
                <ShieldCheck className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>

          <p className="text-[#FF6B00] font-bold text-lg mb-2">{priceDisplay}</p>

          {product.moq != null && product.moq > 0 && (
            <span className="inline-flex self-start px-2 py-0.5 bg-[#FF6B00]/20 text-[#FF6B00] text-[10px] font-medium rounded mb-2">
              Min. {product.moq} units
            </span>
          )}

          {product.quantity > 0 && (
            <span className="flex items-center gap-1 text-green-400 text-xs mb-3">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              In Stock
            </span>
          )}

          <div className="mt-auto flex gap-2">
            {product.quantity > 0 && (
              <>
                {needsQuote ? (
                  <Link
                    href={productHref}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-transparent border border-[#FF6B00] text-[#FF6B00] rounded-lg text-sm font-semibold hover:bg-[#FF6B00]/10 transition-colors"
                  >
                    Request Quote
                  </Link>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={!isAuthenticated || isAddingToCart}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#FF6B00] text-black rounded-lg text-sm font-bold hover:bg-[#ff9955] disabled:opacity-50 transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

export default React.memo(ShopProductCard);
