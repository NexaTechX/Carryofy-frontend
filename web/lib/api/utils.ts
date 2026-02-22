/**
 * Get the API base URL with proper fallback
 * Uses environment variable or defaults to production API
 */
export const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com/api/v1';
};

/**
 * Get the API base URL without /api/v1 suffix (for manual endpoint construction)
 * Uses environment variable or defaults to production API base
 */
export const getApiBaseUrlWithoutSuffix = (): string => {
  const base = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
  // Remove /api/v1 if present
  return base.replace(/\/api\/v1$/, '');
};

/**
 * Construct full API URL with /api/v1 suffix
 */
export const getApiUrl = (endpoint: string = ''): string => {
  const base = getApiBaseUrlWithoutSuffix();
  const apiUrl = base.endsWith('/api/v1') ? base : `${base}/api/v1`;
  return endpoint ? `${apiUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}` : apiUrl;
};

/**
 * Format a date string or Date for display (date only).
 * Uses en-NG locale by default; pass opts to customize.
 */
export const formatDate = (
  date: string | Date,
  opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-NG', opts).format(d);
};

/**
 * Format a date string or Date for display (date and time).
 */
export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
};

/**
 * Format a kobo amount as NGN currency string.
 * All money values in the system are stored as integers in kobo.
 */
export const formatNgnFromKobo = (
  koboAmount: number,
  options: { maximumFractionDigits?: number } = {},
): string => {
  const { maximumFractionDigits = 0 } = options;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits,
  }).format((koboAmount || 0) / 100);
};

/**
 * Copy a value to clipboard (best-effort).
 * Returns true if the copy likely succeeded.
 */
export const copyToClipboard = async (value: string): Promise<boolean> => {
  if (!value) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
};

