'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '../../lib/api/client';
import ProductCard, { ProductCardProduct } from '../common/ProductCard';

interface RelatedProductsProps {
  productId: string;
  title?: string;
  horizontalScroll?: boolean;
  className?: string;
}

interface RelatedResponse {
  products?: ProductCardProduct[];
  data?: { products?: ProductCardProduct[] };
}

interface ProductListResponse {
  products?: ProductCardProduct[];
  data?: { products?: ProductCardProduct[] };
}

function extractProducts(payload: unknown): ProductCardProduct[] {
  const data = payload as {
    products?: unknown;
    data?: { products?: unknown };
  };
  const list = data?.data?.products ?? data?.products ?? [];
  return Array.isArray(list) ? (list as ProductCardProduct[]) : [];
}

function RelatedProductsSkeleton({ horizontal }: { horizontal?: boolean }) {
  if (horizontal) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="shrink-0 w-[200px] sm:w-[220px] bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden animate-pulse"
          >
            <div className="aspect-square bg-white/5" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-white/10 rounded w-3/4" />
              <div className="h-4 bg-white/10 rounded w-1/2" />
              <div className="h-5 bg-white/10 rounded w-1/3 mt-3" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden animate-pulse"
        >
          <div className="aspect-square bg-white/5" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-white/10 rounded w-3/4" />
            <div className="h-4 bg-white/10 rounded w-1/2" />
            <div className="h-5 bg-white/10 rounded w-1/3 mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RelatedProducts({ productId, title = 'Related Products', horizontalScroll = false, className = '' }: RelatedProductsProps) {
  const [products, setProducts] = useState<ProductCardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const loadProducts = async () => {
      try {
        // Primary source: related endpoint tuned for product context.
        const relatedResponse = await apiClient.get<RelatedResponse>(`/products/${productId}/related`, {
          params: { limit: 8 },
        });
        const relatedProducts = extractProducts(relatedResponse.data);
        if (!cancelled && relatedProducts.length > 0) {
          setProducts(relatedProducts);
          return;
        }

        // Fallback source: popular catalog products so the section never disappears.
        const fallbackResponse = await apiClient.get<ProductListResponse>('/products', {
          params: { sortBy: 'popular', limit: 8, inStockOnly: true },
        });
        const fallbackProducts = extractProducts(fallbackResponse.data).filter((item) => item.id !== productId);
        if (!cancelled) {
          setProducts(fallbackProducts);
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error('Failed to load related products:', err);
        setError(err.response?.data?.message ?? err.message ?? 'Failed to load');
        setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  // Hide entirely when empty or errored.
  if (error || (!loading && products.length === 0)) {
    return null;
  }

  return (
    <section className={className} aria-label={title}>
      <h2 className="text-white text-2xl font-bold mb-6">{title}</h2>
      {loading ? (
        <RelatedProductsSkeleton horizontal={horizontalScroll} />
      ) : horizontalScroll ? (
        <div className="flex gap-4 md:gap-6 overflow-x-auto pb-2 -mx-1 scrollbar-thin scrollbar-thumb-[#FF6B00]/50 scrollbar-track-transparent">
          {products.slice(0, 6).map((product) => (
            <div key={product.id} className="shrink-0 w-[200px] sm:w-[240px] md:w-[260px]">
              <ProductCard product={product} showFeatures={true} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} showFeatures={true} />
          ))}
        </div>
      )}
    </section>
  );
}
