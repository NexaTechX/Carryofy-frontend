'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { getActivePromotions, type Promotion } from '../../lib/api/promotions';

function PromotionSlide({ promo }: { promo: Promotion }) {
  const isExternal =
    promo.redirectUrl?.startsWith('http://') ||
    promo.redirectUrl?.startsWith('https://');
  const imgSrc =
    typeof window !== 'undefined' && window.innerWidth < 768 && promo.mobileImageUrl
      ? promo.mobileImageUrl
      : promo.imageUrl;

  const content = (
    <div className="relative aspect-3/1 w-full min-h-[200px] overflow-hidden rounded-2xl bg-[#0f1419] md:min-h-[280px]">
      {imgSrc ? (
        <Image
          src={imgSrc}
          alt={promo.title}
          fill
          className="object-cover"
          sizes="100vw"
          unoptimized={imgSrc.startsWith('https://res.cloudinary.com')}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,107,0,0.32),transparent_45%),linear-gradient(135deg,#111827,#0f1419_55%,#1f2937)]" />
      )}
      <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/35 to-transparent" />
      <div className="relative flex h-full items-end p-6 md:p-8">
        <div className="max-w-2xl text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/90">
            Carryofy Promotion
          </p>
          <h2 className="mt-2 text-2xl font-semibold md:text-4xl">
            {promo.title}
          </h2>
          {promo.description && (
            <p className="mt-3 max-w-xl text-sm text-white/80 md:text-base">
              {promo.description}
            </p>
          )}
          {promo.redirectUrl && (
            <span className="mt-4 inline-flex items-center rounded-full bg-white/12 px-4 py-2 text-sm font-medium backdrop-blur">
              Explore offer
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (promo.redirectUrl) {
    if (isExternal) {
      return (
        <a
          href={promo.redirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {content}
        </a>
      );
    }
    return (
      <Link href={promo.redirectUrl} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

export default function HeroBanner() {
  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions', 'HOMEPAGE_HERO'],
    queryFn: () => getActivePromotions('HOMEPAGE_HERO'),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !promotions?.length) return null;

  return (
    <section className="w-full px-4 py-4 md:py-6" aria-label="Promotional banner">
      <div className="container mx-auto max-w-6xl">
        {promotions.length === 1 ? (
          <PromotionSlide promo={promotions[0]} />
        ) : (
          <div className="space-y-4">
            {promotions.map((promo) => (
              <PromotionSlide key={promo.id} promo={promo} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
