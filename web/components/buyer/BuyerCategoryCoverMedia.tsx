'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import {
  categoryCoverShouldUseNextImage,
  getCategoryCoverFallbackUrl,
} from '../../lib/buyer/categoryCoverImage';

interface BuyerCategoryCoverMediaProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
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
}: BuyerCategoryCoverMediaProps) {
  const fallback = getCategoryCoverFallbackUrl();
  const [effectiveSrc, setEffectiveSrc] = useState(src);

  useEffect(() => {
    setEffectiveSrc(src);
  }, [src]);

  const handleError = useCallback(() => {
    setEffectiveSrc((current) => (current === fallback ? current : fallback));
  }, [fallback]);

  const useNext = categoryCoverShouldUseNextImage(effectiveSrc);

  if (useNext) {
    return (
      <div className="relative h-full w-full">
        <Image
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
      {/* eslint-disable-next-line @next/next/no-img-element -- admin-provided URLs may use hosts outside next/image remotePatterns */}
      <img
        key={effectiveSrc}
        src={effectiveSrc}
        alt={alt}
        className={`h-full w-full object-cover ${className}`}
        draggable={false}
        onError={handleError}
      />
    </div>
  );
}
