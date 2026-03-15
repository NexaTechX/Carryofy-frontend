import apiClient from './client';

export type PromotionPlacement =
  | 'HOMEPAGE_HERO'
  | 'TOP_ANNOUNCEMENT'
  | 'HOMEPAGE_PROMO'
  | 'CATEGORY_PAGE';

export interface Promotion {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  mobileImageUrl?: string | null;
  redirectUrl?: string | null;
  placement: PromotionPlacement;
  categorySlug?: string | null;
  priority: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  campaignId?: string | null;
  campaignName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionsListResponse {
  promotions: Promotion[];
}

function normalize<T>(response: unknown): T {
  const obj = response as Record<string, unknown>;
  if (obj?.data != null && typeof obj.data === 'object') {
    return obj.data as T;
  }
  return response as T;
}

export async function getActivePromotions(
  placement?: PromotionPlacement,
  categorySlug?: string
): Promise<Promotion[]> {
  const params = new URLSearchParams();
  if (placement) params.set('placement', placement);
  if (categorySlug) params.set('categorySlug', categorySlug);
  const query = params.toString();
  const url = query ? `/promotions?${query}` : '/promotions';
  const response = await apiClient.get(url);
  const data = normalize<PromotionsListResponse>(response.data);
  return data.promotions ?? [];
}
