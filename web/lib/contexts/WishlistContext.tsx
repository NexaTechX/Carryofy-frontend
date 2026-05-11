import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { tokenManager, useAuth } from '../auth';
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  WishlistItem,
} from '../api/wishlist';

interface WishlistContextValue {
  items: WishlistItem[];
  loading: boolean;
  initialized: boolean;
  loadError: string | null;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
  /** Sync client state from a mutation response without an extra GET */
  replaceWishlistItems: (next: WishlistItem[]) => void;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadGenerationRef = useRef(0);

  const loadWishlist = useCallback(async () => {
    if (!tokenManager.isAuthenticated()) {
      setItems([]);
      setLoadError(null);
      setInitialized(true);
      setLoading(false);
      return;
    }

    const gen = ++loadGenerationRef.current;
    setLoading(true);
    setLoadError(null);
    try {
      const response = await getWishlist();
      if (gen !== loadGenerationRef.current) return;
      setItems(response.items || []);
    } catch (error: unknown) {
      if (gen !== loadGenerationRef.current) return;
      const err = error as { response?: { status?: number; data?: { message?: string } } };
      const msg =
        err.response?.status === 429
          ? 'Too many requests. Please wait a moment and try again.'
          : err.response?.data?.message || 'Failed to load saved items.';
      console.error('Wishlist load error:', error);
      setItems([]);
      setLoadError(msg);
    } finally {
      if (gen === loadGenerationRef.current) {
        setLoading(false);
        setInitialized(true);
      }
    }
  }, []);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    void loadWishlist();
  }, [authLoading, user?.id, loadWishlist]);

  const isInWishlist = useCallback(
    (productId: string) => items.some((i) => i.productId === productId),
    [items]
  );

  const refreshWishlist = useCallback(async () => {
    await loadWishlist();
  }, [loadWishlist]);

  const replaceWishlistItems = useCallback((next: WishlistItem[]) => {
    setItems(next);
    setLoadError(null);
  }, []);

  const toggleWishlist = useCallback(async (productId: string): Promise<boolean> => {
    if (!tokenManager.isAuthenticated()) {
      return false;
    }

    const currentlyIn = items.some((i) => i.productId === productId);
    try {
      if (currentlyIn) {
        const res = await removeFromWishlist(productId);
        setItems(res.items || []);
        return false;
      }
      const res = await addToWishlist(productId);
      setItems(res.items || []);
      return true;
    } catch (error: unknown) {
      console.error('Error toggling wishlist:', error);
      throw error;
    }
  }, [items]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      loading,
      initialized,
      loadError,
      isInWishlist,
      toggleWishlist,
      refreshWishlist,
      replaceWishlistItems,
      wishlistCount: items.length,
    }),
    [
      items,
      loading,
      initialized,
      loadError,
      isInWishlist,
      toggleWishlist,
      refreshWishlist,
      replaceWishlistItems,
    ]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return ctx;
}
