'use client';

import { useState, useEffect, useCallback } from 'react';
import FeaturedProducts from './FeaturedProducts';
import { getFeaturedProducts } from '../../lib/api/products';
import { Product } from '../../types/product';

export default function FeaturedProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFeaturedProducts(5);
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to fetch featured products:', err);
      setError('Unable to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <FeaturedProducts
      products={products}
      loading={loading}
      error={error || undefined}
      onRetry={fetchProducts}
    />
  );
}
