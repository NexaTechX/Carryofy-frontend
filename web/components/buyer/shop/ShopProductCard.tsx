'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { BadgeCheck, Check, Heart, Package, ShoppingCart } from 'lucide-react';
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

const IMG_H = 200;

function ShopProductCard({ product, href }: ShopProductCardProps) {
  const router = useRouter();
  const isAuthenticated = tokenManager.isAuthenticated();
  const { isInWishlist, toggleWishlist, loading: wishlistLoading, initialized } = useWishlist();
  const { addToCart } = useCart();
  const [isToggling, setIsToggling] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const inWishlist = isAuthenticated && initialized ? isInWishlist(product.id) : false;

  const formatPrice = (priceInKobo: number) => {
    return `₦${(priceInKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const needsQuote = product.requestQuoteOnly === true;
  const hasPriceTiers = product.priceTiers != null && product.priceTiers.length > 0;
  const isWholesale = product.sellingMode === 'B2B_ONLY' || product.sellingMode === 'B2C_AND_B2B';

  const getPriceDisplay = (): string => {
    if (product.requestQuoteOnly) return 'Price on request';
    if (hasPriceTiers) {
      const sorted = [...product.priceTiers!].sort((a, b) => a.minQuantity - b.minQuantity);
      const lowest = sorted[0];
      return `From ${formatPrice(lowest.priceKobo)}`;
    }
    return formatPrice(product.price);
  };

  const priceDisplay = getPriceDisplay();
  const productHref = href || `/buyer/products/${product.id}`;
  const fulfilled = product.fulfilledByCarryofy !== false;
  const isVerified = product.seller?.isVerified !== false;
  const qty = product.quantity ?? 0;
  const lowStockThreshold = 5;
  const stockLabel =
    qty === 0 ? 'Out of stock' : qty <= lowStockThreshold ? 'Low stock' : 'In stock';
  const stockClass =
    qty === 0
      ? 'bg-rose-500/15 text-rose-300 border-rose-500/25'
      : qty <= lowStockThreshold
        ? 'bg-amber-500/15 text-amber-300 border-amber-500/25'
        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25';

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
    if (qty === 0) return;
    const cartQty = product.moq && product.moq > 1 ? product.moq : 1;
    try {
      setIsAddingToCart(true);
      const ok = await addToCart(product.id, cartQty);
      if (ok) {
        setJustAdded(true);
        window.setTimeout(() => setJustAdded(false), 2200);
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleQuoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void router.push(productHref);
  };

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#1A1A1A] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#FF6B00]/35 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
    >
      {/* Image — link to product (no buttons inside) */}
      <div className="relative shrink-0">
        <Link href={productHref} className="relative block w-full overflow-hidden bg-[#111111]" style={{ height: IMG_H }}>
          {product.images?.length > 0 ? (
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#ffcc99]/25">
              <Package className="h-14 w-14" />
            </div>
          )}
        </Link>

        {isAuthenticated && (
          <button
            type="button"
            onClick={handleWishlistToggle}
            disabled={isToggling || wishlistLoading}
            className={`absolute right-2 top-2 z-10 rounded-full bg-black/65 p-2 transition-colors hover:bg-[#FF6B00] ${
              inWishlist ? 'bg-[#FF6B00] text-black' : 'text-white'
            } ${isToggling ? 'opacity-50' : ''}`}
            aria-label={inWishlist ? 'Remove from saved list' : 'Add to saved list'}
          >
            <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      {/* Details — link block (same href) keeps card body clickable without nesting buttons inside <a> */}
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <Link href={productHref} className="block min-h-0 min-w-0 flex-1">
          <h3 className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-white transition-colors group-hover:text-[#FF6B00]">
            {product.title}
          </h3>

          <div className="mb-3 flex min-w-0 items-center gap-1.5">
            <span className="truncate text-xs text-[#ffcc99]/90">{product.seller?.businessName || 'Seller'}</span>
            {isVerified && (
              <span
                className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400"
                title="Verified seller"
              >
                <BadgeCheck className="h-3 w-3" aria-hidden />
                Verified
              </span>
            )}
          </div>

          <p className="mb-3 text-lg font-bold text-[#FF6B00]">{priceDisplay}</p>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${stockClass}`}
            >
              {stockLabel}
              {qty > 0 && <span className="ml-1 opacity-80">({qty} left)</span>}
            </span>
            {product.moq != null && product.moq > 1 && (
              <span className="inline-flex rounded-md border border-[#FF6B00]/35 bg-[#FF6B00]/12 px-2 py-0.5 text-[11px] font-semibold text-[#FF6B00]">
                Min. order: {product.moq} units
              </span>
            )}
          </div>

          {isWholesale && (
            <div className="mb-3">
              <span className="inline-flex rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-[#ffcc99]/80">
                {product.sellingMode === 'B2B_ONLY' ? 'Wholesale' : 'Retail & wholesale'}
                {hasPriceTiers ? ' · Tiered pricing' : ''}
              </span>
            </div>
          )}

          {fulfilled && (
            <div className="mb-1">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[#FF6B00]/45 bg-[#FF6B00]/12 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#FF6B00]">
                <Package className="h-3.5 w-3.5" aria-hidden />
                Fulfilled by Carryofy
              </span>
            </div>
          )}
        </Link>

        <div className="mt-auto border-t border-white/[0.06] pt-3">
          {qty > 0 ? (
            needsQuote ? (
              <button
                type="button"
                onClick={handleQuoteClick}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#FF6B00] bg-transparent py-2.5 text-sm font-semibold text-[#FF6B00] transition-colors hover:bg-[#FF6B00]/10"
              >
                Get a Quote
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!isAuthenticated || isAddingToCart}
                className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-colors disabled:opacity-50 ${
                  justAdded
                    ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                    : 'bg-[#FF6B00] text-black hover:bg-[#ff8533]'
                }`}
              >
                {justAdded ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                {isAddingToCart ? 'Adding...' : justAdded ? 'Added' : 'Add to Cart'}
              </button>
            )
          ) : (
            <button
              type="button"
              disabled
              className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-[#ffcc99]/40"
            >
              Out of Stock
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default React.memo(ShopProductCard);
