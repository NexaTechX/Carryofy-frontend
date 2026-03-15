'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { getActivePromotions, type Promotion } from '../../lib/api/promotions';

interface CategoryBannerProps {
  categorySlug?: string;
}

function PromotionBlock({ promo }: { promo: Promotion }) {
  const isExternal =
    promo.redirectUrl?.startsWith('http://') ||
    promo.redirectUrl?.startsWith('https://');
  const imgSrc =
    typeof window !== 'undefined' && window.innerWidth < 768 && promo.mobileImageUrl
      ? promo.mobileImageUrl
      : promo.imageUrl;

  if (!imgSrc) {
    return (
      <div className="flex min-h-[80px] items-center justify-center rounded-lg bg-[#0f1419] px-4 py-6 text-center">
        <p className="font-medium text-foreground">{promo.title}</p>
      </div>
    );
  }

  const content = (
    <div className="relative aspect-[3/1] w-full min-h-[100px] overflow-hidden rounded-lg bg-[#0f1419]">
      <Image
        src={imgSrc}
        alt={promo.title}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 800px"
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
    return <Link href={promo.redirectUrl}>{content}</Link>;
  }
  return content;
}

export default function CategoryBanner({ categorySlug }: CategoryBannerProps) {
  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions', 'CATEGORY_PAGE', categorySlug ?? ''],
    queryFn: () =>
      getActivePromotions('CATEGORY_PAGE', categorySlug),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !promotions?.length) return null;

  return (
    <section className="w-full px-4 py-4" aria-label="Category promotion">
      <div className="container mx-auto max-w-6xl space-y-3">
        {promotions.map((promo) => (
          <PromotionBlock key={promo.id} promo={promo} />
        ))}
      </div>
    </section>
  );
}
