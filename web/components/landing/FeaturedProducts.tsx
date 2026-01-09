import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Star, Sparkles, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { Product } from '../../types/product';

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
      className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-md sm:shadow-lg border border-gray-100"
    >
      <div className="relative h-40 sm:h-52 lg:h-64 bg-gray-200 animate-pulse"></div>
      <div className="p-3 sm:p-4 lg:p-6 space-y-3">
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
        <div className="flex items-center justify-between mt-4">
          <div className="h-5 bg-gray-200 rounded animate-pulse w-1/4"></div>
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
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
        <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Products</h3>
        <p className="text-gray-600 mb-6">
          We're having trouble fetching the latest products. Please try again.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary-dark transition-all duration-300"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

// Format price to Nigerian Naira
function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(price);
}

export default function FeaturedProducts({ products = [], loading = false, error, onRetry }: FeaturedProductsProps) {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-purple-500/10 px-4 py-2 rounded-full border border-primary/20 mb-4"
          >
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-primary font-semibold tracking-wider uppercase text-xs sm:text-sm">
              Trending Now
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold mt-2 mb-3 sm:mb-4 text-gray-900"
          >
            Featured Products
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg"
          >
            Real products stocked in our warehouse. Delivered fast by Carryofy.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-8">
          {/* Loading state */}
          {loading && Array.from({ length: 5 }).map((_, index) => (
            <ProductSkeleton key={index} index={index} />
          ))}

          {/* Error state - only show if there are no products AND there's an error */}
          {error && !loading && products.length === 0 && <ErrorState onRetry={onRetry} />}

          {/* Products - Show only 3-5 real products */}
          {!loading && products.length > 0 && products.slice(0, 5).map((product, index) => {
            const isInStock = product.stockQuantity > 0;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group border border-gray-100 relative"
              >
                {/* Fulfilled by Carryofy Badge */}
                {isInStock && (
                  <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10">
                    <div className="bg-gradient-to-r from-primary to-orange-600 text-white px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide shadow-lg">
                      In stock — Fulfilled by Carryofy
                    </div>
                  </div>
                )}

                <div className="relative h-40 sm:h-52 lg:h-64 bg-gray-100 overflow-hidden">
                  <Image
                    src={product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />

                  {/* Rating Badge */}
                  {product.averageRating && product.averageRating > 0 && (
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-white/95 backdrop-blur rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold text-gray-900 shadow-lg flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400 fill-yellow-400" />
                      {product.averageRating.toFixed(1)}
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-end justify-center pb-6">
                    <Link
                      href={`/products/${product.id}`}
                      className="bg-white text-gray-900 px-6 py-2.5 rounded-full font-bold transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-primary hover:text-white text-sm shadow-xl"
                    >
                      View Details
                    </Link>
                  </div>
                </div>

                <div className="p-3 sm:p-4 lg:p-6">
                  <div className="text-[10px] sm:text-xs text-primary font-bold mb-1 sm:mb-2 uppercase tracking-wider">
                    {product.category}
                  </div>
                  <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2 sm:mt-4">
                    <span className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
                      {formatPrice(product.price)}
                    </span>
                    <Link
                      href={`/products/${product.id}`}
                      className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-primary hover:to-orange-600 hover:text-white transition-all duration-300 touch-target btn-mobile shadow-sm hover:shadow-md"
                    >
                      <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Link>
                  </div>

                  {/* Fulfilled by Carryofy indicator */}
                  {isInStock && (
                    <div className="mt-2 text-[10px] sm:text-xs text-primary font-semibold">
                      ✓ Fulfilled by Carryofy
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Empty state */}
          {!loading && !error && products.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <div className="max-w-md mx-auto">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Products Available</h3>
                <p className="text-gray-600">
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
              href="/products"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-orange-600 text-white rounded-full font-bold hover:shadow-lg hover:shadow-primary/40 transition-all duration-300 group text-base sm:text-lg touch-target"
            >
              View All Products
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
