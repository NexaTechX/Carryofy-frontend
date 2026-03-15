'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { getActivePromotions, type Promotion } from '../../lib/api/promotions';

function PromotionBlock({ promo }: { promo: Promotion }) {
  const isExternal =
    promo.redirectUrl?.startsWith('http://') ||
    promo.redirectUrl?.startsWith('https://');
  const imgSrc =
    typeof window !== 'undefined' && window.innerWidth < 768 && promo.mobileImageUrl
      ? promo.mobileImageUrl
      : promo.imageUrl;

  const content = imgSrc ? (
    <div className="relative aspect-21/9 w-full min-h-[160px] md:min-h-[200px] overflow-hidden rounded-xl bg-[#0f1419]">
      <Image
        src={imgSrc}
        alt={promo.title}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 1200px"
        unoptimized={imgSrc.startsWith('https://res.cloudinary.com')}
      />
    </div>
  ) : (
    <div className="flex min-h-[120px] flex-col items-center justify-center rounded-xl bg-linear-to-r from-primary/20 to-primary/10 px-6 py-8 text-center">
      <p className="text-lg font-medium text-foreground">{promo.title}</p>
      {promo.description && (
        <p className="mt-2 max-w-2xl text-sm text-foreground/75">
          {promo.description}
        </p>
      )}
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
    return <Link href={promo.redirectUrl}>{content}</Link>;
  }
  return content;
}

export default function PromoBanner() {
  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions', 'HOMEPAGE_PROMO'],
    queryFn: () => getActivePromotions('HOMEPAGE_PROMO'),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !promotions?.length) return null;

  return (
    <section className="w-full px-4 py-6 md:py-8" aria-label="Promotional section">
      <div className="container mx-auto max-w-6xl space-y-4">
        {promotions.map((promo) => (
          <PromotionBlock key={promo.id} promo={promo} />
        ))}
      </div>
    </section>
  );
}
