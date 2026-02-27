// CF/web/lib/og.ts
// OG helpers for metadata and OG image route. No React/Next server-only imports.

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/**
 * Truncate text to a max character count, adding ellipsis if needed.
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).trimEnd() + '...';
}

/**
 * Format a kobo amount to a Naira display string.
 * e.g. 250000 → "₦2,500"
 */
export function formatNairaFromKobo(kobo: number): string {
  const naira = kobo / 100;
  return `₦${naira.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}

/**
 * Build the absolute URL for the product OG image endpoint.
 * Used in product page SEO so the image URL is absolute.
 */
export function buildProductOgImageUrl(
  productId: string,
  baseUrl: string
): string {
  return `${baseUrl}/api/og/product?id=${encodeURIComponent(productId)}`;
}

/**
 * Build the canonical product page URL (buyer product detail).
 */
export function buildProductUrl(productId: string, baseUrl: string): string {
  return `${baseUrl}/buyer/products/${productId}`;
}

/**
 * Get the base URL of the app from environment.
 * Always returns an absolute URL with no trailing slash.
 */
export function getBaseUrl(): string {
  let url = '';
  if (process.env.NEXT_PUBLIC_APP_URL) {
    url = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  } else if (process.env.NEXT_PUBLIC_SITE_URL) {
    url = process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  } else if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    url = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  } else {
    url = 'http://localhost:3001';
  }

  // Normalize naked carryofy.com to www.carryofy.com to avoid OG redirect issues
  if (url === 'https://carryofy.com') {
    return 'https://www.carryofy.com';
  }
  return url;
}
