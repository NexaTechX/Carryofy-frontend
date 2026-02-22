'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '../../lib/api/client';
import ProductCard, { ProductCardProduct } from '../common/ProductCard';

interface RelatedProductsProps {
  productId: string;
}

interface RelatedResponse {
  products?: ProductCardProduct[];
  data?: { products?: ProductCardProduct[] };
}

function RelatedProductsSkeleton() {
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

export default function RelatedProducts({ productId }: RelatedProductsProps) {
  const [products, setProducts] = useState<ProductCardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    apiClient
      .get<RelatedResponse>(`/products/${productId}/related`, {
        params: { limit: 8 },
      })
      .then((response) => {
        if (cancelled) return;
        const data = response.data as any;
        const list =
          data?.data?.products ?? data?.products ?? [];
        setProducts(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load related products:', err);
        setError(err.response?.data?.message ?? err.message ?? 'Failed to load');
        setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (error || (!loading && products.length === 0)) {
    return null;
  }

  return (
    <section className="mt-16 pt-12 border-t border-white/10" aria-label="Related products">
      <h2 className="text-white text-2xl font-bold mb-6">Related Products</h2>
      {loading ? (
        <RelatedProductsSkeleton />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showFeatures={true}
            />
          ))}
        </div>
      )}
    </section>
  );
}
