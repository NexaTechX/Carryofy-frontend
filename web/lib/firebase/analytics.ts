import { getAnalyticsInstance } from './config';
import { logEvent, EventParams } from 'firebase/analytics';

/**
 * Track a custom event in Firebase Analytics
 * @param eventName - Name of the event to track
 * @param eventParams - Optional parameters for the event
 */
export const trackEvent = (eventName: string, eventParams?: EventParams): void => {
  const analyticsInstance = getAnalyticsInstance();
  if (analyticsInstance && typeof window !== 'undefined') {
    try {
      logEvent(analyticsInstance, eventName, eventParams);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }
};

/**
 * Track page views
 * @param pagePath - The path of the page
 * @param pageTitle - The title of the page
 */
export const trackPageView = (pagePath: string, pageTitle?: string): void => {
  trackEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle || document.title,
  });
};

/**
 * Track user actions
 */
export const analyticsEvents = {
  // Authentication events
  login: (method: string = 'email') => trackEvent('login', { method }),
  signup: (method: string = 'email') => trackEvent('sign_up', { method }),
  logout: () => trackEvent('logout'),

  // Product events
  viewProduct: (productId: string, productName: string, category?: string) =>
    trackEvent('view_item', {
      item_id: productId,
      item_name: productName,
      item_category: category,
    }),
  addToCart: (productId: string, productName: string, price?: number, quantity: number = 1) =>
    trackEvent('add_to_cart', {
      currency: 'NGN',
      value: price,
      items: [
        {
          item_id: productId,
          item_name: productName,
          quantity,
          price,
        },
      ],
    }),
  removeFromCart: (productId: string, productName: string) =>
    trackEvent('remove_from_cart', {
      currency: 'NGN',
      items: [
        {
          item_id: productId,
          item_name: productName,
        },
      ],
    }),
  addToWishlist: (productId: string, productName: string) =>
    trackEvent('add_to_wishlist', {
      currency: 'NGN',
      items: [
        {
          item_id: productId,
          item_name: productName,
        },
      ],
    }),

  // Purchase events
  beginCheckout: (value: number, currency: string = 'NGN') =>
    trackEvent('begin_checkout', { value, currency }),
  purchase: (transactionId: string, value: number, currency: string = 'NGN', items?: any[]) =>
    trackEvent('purchase', {
      transaction_id: transactionId,
      value,
      currency,
      items,
    }),

  // Search events
  search: (searchTerm: string) => trackEvent('search', { search_term: searchTerm }),

  // Custom events
  buttonClick: (buttonName: string, location?: string) =>
    trackEvent('button_click', { button_name: buttonName, location }),
  formSubmit: (formName: string, success: boolean) =>
    trackEvent('form_submit', { form_name: formName, success }),
};
