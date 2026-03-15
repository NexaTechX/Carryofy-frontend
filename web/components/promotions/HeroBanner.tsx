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

  if (!imgSrc) return null;

  const content = (
    <div className="relative aspect-[3/1] w-full min-h-[200px] md:min-h-[280px] overflow-hidden rounded-xl bg-[#0f1419]">
      <Image
        src={imgSrc}
        alt={promo.title}
        fill
        className="object-cover"
        sizes="100vw"
        unoptimized={imgSrc.startsWith('https://res.cloudinary.com')}
      />
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
