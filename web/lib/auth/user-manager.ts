import { User } from './types';

/**
 * User manager utility for accessing user data outside React components
 * Syncs with localStorage for backward compatibility
 */
export const userManager = {
  /**
   * Get user from localStorage
   */
  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Set user in localStorage
   */
  setUser: (user: User): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  /**
   * Clear user from localStorage
   */
  clearUser: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  },
};

