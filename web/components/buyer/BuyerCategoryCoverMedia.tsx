'use client';

import Image from 'next/image';
import StockPhoto from '../common/StockPhoto';
import { useCallback, useEffect, useState } from 'react';
import {
  categoryCoverShouldUseNextImage,
  getCategoryCoverFallbackUrl,
  getCategoryCoverRemoteFallback,
} from '../../lib/buyer/categoryCoverImage';

interface BuyerCategoryCoverMediaProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  /** Used when primary URL fails (hotlink / expired CDN) */
  categorySlug?: string;
  categoryName?: string;
}

/**
 * Renders category cover art: Next/Image when the host is allow-listed for optimization, otherwise a plain img for arbitrary admin URLs.
 * Falls back to a curated default if the requested URL fails (broken admin URL, removed stock photo, etc.).
 */
export default function BuyerCategoryCoverMedia({
  src,
  alt,
  sizes,
  className = '',
  priority = false,
  categorySlug,
  categoryName,
}: BuyerCategoryCoverMediaProps) {
  const unsplashFallback = categorySlug
    ? getCategoryCoverRemoteFallback(categorySlug, categoryName ?? '')
    : getCategoryCoverFallbackUrl();
  const [effectiveSrc, setEffectiveSrc] = useState(src);

  useEffect(() => {
    setEffectiveSrc(src);
  }, [src]);

  const handleError = useCallback(() => {
    setEffectiveSrc((current) => {
      if (current === unsplashFallback) return current;
      return unsplashFallback;
    });
  }, [unsplashFallback]);

  const useNext = categoryCoverShouldUseNextImage(effectiveSrc);

  if (useNext) {
    return (
      <div className="relative h-full w-full">
        <StockPhoto
          key={effectiveSrc}
          src={effectiveSrc}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={className}
          draggable={false}
          onError={handleError}
        />
      </div>
    );
  }
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Image
        key={effectiveSrc}
        src={effectiveSrc}
        alt={alt}
        fill
        unoptimized
        className={`object-cover ${className}`}
        sizes={sizes}
        priority={priority}
        draggable={false}
        onError={handleError}
      />
    </div>
  );
}
