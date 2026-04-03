import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Grid3X3 } from 'lucide-react';
import type { Category } from '../../types/category';
import { categoryDisplayName } from '../../lib/buyer/categoryDisplay';

const CARD_W = 120;
const CARD_H = 140;
const GAP = 12;

/** Preset gradients when category has no `color` — Jumia-like saturated tiles */
const PRESET_GRADIENTS = [
  'linear-gradient(155deg, #ea580c 0%, #7c2d12 100%)',
  'linear-gradient(155deg, #2563eb 0%, #1e3a8a 100%)',
  'linear-gradient(155deg, #16a34a 0%, #14532d 100%)',
  'linear-gradient(155deg, #9333ea 0%, #581c87 100%)',
  'linear-gradient(155deg, #dc2626 0%, #7f1d1d 100%)',
  'linear-gradient(155deg, #0891b2 0%, #164e63 100%)',
  'linear-gradient(155deg, #ca8a04 0%, #713f12 100%)',
  'linear-gradient(155deg, #db2777 0%, #831843 100%)',
  'linear-gradient(155deg, #4f46e5 0%, #312e81 100%)',
  'linear-gradient(155deg, #0d9488 0%, #134e4a 100%)',
  'linear-gradient(155deg, #e11d48 0%, #881337 100%)',
  'linear-gradient(155deg, #65a30d 0%, #3f6212 100%)',
];

function hashIndex(str: string, mod: number) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

function categoryBackground(cat: Category): string {
  const c = cat.color?.trim();
  if (c && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(c)) {
    const hex = c.length === 4 ? expandShortHex(c) : c;
    return `linear-gradient(155deg, ${hex} 0%, #0f0f0f 100%)`;
  }
  return PRESET_GRADIENTS[hashIndex(cat.slug || cat.id, PRESET_GRADIENTS.length)];
}

function expandShortHex(short: string): string {
  if (short.length !== 4) return short;
  const r = short[1];
  const g = short[2];
  const b = short[3];
  return `#${r}${r}${g}${g}${b}${b}`;
}

type IconRenderer = ComponentType<{ className?: string }>;

interface BuyerCategoryStripProps {
  categories: Category[];
  loading: boolean;
  getCategoryIcon: (slug: string, name?: string) => IconRenderer;
}

export default function BuyerCategoryStrip({
  categories,
  loading,
  getCategoryIcon,
}: BuyerCategoryStripProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 4);
    setCanRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    const tick = () => requestAnimationFrame(() => updateArrows());
    tick();
    const t = window.setTimeout(tick, 100);
    const el = scrollerRef.current;
    if (!el) {
      return () => window.clearTimeout(t);
    }
    const ro = new ResizeObserver(() => updateArrows());
    ro.observe(el);
    return () => {
      window.clearTimeout(t);
      ro.disconnect();
    };
  }, [categories.length, loading, updateArrows]);

  const scrollBy = useCallback((dir: 'left' | 'right') => {
    const el = scrollerRef.current;
    if (!el) return;
    // ~8 cards worth on desktop, or most of viewport
    const step = Math.min(8 * (CARD_W + GAP), el.clientWidth * 0.85);
    el.scrollBy({ left: dir === 'left' ? -step : step, behavior: 'smooth' });
  }, []);

  if (loading) {
    return (
      <section className="mb-8" aria-label="Shop by category" aria-busy="true">
        <h2 className="mb-4 text-lg font-bold text-white">Categories</h2>
        <div className="flex gap-3 overflow-hidden pb-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 animate-pulse rounded-xl bg-[#1a1a1a]"
              style={{ width: CARD_W, height: CARD_H }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="mb-8" aria-label="Shop by category">
        <h2 className="mb-4 text-lg font-bold text-white">Categories</h2>
        <div className="rounded-xl border border-[#2a2a2a] bg-[#111111] py-8 text-center text-sm text-[#ffcc99]/70">
          Categories coming soon
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8" aria-label="Shop by category">
      <h2 className="mb-4 text-lg font-bold text-white">Categories</h2>

      <div className="relative mx-auto w-full max-w-[min(100%,1044px)]">
        {/* Left arrow */}
        <button
          type="button"
          aria-label="Scroll categories left"
          onClick={() => scrollBy('left')}
          disabled={!canLeft}
          className="absolute left-0 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#111111]/95 text-white shadow-lg backdrop-blur-sm transition hover:bg-[#1a1a1a] disabled:pointer-events-none disabled:opacity-0 sm:h-10 sm:w-10"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        <button
          type="button"
          aria-label="Scroll categories right"
          onClick={() => scrollBy('right')}
          disabled={!canRight}
          className="absolute right-0 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#111111]/95 text-white shadow-lg backdrop-blur-sm transition hover:bg-[#1a1a1a] disabled:pointer-events-none disabled:opacity-0 sm:h-10 sm:w-10"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <div
          ref={scrollerRef}
          onScroll={updateArrows}
          className="scrollbar-hide flex gap-3 overflow-x-auto pb-2 pl-10 pr-10 sm:pl-12 sm:pr-12"
          style={{ scrollSnapType: 'x proximity' }}
        >
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.slug, cat.name);
            const label = categoryDisplayName(cat.slug, cat.name);
            const bg = categoryBackground(cat);

            return (
              <Link
                key={cat.id}
                href={`/buyer/products?category=${cat.slug}`}
                className="group relative shrink-0 overflow-hidden rounded-xl shadow-[0_4px_14px_-4px_rgba(0,0,0,0.6)] ring-1 ring-white/10 transition hover:ring-primary/50 hover:brightness-105"
                style={{
                  width: CARD_W,
                  height: CARD_H,
                  scrollSnapAlign: 'start',
                }}
              >
                <div className="absolute inset-0" style={{ background: bg }} aria-hidden />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-white/10"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.07]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                  }}
                  aria-hidden
                />

                <div className="relative flex h-full flex-col items-center px-1.5 pt-3 pb-2">
                  <div className="flex min-h-0 flex-1 items-center justify-center">
                    <div className="rounded-2xl bg-white/15 p-2.5 ring-2 ring-white/25 shadow-inner backdrop-blur-[2px]">
                      <Icon className="h-8 w-8 text-white drop-shadow-md" aria-hidden />
                    </div>
                  </div>
                  <p className="line-clamp-2 w-full text-center text-[10px] font-bold leading-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
                    {label}
                  </p>
                </div>
              </Link>
            );
          })}

          {/* See All — same footprint */}
          <Link
            href="/buyer/products"
            className="relative flex shrink-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-[#FF6B00] via-[#c2410c] to-[#1c1917] px-2 py-3 shadow-[0_4px_14px_-4px_rgba(234,88,12,0.5)] ring-1 ring-white/15 transition hover:brightness-110"
            style={{
              width: CARD_W,
              height: CARD_H,
              scrollSnapAlign: 'start',
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"
              aria-hidden
            />
            <div className="relative flex flex-col items-center gap-1.5">
              <div className="rounded-2xl bg-white/20 p-2.5 ring-2 ring-white/35">
                <Grid3X3 className="h-7 w-7 text-white" aria-hidden />
              </div>
              <span className="text-center text-[11px] font-extrabold uppercase tracking-wide text-white drop-shadow">
                See All
              </span>
              <ChevronRight className="h-4 w-4 text-white/90" aria-hidden />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
