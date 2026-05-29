import apiClient from './client';
import { unwrapAxiosBody } from './normalizeResponse';

export type BannerPlacement = 'HERO' | 'SHOP' | 'BOTH';

export interface MarketingBanner {
  id: string;
  imageUrl: string;
  headline: string;
  subline: string;
  ctaLabel: string;
  ctaUrl: string;
  placement: BannerPlacement;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicBannersResponse {
  hero: MarketingBanner[];
  shop: MarketingBanner[];
}

/** Copy shown on buyer hero (carousel + mobile home card) — keep in sync with buyer marketing defaults. */
export const BUYER_HERO_DEFAULT_HEADLINE = 'Everything your business needs, delivered in Lagos';
export const BUYER_HERO_DEFAULT_SUBLINE =
  'Verified vendors, wholesale-friendly ordering, and coordinated delivery — built for retailers who move fast.';
export const BUYER_HERO_DEFAULT_CTA = 'Shop Now';
export const BUYER_HERO_DEFAULT_CTA_HREF = '/buyer/products';

export type BuyerHeroCopy = {
  headline: string;
  subline: string;
  ctaLabel: string;
  ctaUrl: string;
};

export function heroCopyFromBanner(b: MarketingBanner): BuyerHeroCopy {
  return {
    headline: b.headline?.trim() || BUYER_HERO_DEFAULT_HEADLINE,
    subline: b.subline?.trim() || BUYER_HERO_DEFAULT_SUBLINE,
    ctaLabel: b.ctaLabel?.trim() || BUYER_HERO_DEFAULT_CTA,
    ctaUrl: b.ctaUrl?.trim() || BUYER_HERO_DEFAULT_CTA_HREF,
  };
}

export function defaultBuyerHeroCopy(): BuyerHeroCopy {
  return {
    headline: BUYER_HERO_DEFAULT_HEADLINE,
    subline: BUYER_HERO_DEFAULT_SUBLINE,
    ctaLabel: BUYER_HERO_DEFAULT_CTA,
    ctaUrl: BUYER_HERO_DEFAULT_CTA_HREF,
  };
}

export async function getPublicBanners(): Promise<PublicBannersResponse> {
  const response = await apiClient.get('/banners/public');
  return unwrapAxiosBody<PublicBannersResponse>(response.data);
}
