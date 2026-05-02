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
      ? 'border border-red-200 bg-red-50 text-red-700'
      : qty <= lowStockThreshold
        ? 'border border-orange-200 bg-orange-50 text-orange-700'
        : 'border border-green-200 bg-green-50 text-green-700';

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
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
    >
      {/* Image — link to product (no buttons inside) */}
      <div className="relative shrink-0">
        <Link href={productHref} className="relative block w-full overflow-hidden bg-gray-100" style={{ height: IMG_H }}>
          {product.images?.length > 0 ? (
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <Package className="h-14 w-14" />
            </div>
          )}
        </Link>

        {isAuthenticated && (
          <button
            type="button"
            onClick={handleWishlistToggle}
            disabled={isToggling || wishlistLoading}
            className={`absolute right-2 top-2 z-10 rounded-full border border-gray-200 bg-white/95 p-2 shadow-sm transition-colors hover:bg-orange-50 ${
              inWishlist ? 'border-orange-200 bg-orange-500 text-white hover:bg-orange-600' : 'text-gray-600'
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
          <h3 className="mb-2 min-h-[2.5rem] line-clamp-2 text-sm font-semibold leading-snug text-gray-900 transition-colors group-hover:text-orange-600">
            {product.title}
          </h3>

          <div className="mb-3 flex min-w-0 items-center gap-1.5">
            <span className="truncate text-xs text-gray-600">{product.seller?.businessName || 'Seller'}</span>
            {isVerified && (
              <span
                className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-green-200 bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700"
                title="Verified seller"
              >
                <BadgeCheck className="h-3 w-3" aria-hidden />
                Verified
              </span>
            )}
          </div>

          <p className="mb-3 text-lg font-bold text-orange-600">{priceDisplay}</p>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${stockClass}`}
            >
              {stockLabel}
              {qty > 0 && <span className="ml-1 opacity-80">({qty} left)</span>}
            </span>
            {product.moq != null && product.moq > 1 && (
              <span className="inline-flex rounded-md border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                Min. order: {product.moq} units
              </span>
            )}
          </div>

          {isWholesale && (
            <div className="mb-3">
              <span className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                {product.sellingMode === 'B2B_ONLY' ? 'Wholesale' : 'Retail & wholesale'}
                {hasPriceTiers ? ' · Tiered pricing' : ''}
              </span>
            </div>
          )}

          {fulfilled && (
            <div className="mb-1">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-orange-700">
                <Package className="h-3.5 w-3.5" aria-hidden />
                Fulfilled by Carryofy
              </span>
            </div>
          )}
        </Link>

        <div className="mt-auto border-t border-gray-100 pt-3">
          {qty > 0 ? (
            needsQuote ? (
              <button
                type="button"
                onClick={handleQuoteClick}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-orange-500 bg-white py-2.5 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-50"
              >
                Get a Quote
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!isAuthenticated || isAddingToCart}
                className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                  justAdded
                    ? 'bg-green-600 text-white hover:bg-green-600'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
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
              className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 py-2.5 text-sm font-semibold text-gray-400"
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
