import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Star, Sparkles, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import StockPhoto from '../common/StockPhoto';
import { unsplashPhoto } from '../../lib/unsplash';
import { Product } from '../../types/product';

const productPlaceholder = unsplashPhoto('photo-1505740420928-5e560c06d30e', { w: 500 });

interface FeaturedProductsProps {
  products?: Product[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

// Skeleton loader component
function ProductSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-card rounded-xl sm:rounded-2xl overflow-hidden shadow-card border border-border-custom"
    >
      <div className="relative h-40 sm:h-52 lg:h-64 bg-surface-2 animate-pulse"></div>
      <div className="p-3 sm:p-4 lg:p-6 space-y-3">
        <div className="h-3 bg-surface-2 rounded animate-pulse w-1/3"></div>
        <div className="h-4 bg-surface-2 rounded animate-pulse w-2/3"></div>
        <div className="flex items-center justify-between mt-4">
          <div className="h-5 bg-surface-2 rounded animate-pulse w-1/4"></div>
          <div className="w-8 h-8 bg-surface-2 rounded-full animate-pulse"></div>
        </div>
      </div>
    </motion.div>
  );
}

// Error state component
function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="col-span-full py-12 text-center">
      <div className="max-w-md mx-auto">
        <AlertCircle className="w-16 h-16 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold text-foreground mb-2">Unable to Load Products</h3>
        <p className="text-foreground/60 mb-6">
          We're having trouble fetching the latest products. Please try again.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-[#1a0e00] rounded-full font-semibold hover:bg-primary-dark transition-all duration-300"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

// Format price to Nigerian Naira (API returns price in kobo)
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
              Real SKUs from verified vendors — transparent unit pricing and coordinated delivery
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

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-8">
          {/* Loading state */}
          {loading && Array.from({ length: 5 }).map((_, index) => (
            <ProductSkeleton key={index} index={index} />
          ))}

          {/* Error state - only show if there are no products AND there's an error */}
          {error && !loading && products.length === 0 && <ErrorState onRetry={onRetry} />}

          {/* Products - Show only 3-5 real products */}
          {!loading && products.length > 0 && products.slice(0, 10).map((product, index) => {
            const stock = (product as any).quantity ?? product.stockQuantity ?? 0;
            const isInStock = stock > 0;

            const imageSrc = product.images?.[0] || productPlaceholder;
            const imageAlt = (product as { title?: string }).title || product.name;
            const imageClassName =
              'object-cover group-hover:scale-110 transition-transform duration-500';
            const imageSizes = '(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw';

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group relative overflow-hidden rounded-xl border border-border-custom bg-card shadow-card transition hover:-translate-y-1 hover:border-primary/50"
              >
                {/* Fulfilled by Carryofy Badge */}
                {isInStock && (
                  <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10">
                    <span className="inline-flex items-center gap-1 rounded-md bg-success-soft px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-success backdrop-blur-sm sm:text-[11px]">
                      In stock
                    </span>
                  </div>
                )}

                <div className="relative h-40 sm:h-52 lg:h-64 bg-surface-2 overflow-hidden">
                  {product.images?.[0] ? (
                    <Image
                      src={imageSrc}
                      alt={imageAlt}
                      fill
                      sizes={imageSizes}
                      className={imageClassName}
                    />
                  ) : (
                    <StockPhoto
                      src={imageSrc}
                      alt={imageAlt}
                      fill
                      sizes={imageSizes}
                      className={imageClassName}
                    />
                  )}

                  {/* Rating Badge */}
                  {product.averageRating && product.averageRating > 0 && (
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-white/95 backdrop-blur rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold text-gray-900 shadow-lg flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400 fill-yellow-400" />
                      {product.averageRating.toFixed(1)}
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-end justify-center pb-6">
                    <Link
                      href={`/buyer/products/${product.id}`}
                      className="bg-white text-gray-900 px-6 py-2.5 rounded-full font-bold transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-primary hover:text-white text-sm shadow-xl"
                    >
                      View Details
                    </Link>
                  </div>
                </div>

                <div className="p-3 sm:p-4 lg:p-6">
                  <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground/45 sm:mb-2">
                    {product.category}
                  </div>
                  <h3 className="mb-1 line-clamp-2 min-h-10 text-sm font-semibold text-foreground transition-colors group-hover:text-primary sm:mb-2 sm:min-h-12 sm:text-base lg:text-lg">
                    {(product as any).title || product.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2 sm:mt-4">
                    <span className="font-mono text-base font-semibold tabular-nums text-foreground sm:text-lg lg:text-xl">
                      {formatPrice(product.price)}
                    </span>
                    <Link
                      href={`/buyer/products/${product.id}`}
                      className="p-1.5 sm:p-2 rounded-full border border-border-strong bg-surface-2 text-foreground/70 hover:border-primary hover:bg-primary hover:text-[#1a0e00] transition-all duration-300 touch-target btn-mobile"
                    >
                      <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Link>
                  </div>

                  {product.seller?.businessName && (
                    <p className="mt-2 truncate text-[10px] text-foreground/45 sm:text-xs">
                      {product.seller.businessName}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Empty state */}
          {!loading && !error && products.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <div className="max-w-md mx-auto">
                <ShoppingBag className="w-16 h-16 text-foreground/25 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">No Products Available</h3>
                <p className="text-foreground/60">
                  Check back soon for amazing products from our merchants!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* View All Products Link - Only show if there are products */}
        {!loading && !error && products.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 sm:mt-12 lg:mt-16 text-center"
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