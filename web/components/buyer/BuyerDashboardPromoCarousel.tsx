import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getActivePromotions, type Promotion } from '../../lib/api/promotions';

const AUTO_MS = 4000;

function pickImageSrc(p: Promotion) {
  const d = p.imageUrl?.trim();
  const m = p.mobileImageUrl?.trim();
  return { desktop: d || m || '', mobile: m || d || '' };
}

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
    <a
      href={h}
      target="_blank"
      rel="noopener noreferrer"
      className="relative block h-full w-full"
    >
      {children}
    </a>
  );
}

export default function BuyerDashboardPromoCarousel() {
  const { data: promotions = [], isSuccess } = useQuery({
    queryKey: ['promotions', 'BUYER_DASHBOARD'],
    queryFn: () => getActivePromotions('BUYER_DASHBOARD'),
    staleTime: 5 * 60 * 1000,
  });

  const slides = useMemo(
    () => promotions.filter((p) => p.imageUrl?.trim() || p.mobileImageUrl?.trim()),
    [promotions],
  );

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex((i) => {
      if (slides.length === 0) return 0;
      return Math.min(i, slides.length - 1);
    });
  }, [slides.length]);

  const go = useCallback(
    (delta: number) => {
      if (slides.length === 0) return;
      setIndex((i) => (i + delta + slides.length) % slides.length);
    },
    [slides.length],
  );

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [slides.length, index]);

  if (!isSuccess || slides.length === 0) {
    return null;
  }

  const n = slides.length;

  return (
    <div
      className="-mx-3 mb-8 sm:-mx-4 lg:-mx-6 xl:-mx-8"
      role="region"
      aria-roledescription="carousel"
      aria-label="Promotional banners"
    >
      <div className="relative overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.65)] ring-1 ring-white/5">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((promo, slideIndex) => {
            const { desktop, mobile } = pickImageSrc(promo);
            const alt = promo.title?.trim() || 'Promotion';
            const isActive = slideIndex === index;
            return (
              <div key={promo.id} className="min-w-full shrink-0">
                <SlideLink href={promo.redirectUrl}>
                  <div className="relative aspect-[5/2] w-full min-h-[120px] sm:aspect-[21/9] sm:min-h-[140px]">
                    {desktop ? (
                      <Image
                        src={desktop}
                        alt={alt}
                        fill
                        className="hidden object-cover sm:block"
                        sizes="(min-width: 1280px) 1200px, 100vw"
                        priority={isActive}
                      />
                    ) : null}
                    {mobile ? (
                      <Image
                        src={mobile}
                        alt={alt}
                        fill
                        className="object-cover sm:hidden"
                        sizes="100vw"
                        priority={isActive}
                      />
                    ) : null}
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20"
                      aria-hidden
                    />
                  </div>
                </SlideLink>
              </div>
            );
          })}
        </div>

        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/80"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/80"
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <div
              className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2"
              role="tablist"
              aria-label="Slide indicators"
            >
              {slides.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === index
                      ? 'w-6 bg-[#FF6B00]'
                      : 'w-2 bg-white/35 hover:bg-white/55'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
