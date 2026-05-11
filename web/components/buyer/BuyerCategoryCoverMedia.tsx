import Image from 'next/image';
import { categoryCoverShouldUseNextImage } from '../../lib/buyer/categoryCoverImage';

interface BuyerCategoryCoverMediaProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}

/**
 * Renders category cover art: Next/Image when the host is allow-listed for optimization, otherwise a plain img for arbitrary admin URLs.
 */
export default function BuyerCategoryCoverMedia({
  src,
  alt,
  sizes,
  className = '',
  priority = false,
}: BuyerCategoryCoverMediaProps) {
  if (categoryCoverShouldUseNextImage(src)) {
    return (
      <div className="relative h-full w-full">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={className}
          draggable={false}
        />
      </div>
    );
  }
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element -- admin-provided URLs may use hosts outside next/image remotePatterns */}
      <img src={src} alt={alt} className={`h-full w-full object-cover ${className}`} draggable={false} />
    </div>
  );
}
