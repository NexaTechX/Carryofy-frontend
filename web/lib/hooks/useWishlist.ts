import { useState, useEffect, useCallback } from 'react';
import { addToWishlist, removeFromWishlist, checkWishlist, getWishlist, WishlistItem } from '../api/wishlist';
import { tokenManager } from '../auth';

/**
 * Hook to manage wishlist state and operations
 * Provides wishlist status checking and toggle functionality
 */
export function useWishlist() {
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const isAuthenticated = tokenManager.isAuthenticated();

  const initializeWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setInitialized(true);
      setWishlistItems(new Set());
      return;
    }

    try {
      setLoading(true);
      const response = await getWishlist();
      const productIds = new Set(response.items.map(item => item.productId));
      setWishlistItems(productIds);
      setInitialized(true);
    } catch (error) {
      console.error('Error initializing wishlist:', error);
      setInitialized(true); // Set initialized even on error to prevent infinite loops
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Initialize wishlist on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && !initialized) {
      initializeWishlist();
    } else if (!isAuthenticated) {
      // Clear wishlist when user logs out
      setWishlistItems(new Set());
      setInitialized(true);
    }
  }, [isAuthenticated, initialized, initializeWishlist]);

  /**
   * Check if a product is in the wishlist
   */
  const isInWishlist = useCallback((productId: string): boolean => {
    if (!isAuthenticated) return false;
    return wishlistItems.has(productId);
  }, [isAuthenticated, wishlistItems]);

  /**
   * Toggle wishlist status for a product
   */
  const toggleWishlist = useCallback(async (productId: string): Promise<boolean> => {
    if (!isAuthenticated) {
      return false;
    }

    const currentlyInWishlist = wishlistItems.has(productId);
    
    try {
      setLoading(true);
      
      if (currentlyInWishlist) {
        await removeFromWishlist(productId);
        setWishlistItems(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        return false; // Now removed
      } else {
        await addToWishlist(productId);
        setWishlistItems(prev => {
          const next = new Set(prev);
          next.add(productId);
          return next;
        });
        return true; // Now added
      }
    } catch (error: any) {
      console.error('Error toggling wishlist:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, wishlistItems]);

  /**
   * Refresh wishlist from server
   */
  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) return;
    await initializeWishlist();
  }, [isAuthenticated, initializeWishlist]);

  return {
    isInWishlist,
    toggleWishlist,
    refreshWishlist,
    loading,
    initialized,
    wishlistCount: wishlistItems.size,
  };
}

