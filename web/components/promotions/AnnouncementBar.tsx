'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { getActivePromotions, type Promotion } from '../../lib/api/promotions';

function PromoLink({ promo }: { promo: Promotion }) {
  const isExternal =
    promo.redirectUrl?.startsWith('http://') ||
    promo.redirectUrl?.startsWith('https://');

  const text = promo.description ? `${promo.title} - ${promo.description}` : promo.title;
  if (promo.redirectUrl) {
    if (isExternal) {
      return (
        <a
          href={promo.redirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:no-underline"
        >
          {text}
        </a>
      );
    }
    return <Link href={promo.redirectUrl}>{text}</Link>;
  }
  return <span>{text}</span>;
}

export default function AnnouncementBar() {
  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions', 'TOP_ANNOUNCEMENT'],
    queryFn: () => getActivePromotions('TOP_ANNOUNCEMENT'),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !promotions?.length) return null;

  return (
    <div
      className="bg-primary text-center text-sm font-medium text-black py-2 px-4"
      role="region"
      aria-label="Announcement"
    >
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-2">
        {promotions.map((promo) => (
          <PromoLink key={promo.id} promo={promo} />
        ))}
      </div>
    </div>
  );
}
