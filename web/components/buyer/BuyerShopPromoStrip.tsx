import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getActivePromotions, type Promotion } from '../../lib/api/promotions';

const ROTATE_MS = 5000;

function pickImageSrc(p: Promotion) {
  const d = p.imageUrl?.trim();
  const m = p.mobileImageUrl?.trim();
  return { desktop: d || m || '', mobile: m || d || '' };
}

function PromoLink({
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
    <a href={h} target="_blank" rel="noopener noreferrer" className="relative block h-full w-full">
      {children}
    </a>
  );
}

/**
 * Slim full-width promo strip for /buyer/products: one slide at a time, 5s rotation.
 * Renders nothing when there are no active promotions with images (zero layout height).
 */
export default function BuyerShopPromoStrip() {
  const { data: promotions = [], isSuccess } = useQuery({
    queryKey: ['promotions', 'BUYER_SHOP'],
    queryFn: () => getActivePromotions('BUYER_SHOP'),
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

  const advance = useCallback(() => {
    if (slides.length <= 1) return;
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(advance, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [slides.length, advance]);

  if (!isSuccess || slides.length === 0) {
    return null;
  }

  return (
    <div
      className="w-full shrink-0 border-b border-border-custom bg-background"
      role="region"
      aria-roledescription="carousel"
      aria-label="Shop promotions"
    >
      <div className="relative h-20 w-full overflow-hidden md:h-[120px]">
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((promo) => {
            const { desktop, mobile } = pickImageSrc(promo);
            const alt = promo.title?.trim() || 'Promotion';
            return (
              <div key={promo.id} className="h-full min-w-full shrink-0">
                <PromoLink href={promo.redirectUrl}>
                  <div className="relative h-full w-full">
                    {desktop ? (
                      <Image
                        src={desktop}
                        alt={alt}
                        fill
                        className="hidden object-cover object-center md:block"
                        sizes="100vw"
                        priority={slides[index]?.id === promo.id}
                      />
                    ) : null}
                    {mobile ? (
                      <Image
                        src={mobile}
                        alt={alt}
                        fill
                        className="object-cover object-center md:hidden"
                        sizes="100vw"
                        priority={slides[index]?.id === promo.id}
                      />
                    ) : null}
                  </div>
                </PromoLink>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
