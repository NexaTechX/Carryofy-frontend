import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import apiClient from '../api/client';
import { tokenManager, useAuth } from '../auth';
import { showSuccessToast, showErrorToast } from '../ui/toast';

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: number;
    images: string[];
    quantity: number;
    status: string;
  };
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  fetchCart: () => Promise<void>;
  updateQuantity: (itemId: string, newQuantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  refreshCart: () => Promise<void>;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<{ [key: string]: boolean }>({});

  const fetchCart = useCallback(async () => {
    if (!tokenManager.isAuthenticated()) {
      setCart(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/cart');
      
      // Handle API response wrapping
      const cartData = response.data.data || response.data;
      setCart(cartData);
    } catch (err: any) {
      console.error('Error fetching cart:', err);
      setError(err.response?.data?.message || 'Failed to load cart');
      // Don't set cart to null on error, keep previous state
    } finally {
      setLoading(false);
    }
  }, []);

  const updateQuantity = useCallback(async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      setUpdatingItems(prev => ({ ...prev, [itemId]: true }));
      const response = await apiClient.put(`/cart/items/${itemId}`, { quantity: newQuantity });
      
      // Handle API response wrapping
      const cartData = response.data.data || response.data;
      setCart(cartData);
      
      // Dispatch cart update event for other components
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err: any) {
      console.error('Error updating quantity:', err);
      showErrorToast(err.response?.data?.message || 'Failed to update quantity');
    } finally {
      setUpdatingItems(prev => ({ ...prev, [itemId]: false }));
    }
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    try {
      setUpdatingItems(prev => ({ ...prev, [itemId]: true }));
      const response = await apiClient.delete(`/cart/items/${itemId}`);

      const cartData = response.data.data || response.data;
      setCart(cartData);
      
      window.dispatchEvent(new Event('cartUpdated'));
      showSuccessToast('Item removed from cart');
    } catch (err: any) {
      console.error('Error removing item:', err);
      showErrorToast(err.response?.data?.message || 'Failed to remove item');
    } finally {
      setUpdatingItems(prev => ({ ...prev, [itemId]: false }));
    }
  }, []);

  const addToCart = useCallback(async (productId: string, quantity: number = 1) => {
    if (!tokenManager.isAuthenticated()) {
      showErrorToast('Please login to add items to cart');
      return;
    }

    try {
      const response = await apiClient.post('/cart/items', {
        productId,
        quantity,
      });

      // Refresh cart to get updated state
      await fetchCart();
      
      window.dispatchEvent(new Event('cartUpdated'));
      showSuccessToast('Product added to cart successfully!');
    } catch (err: any) {
      console.error('Error adding to cart:', err);
      showErrorToast(err.response?.data?.message || 'Failed to add product to cart');
    }
  }, [fetchCart]);

  const refreshCart = useCallback(async () => {
    await fetchCart();
  }, [fetchCart]);

  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen(prev => !prev);
  }, []);

  // Fetch cart when auth state changes (e.g. after login or on initial load when user is restored)
  useEffect(() => {
    fetchCart();
  }, [user, fetchCart]);

  // Listen for cart update events (e.g., when items are added)
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [fetchCart]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isDrawerOpen]);

  const value: CartContextType = {
    cart,
    loading,
    error,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    fetchCart,
    updateQuantity,
    removeItem,
    addToCart,
    refreshCart,
    cartCount: cart?.totalItems || 0,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
