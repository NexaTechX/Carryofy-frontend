import apiClient from './client';

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

function normalize<T>(response: unknown): T {
  const obj = response as Record<string, unknown>;
  if (obj?.data != null && typeof obj.data === 'object') {
    return obj.data as T;
  }
  return response as T;
}

export async function getPublicBanners(): Promise<PublicBannersResponse> {
  const response = await apiClient.get('/banners/public');
  return normalize<PublicBannersResponse>(response.data);
}
