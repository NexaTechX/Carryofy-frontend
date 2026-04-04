import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { getPublicBanners, type MarketingBanner } from '../../lib/api/banners';

const ROTATE_MS = 5000;

function SlideLink({
  href,
  children,
}: {
  href?: string | null;
  children: ReactNode;
}) {
  const h = href?.trim();
  if (!h) {
    return <div className="relative block h-full w-full">{children}</div>;
  }
  if (h.startsWith('/') && !h.startsWith('//')) {
    return (
      <Link href={h} className="relative block h-full w-full">
        {children}
      </Link>
    );
  }
  return (
    <a href={h} target="_blank" rel="noopener noreferrer" className="relative block h-full w-full">
      {children}
    </a>
  );
}

function ShopSlide({ banner, priority }: { banner: MarketingBanner; priority: boolean }) {
  const headline = banner.headline?.trim() || 'Shop';
  const subline = banner.subline?.trim() || '';
  const cta = banner.ctaLabel?.trim() || 'Shop now';
  const href = banner.ctaUrl?.trim() || '/buyer/products';
  const src = banner.imageUrl.trim();

  return (
    <SlideLink href={href}>
      <div className="relative flex h-full min-h-[5rem] w-full items-center md:min-h-[7.5rem]">
        <Image
          src={src}
          alt={headline}
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority={priority}
        />
        <div className="absolute inset-0 bg-black/40" aria-hidden />
        <div className="relative z-10 flex w-full items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white drop-shadow md:text-base">{headline}</p>
            {subline ? (
              <p className="mt-0.5 line-clamp-2 text-xs text-white/90 drop-shadow md:text-sm">{subline}</p>
            ) : null}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-neutral-900 shadow md:px-4 md:py-2 md:text-sm">
            <ShoppingBag className="h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden />
            {cta}
          </span>
        </div>
      </div>
    </SlideLink>
  );
}

/**
 * Slim strip on buyer shop: active banners with placement Shop or Both.
 */
export default function BuyerShopPromoStrip() {
  const { data, isSuccess } = useQuery({
    queryKey: ['banners', 'public'],
    queryFn: getPublicBanners,
    staleTime: 2 * 60 * 1000,
  });

  const slides = useMemo(() => data?.shop?.filter((b) => b.imageUrl?.trim()) ?? [], [data?.shop]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex((i) => {
      if (slides.length === 0) return 0;
      return Math.min(i, slides.length - 1);
    });
  }, [slides.length]);

  const advance = useCallback(() => {
    if (slides.length <= 1) return;
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(advance, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [slides.length, advance]);

  if (!isSuccess || slides.length === 0) {
    return null;
  }

  const n = slides.length;

  return (
    <div
      className="w-full shrink-0 border-b border-border-custom bg-background"
      role="region"
      aria-roledescription={n > 1 ? 'carousel' : undefined}
      aria-label="Shop banners"
    >
      <div className="relative h-20 w-full overflow-hidden md:h-[120px]">
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((banner, i) => (
            <div key={banner.id} className="h-full min-w-full shrink-0">
              <ShopSlide banner={banner} priority={i === 0} />
            </div>
          ))}
        </div>
        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + n) % n)}
              className="absolute left-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white shadow backdrop-blur-sm md:left-3"
              aria-label="Previous banner"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % n)}
              className="absolute right-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white shadow backdrop-blur-sm md:right-3"
              aria-label="Next banner"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
