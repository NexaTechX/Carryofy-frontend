import apiClient from './client';

/**
 * Wishlist API Service
 * Clean, production-ready implementation with proper error handling
 */

export interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    title: string;
    price: number;
    images: string[];
    quantity: number;
    status: string;
    seller?: {
      id: string;
      businessName: string;
    };
  };
}

export interface WishlistResponse {
  items: WishlistItem[];
  total: number;
}

/**
 * Normalize API response data
 * Handles both wrapped { data: {...} } and direct {...} response shapes
 */
function normalizeResponse<T>(responseData: any): T {
  return (responseData?.data ?? responseData) as T;
}

/**
 * Get user's wishlist
 */
export async function getWishlist(): Promise<WishlistResponse> {
  try {
    const response = await apiClient.get('/wishlist');
    return normalizeResponse<WishlistResponse>(response.data);
  } catch (error: any) {
    // Enhanced error logging for debugging
    console.error('Wishlist API Error:', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      code: error?.code,
    });
    
    // If it's a 500 error, provide helpful context
    if (error?.response?.status === 500) {
      console.error(
        '⚠️ Backend 500 Error - This usually means:\n' +
        '1. Database migration not applied (wishlist table missing)\n' +
        '2. Prisma Client out of sync\n' +
        '3. Database connection issue\n\n' +
        'Check backend logs for detailed error information.'
      );
    }
    
    throw error;
  }
}

/**
 * Add product to wishlist
 */
export async function addToWishlist(productId: string): Promise<WishlistResponse> {
  const response = await apiClient.post(`/wishlist/${productId}`);
  return normalizeResponse<WishlistResponse>(response.data);
}

/**
 * Remove product from wishlist
 */
export async function removeFromWishlist(productId: string): Promise<WishlistResponse> {
  const response = await apiClient.delete(`/wishlist/${productId}`);
  return normalizeResponse<WishlistResponse>(response.data);
}

/**
 * Check if product is in wishlist
 */
export async function checkWishlist(productId: string): Promise<boolean> {
  try {
    const response = await apiClient.get(`/wishlist/${productId}/check`);
    const data = normalizeResponse<{ inWishlist: boolean }>(response.data);
    return data?.inWishlist ?? false;
  } catch (error: any) {
    // Return false on error - product is not in wishlist if check fails
    console.error(`Error checking wishlist for product ${productId}:`, error);
    return false;
  }
}

