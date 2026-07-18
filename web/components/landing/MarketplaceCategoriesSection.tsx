'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Grid3X3 } from 'lucide-react';
import { useCategories } from '../../lib/shared/hooks/useCategories';
import { categoryDisplayName } from '../../lib/buyer/categoryDisplay';
import { getCategoryCoverImageUrl } from '../../lib/buyer/categoryCoverImage';
import BuyerCategoryCoverMedia from '../buyer/BuyerCategoryCoverMedia';

function CategoryTileSkeleton() {
  return (
    <div className="aspect-4/5 animate-pulse overflow-hidden rounded-xl bg-card" aria-hidden />
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
    <section className="border-b border-border-custom bg-background py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="landing-eyebrow inline-flex items-center gap-2">
              <Grid3X3 className="h-4 w-4 shrink-0" aria-hidden />
              Shop by category
            </p>
            <h2 className="landing-title mt-2 text-2xl sm:text-3xl">
              Wholesale categories retailers reorder weekly
            </h2>
            <p className="landing-lead mt-2 max-w-xl text-sm sm:text-base">
              Open an aisle, compare unit prices and MOQs, and build your next restock basket.
            </p>
          </div>
          <Link
            href="/buyer/products"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-primary-light"
          >
            View full marketplace
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => <CategoryTileSkeleton key={i} />)}

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
                  transition={{ delay: Math.min(index * 0.03, 0.24) }}
                >
                  <Link
                    href={`/buyer/products?category=${encodeURIComponent(cat.slug)}`}
                    className="group relative block aspect-4/5 overflow-hidden rounded-xl shadow-card ring-1 ring-border-custom transition hover:-translate-y-0.5 hover:ring-primary/60"
                    aria-label={`Browse ${label}`}
                  >
                    <div className="absolute inset-0 z-0">
                      <BuyerCategoryCoverMedia
                        src={cover}
                        alt=""
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                        priority={index < 6}
                        categorySlug={cat.slug}
                        categoryName={cat.name}
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div
                      className="pointer-events-none absolute inset-0 z-[1] bg-linear-to-t from-zinc-950/90 via-zinc-950/35 to-zinc-950/10"
                      aria-hidden
                    />
                    <div className="absolute inset-x-0 bottom-0 z-[2] p-3 sm:p-3.5">
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
    </section>
  );
}
