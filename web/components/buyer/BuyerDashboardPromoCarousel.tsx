import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
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

/** Brand fallback when no admin promos — marketplace-first hero. */
function DefaultMarketplaceHero() {
  return (
    <Link
      href="/buyer/products"
      className="group relative block w-full overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#111111] ring-1 ring-white/5"
    >
      <div className="relative aspect-[5/2] min-h-[120px] w-full sm:aspect-[21/9] sm:min-h-[140px]">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#E8630A] via-[#c45206] to-[#1a0a00]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#ffb347]/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-[#8b2f00]/25 blur-3xl"
          aria-hidden
        />
        <div className="relative flex h-full flex-col items-start justify-center px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-8">
          <div className="mb-4 flex max-w-xl flex-col sm:mb-0">
            <span className="mb-2 inline-flex w-fit items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/95 ring-1 ring-white/20">
              Carryofy marketplace
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm sm:text-3xl lg:text-4xl">
              Stock your store from verified Lagos vendors
            </h2>
            <p className="mt-2 max-w-lg text-sm font-medium text-white/90 sm:text-base">
              Fashion, beauty, electronics, grocery & more — delivered to you.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-white/10 p-2 ring-1 ring-white/20 sm:h-16 sm:w-16">
              <Image
                src="/logo.png"
                alt=""
                width={64}
                height={64}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-neutral-900 shadow-lg transition group-hover:bg-amber-50 sm:text-base">
              <ShoppingBag className="h-5 w-5 shrink-0" />
              Shop now
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function BuyerDashboardPromoCarousel() {
  const { data: promotions = [], isSuccess, isPending } = useQuery({
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
  }, [slides.length]);

  const showAdminCarousel = isSuccess && slides.length > 0;

  if (isPending || !showAdminCarousel) {
    return (
      <div
        className="-mx-3 mb-8 sm:-mx-4 lg:-mx-6 xl:-mx-8"
        role="region"
        aria-label="Featured"
      >
        <DefaultMarketplaceHero />
      </div>
    );
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
