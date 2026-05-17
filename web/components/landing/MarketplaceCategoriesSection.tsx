'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Grid3X3 } from 'lucide-react';
import { useCategories } from '../../lib/shared/hooks/useCategories';
import { categoryDisplayName } from '../../lib/buyer/categoryDisplay';
import { getCategoryCoverImageUrl } from '../../lib/buyer/categoryCoverImage';
import BuyerCategoryCoverMedia from '../buyer/BuyerCategoryCoverMedia';

const CARD_W = 132;
const CARD_H = 168;

function CategoryTileSkeleton() {
  return (
    <motion.div
      className="shrink-0 animate-pulse overflow-hidden rounded-xl bg-zinc-200"
      style={{ width: CARD_W, height: CARD_H }}
    />
  );
}

export default function MarketplaceCategoriesSection() {
  const { data, isLoading } = useCategories();
  const categories = (data?.categories ?? [])
    .filter((c) => c.isActive !== false)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .slice(0, 12);

  if (!isLoading && categories.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-zinc-200/80 bg-white py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="landing-eyebrow inline-flex items-center gap-2">
              <Grid3X3 className="h-4 w-4 shrink-0" aria-hidden />
              Shop by category
            </p>
            <h2 className="landing-title mt-2 text-2xl sm:text-3xl">Browse the wholesale catalogue</h2>
            <p className="landing-lead mt-2 max-w-xl text-sm sm:text-base">
              Tap a category to see live SKUs, MOQs, and supplier listings — the same inventory
              retailers order on Carryofy.
            </p>
          </div>
          <Link
            href="/buyer/products"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-primary-dark"
          >
            View full marketplace
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <div className="flex gap-3 sm:gap-4" style={{ minWidth: 'min-content' }}>
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => <CategoryTileSkeleton key={i} />)}

            {!isLoading &&
              categories.map((cat, index) => {
                const cover = getCategoryCoverImageUrl(cat.slug, cat.name, cat.icon);
                const label = categoryDisplayName(cat.slug, cat.name);

                return (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.03 }}
                    className="shrink-0"
                  >
                    <Link
                      href={`/buyer/products?category=${encodeURIComponent(cat.slug)}`}
                      className="group relative block shrink-0 overflow-hidden rounded-xl shadow-md ring-1 ring-zinc-950/10 transition hover:-translate-y-0.5 hover:shadow-lg"
                      style={{ width: CARD_W, height: CARD_H }}
                      aria-label={`Browse ${label}`}
                    >
                      <div className="absolute inset-0 z-0">
                        <BuyerCategoryCoverMedia
                          src={cover}
                          alt=""
                          sizes={`${CARD_W}px`}
                          priority={index < 4}
                          categorySlug={cat.slug}
                          categoryName={cat.name}
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div
                        className="pointer-events-none absolute inset-0 z-[1] bg-linear-to-t from-zinc-950/90 via-zinc-950/40 to-zinc-950/15"
                        aria-hidden
                      />
                      <div className="absolute inset-x-0 bottom-0 z-[2] p-3">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug text-white">
                          {label}
                        </p>
                        {cat.productCount != null && cat.productCount > 0 && (
                          <p className="mt-1 text-[11px] font-medium text-zinc-300">
                            {cat.productCount} listing{cat.productCount === 1 ? '' : 's'}
                          </p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
          </div>
        </div>
      </div>
    </section>
  );
}
