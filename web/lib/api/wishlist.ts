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
    console.log('🔍 Fetching wishlist from API...');
    const startTime = Date.now();
    
    const response = await apiClient.get('/wishlist');
    
    const duration = Date.now() - startTime;
    console.log(`✅ Wishlist fetched successfully in ${duration}ms`);
    
    return normalizeResponse<WishlistResponse>(response.data);
  } catch (error: any) {
    const duration = Date.now() - Date.now();
    
    // Enhanced error logging for debugging
    console.error('❌ Wishlist API Error:', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      code: error?.code,
      url: error?.config?.baseURL + error?.config?.url,
      duration: `${duration}ms`,
    });
    
    // If it's a timeout error
    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      console.error(
        '⏱️ Request Timeout - The API request took too long to respond.\n' +
        'Possible causes:\n' +
        '1. Backend server is slow or overloaded\n' +
        '2. Database query is hanging (check for missing indexes)\n' +
        '3. Network connectivity issues\n' +
        '4. Large wishlist dataset taking too long to fetch\n\n' +
        'Check backend logs for the /wishlist endpoint.'
      );
    }
    
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
    
    // If it's a network error
    if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED') {
      console.error(
        '🔌 Network Error - Cannot connect to backend.\n' +
        'Please ensure:\n' +
        '1. Backend server is running on the correct port\n' +
        '2. NEXT_PUBLIC_API_BASE environment variable is set correctly\n' +
        `3. Current API URL: ${error?.config?.baseURL || 'not set'}\n` +
        '4. Expected API URL: http://localhost:3000/api/v1'
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

