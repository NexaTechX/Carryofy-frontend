import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Star,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  Package,
} from 'lucide-react';
import StockPhoto from '../common/StockPhoto';
import CarryofyTrustedBadge from '../common/CarryofyTrustedBadge';
import { unsplashPhoto } from '../../lib/unsplash';
import { isSellerVerified } from '../../lib/sellerVerification';
import { Product } from '../../types/product';

const productPlaceholder = unsplashPhoto('photo-1505740420928-5e560c06d30e', { w: 500 });

interface FeaturedProductsProps {
  products?: Product[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

function ProductSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="overflow-hidden rounded-2xl border border-border-custom bg-card"
    >
      <div className="aspect-4/5 animate-pulse bg-surface-2 sm:aspect-5/6" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-surface-2" />
        <div className="h-5 w-2/5 animate-pulse rounded bg-surface-2" />
        <div className="mt-2 h-10 w-full animate-pulse rounded-xl bg-surface-2" />
      </div>
    </motion.div>
  );
}

function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="col-span-full py-12 text-center">
      <div className="mx-auto max-w-md">
        <AlertCircle className="mx-auto mb-4 h-16 w-16 text-primary" />
        <h3 className="mb-2 text-xl font-bold text-foreground">Unable to Load Products</h3>
        <p className="mb-6 text-foreground/60">
          We&apos;re having trouble fetching the latest products. Please try again.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-[#1a0e00] transition-all duration-300 hover:bg-primary-dark"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

function formatPrice(priceInKobo: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(priceInKobo / 100);
}

function FeaturedProducts({ products = [], loading = false, error, onRetry }: FeaturedProductsProps) {
  return (
    <section className="border-b border-border-custom bg-background py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="landing-eyebrow inline-flex items-center gap-2">
              <TrendingUp className="h-4 w-4 shrink-0" aria-hidden />
              Live listings
            </p>
            <h2 className="landing-title mt-2 text-2xl sm:text-3xl">Popular wholesale picks</h2>
            <p className="landing-lead mt-2 max-w-xl text-sm sm:text-base">
              Real SKUs from Carryofy Trusted vendors — clear unit pricing and coordinated delivery
              across Lagos.
            </p>
          </div>
          <Link
            href="/buyer/products"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-primary-light"
          >
            See all products
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-5 lg:gap-6">
          {loading &&
            Array.from({ length: 5 }).map((_, index) => (
              <ProductSkeleton key={index} index={index} />
            ))}

          {error && !loading && products.length === 0 && <ErrorState onRetry={onRetry} />}

          {!loading &&
            products.length > 0 &&
            products.slice(0, 10).map((product, index) => {
              const stock = (product as { quantity?: number }).quantity ?? product.stockQuantity ?? 0;
              const isInStock = stock > 0;
              const sellerVerified = isSellerVerified(product.seller);
              const title = (product as { title?: string }).title || product.name;
              const imageSrc = product.images?.[0] || productPlaceholder;
              const imageSizes = '(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 20vw';
              const imageClassName =
                'object-cover transition-transform duration-500 group-hover:scale-[1.04]';

              return (
                <motion.article
                  key={product.id}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(index * 0.06, 0.3) }}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border-custom bg-card transition duration-300 hover:border-primary/45 hover:shadow-[0_18px_40px_-20px_rgba(255,107,0,0.35)]"
                >
                  <Link
                    href={`/buyer/products/${product.id}`}
                    className="relative block aspect-4/5 overflow-hidden bg-surface-2 sm:aspect-5/6"
                  >
                    {product.images?.[0] ? (
                      <Image
                        src={imageSrc}
                        alt={title}
                        fill
                        sizes={imageSizes}
                        className={imageClassName}
                      />
                    ) : (
                      <StockPhoto
                        src={imageSrc}
                        alt={title}
                        fill
                        sizes={imageSizes}
                        className={imageClassName}
                      />
                    )}

                    {/* Soft depth so badges and CTA cues stay readable */}
                    <div
                      className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0a0c10]/85 via-[#0a0c10]/15 to-transparent"
                      aria-hidden
                    />

                    {sellerVerified && (
                      <div className="absolute left-2 top-2 z-10 sm:left-3 sm:top-3">
                        <CarryofyTrustedBadge size="sm" />
                      </div>
                    )}

                    {product.averageRating != null && product.averageRating > 0 && (
                      <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full border border-white/15 bg-[#0a0c10]/80 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm sm:right-3 sm:top-3 sm:text-[11px]">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
                        {product.averageRating.toFixed(1)}
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-2 px-2.5 pb-2.5 sm:px-3 sm:pb-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-widest sm:text-[10px] ${
                          isInStock
                            ? 'bg-success-soft text-success'
                            : 'bg-danger-soft text-danger'
                        }`}
                      >
                        {isInStock ? 'In stock' : 'Out of stock'}
                      </span>
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col p-3 sm:p-4">
                    {product.category && (
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/40">
                        {product.category}
                      </p>
                    )}

                    <Link href={`/buyer/products/${product.id}`} className="block min-w-0">
                      <h3 className="line-clamp-2 min-h-10 text-[13px] font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary sm:min-h-11 sm:text-sm lg:text-[15px]">
                        {title}
                      </h3>
                    </Link>

                    {product.seller?.businessName && (
                      <p className="mt-1.5 truncate text-[11px] text-foreground/50 sm:text-xs">
                        {product.seller.businessName}
                      </p>
                    )}

                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="font-display text-lg font-bold tabular-nums tracking-tight text-primary sm:text-xl">
                        {formatPrice(product.price)}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-foreground/35 sm:text-[11px]">
                        / unit
                      </span>
                    </div>

                    <div className="mt-auto pt-3 sm:pt-4">
                      <Link
                        href={`/buyer/products/${product.id}`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-[#1a0e00] shadow-[0_8px_24px_-10px_rgba(255,107,0,0.65)] transition hover:bg-primary-light sm:text-sm"
                      >
                        <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                        View product
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}

          {!loading && !error && products.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <div className="mx-auto max-w-md">
                <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-foreground/25" />
                <h3 className="mb-2 text-xl font-bold text-foreground">No Products Available</h3>
                <p className="text-foreground/60">
                  Check back soon for wholesale picks from our merchants.
                </p>
              </div>
            </div>
          )}
        </div>

        {!loading && !error && products.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 text-center sm:mt-12 lg:mt-16"
          >
            <Link
              href="/buyer/products"
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-8 py-3.5 text-sm font-semibold text-background transition hover:bg-white sm:text-base"
            >
              Browse full marketplace
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default React.memo(FeaturedProducts);
