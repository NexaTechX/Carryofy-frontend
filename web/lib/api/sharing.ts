import apiClient from './client';

/** API may return payload directly or as { data: T } */
function unwrapData<T>(body: T | { data: T }): T {
  return body && typeof body === 'object' && 'data' in body && (body as { data: T }).data !== undefined
    ? (body as { data: T }).data
    : (body as T);
}

export interface ShareProductResponse {
  shareUrl: string;
  productId: string;
  platform?: string;
  sharedAt: string;
}

export interface SharePreviewResponse {
  title: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  canonicalUrl: string;
  availability: string;
}

export interface SharePlatformStats {
  platform: string;
  count: number;
  percentage: number;
}

export interface ShareRoleStats {
  role: string;
  count: number;
  percentage: number;
}

export interface RecentShare {
  id: string;
  platform?: string;
  userId?: string;
  userRole?: string;
  sharedAt: string;
}

export interface ProductShareAnalytics {
  productId: string;
  productTitle: string;
  totalShares: number;
  uniqueSharers: number;
  sharesByPlatform: SharePlatformStats[];
  sharesByRole: ShareRoleStats[];
  recentShares: RecentShare[];
}

export interface TopSharedProduct {
  productId: string;
  productTitle: string;
  shareCount: number;
  sellerId: string;
  sellerName: string;
}

export interface PlatformWideStats {
  platform: string;
  count: number;
  percentage: number;
}

export interface RoleWideStats {
  role: string;
  count: number;
  percentage: number;
}

export interface TimeTrendData {
  date: string;
  shareCount: number;
}

export interface PlatformWideAnalytics {
  totalShares: number;
  uniqueSharers: number;
  uniqueProducts: number;
  topSharedProducts: TopSharedProduct[];
  sharesByPlatform: PlatformWideStats[];
  sharesByRole: RoleWideStats[];
  timeTrends: TimeTrendData[];
}

export interface PlatformAnalyticsQuery {
  startDate?: string;
  endDate?: string;
  platform?: string;
  role?: string;
}

/**
 * Share a product
 */
export async function shareProduct(
  productId: string,
  platform?: string
): Promise<ShareProductResponse> {
  const response = await apiClient.post<ShareProductResponse>(
    `/products/${productId}/share`,
    { platform }
  );
  return unwrapData(response.data);
}

/**
 * Get share preview data for Open Graph
 */
export async function getSharePreview(
  productId: string
): Promise<SharePreviewResponse> {
  const response = await apiClient.get<SharePreviewResponse>(
    `/products/${productId}/share/preview`
  );
  return unwrapData(response.data);
}

/**
 * Get product share analytics
 */
export async function getShareAnalytics(
  productId: string
): Promise<ProductShareAnalytics> {
  const response = await apiClient.get<ProductShareAnalytics>(
    `/products/${productId}/share/analytics`
  );
  return unwrapData(response.data);
}

/**
 * Get platform-wide sharing analytics (admin only)
 */
export async function getPlatformWideAnalytics(
  query?: PlatformAnalyticsQuery
): Promise<PlatformWideAnalytics> {
  const response = await apiClient.get<PlatformWideAnalytics>(
    '/admin/sharing/analytics',
    { params: query }
  );
  return unwrapData(response.data);
}
