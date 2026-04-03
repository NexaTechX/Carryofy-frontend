import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles } from 'lucide-react';
import { getActivePromotions, type Promotion } from '../../lib/api/promotions';

/** Auto-advance interval for multi-slide admin banners */
const AUTO_MS = 5000;

const HERO_CLASS = 'relative h-[200px] w-full overflow-hidden md:h-[320px]';

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

/**
 * Rich default slide — orange→dark gradient, depth, pattern, headline + Shop Now.
 * Full slide links to catalog (not a flat card).
 */
function DefaultBrandSlide() {
  return (
    <Link
      href="/buyer/products"
      className="group relative flex h-full w-full min-h-0 flex-col justify-center overflow-hidden"
    >
      {/* Base gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#FF6B00] via-[#c2410c] to-[#0a0705]"
        aria-hidden
      />
      {/* Secondary depth */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-orange-400/15"
        aria-hidden
      />
      {/* Warm spotlight */}
      <div
        className="pointer-events-none absolute -left-10 top-0 h-[120%] w-[55%] bg-gradient-to-r from-amber-300/25 via-orange-500/10 to-transparent blur-3xl"
        aria-hidden
      />
      {/* Cool edge */}
      <div
        className="pointer-events-none absolute -right-8 bottom-0 h-[85%] w-[45%] rounded-full bg-[#1c1917]/80 blur-3xl"
        aria-hidden
      />
      {/* Mesh orbs */}
      <div
        className="pointer-events-none absolute right-[8%] top-[12%] h-32 w-32 rounded-full bg-[#fbbf24]/20 blur-2xl md:h-48 md:w-48"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[5%] left-[20%] h-40 w-40 rounded-full bg-[#ea580c]/30 blur-3xl md:h-56 md:w-56"
        aria-hidden
      />
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
        aria-hidden
      />
      {/* Diagonal gloss */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.12] via-transparent to-transparent opacity-80"
        aria-hidden
      />
      {/* Large watermark */}
      <span
        className="pointer-events-none absolute -right-2 bottom-0 select-none font-black uppercase leading-none text-white/[0.06] md:-right-4 md:bottom-2"
        style={{ fontSize: 'clamp(4rem, 18vw, 12rem)' }}
        aria-hidden
      >
        Lagos
      </span>

      <div className="relative z-10 flex h-full flex-col justify-center px-5 py-5 md:flex-row md:items-center md:justify-between md:px-10 md:py-8 lg:px-12">
        <div className="max-w-xl md:max-w-2xl lg:max-w-3xl">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-black/25 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-100 ring-1 ring-white/20 backdrop-blur-sm md:text-xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-200" aria-hidden />
            Carryofy
          </span>
          <h2 className="text-balance font-black leading-[1.08] tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)] [text-shadow:0_2px_20px_rgba(0,0,0,0.35)] text-[1.65rem] sm:text-3xl md:text-4xl lg:text-5xl">
            Everything your business needs, delivered in Lagos
          </h2>
          <p className="mt-2 max-w-lg text-sm font-medium leading-relaxed text-white/90 md:mt-3 md:text-base lg:text-lg">
            Verified vendors, wholesale-friendly ordering, and coordinated delivery — built for retailers who
            move fast.
          </p>
          <span className="mt-4 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-base font-bold text-neutral-900 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.5)] transition group-hover:scale-[1.02] group-hover:bg-amber-50 group-active:scale-[0.99] md:mt-6 md:px-8 md:py-3.5">
            <ShoppingBag className="h-5 w-5 shrink-0" aria-hidden />
            Shop Now
          </span>
        </div>

        <div className="pointer-events-none relative mt-4 hidden shrink-0 md:mt-0 md:flex md:items-center md:justify-center">
          <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-white/10 p-3 shadow-2xl ring-2 ring-white/25 backdrop-blur-md lg:h-36 lg:w-36">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent opacity-60" />
            <Image
              src="/logo.png"
              alt=""
              width={120}
              height={120}
              className="relative h-full w-full object-contain drop-shadow-lg"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

function HeroSkeleton() {
  return (
    <div className={`${HERO_CLASS} rounded-2xl bg-gradient-to-br from-[#1a1512] to-[#0a0908]`}>
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
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

  if (isPending) {
    return (
      <div className="-mx-3 mb-8 sm:-mx-4 lg:-mx-6 xl:-mx-8" role="region" aria-label="Featured" aria-busy="true">
        <HeroSkeleton />
      </div>
    );
  }

  if (!showAdminCarousel) {
    return (
      <div className="-mx-3 mb-8 sm:-mx-4 lg:-mx-6 xl:-mx-8" role="region" aria-label="Featured">
        <div
          className={`${HERO_CLASS} rounded-2xl border border-white/10 shadow-[0_24px_80px_-20px_rgba(234,88,12,0.45)] ring-1 ring-white/10`}
        >
          <DefaultBrandSlide />
        </div>
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
      <div
        className={`relative overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#0d0d0d] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.85)] ring-1 ring-white/5 ${HERO_CLASS}`}
      >
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((promo, slideIndex) => {
            const { desktop, mobile } = pickImageSrc(promo);
            const alt = promo.title?.trim() || 'Promotion';
            const isActive = slideIndex === index;
            return (
              <div key={promo.id} className="h-full min-w-full shrink-0">
                <SlideLink href={promo.redirectUrl}>
                  <div className="relative h-full w-full min-h-0 overflow-hidden">
                    {desktop ? (
                      <Image
                        src={desktop}
                        alt={alt}
                        fill
                        className="hidden object-cover object-center sm:block"
                        sizes="100vw"
                        priority={isActive}
                      />
                    ) : null}
                    {mobile ? (
                      <Image
                        src={mobile}
                        alt={alt}
                        fill
                        className="object-cover object-center sm:hidden"
                        sizes="100vw"
                        priority={isActive}
                      />
                    ) : null}
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/25"
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
              className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white shadow-lg backdrop-blur-md transition hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/80 md:left-4"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white shadow-lg backdrop-blur-md transition hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/80 md:right-4"
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {n > 1 && (
          <div
            className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2 md:bottom-4"
            role="tablist"
            aria-label="Slide indicators"
          >
            {slides.map((p, i) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Slide ${i + 1} of ${n}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index
                    ? 'w-7 bg-[#FF6B00] shadow-[0_0_12px_rgba(255,107,0,0.6)]'
                    : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
