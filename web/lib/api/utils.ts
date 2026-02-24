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
 * Format date as "21 Feb 2026, 23:58" (day month year, 24h)
 */
export const formatDetailDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const datePart = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
  const timePart = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
  return `${datePart}, ${timePart}`;
};

/**
 * Check if a date is yesterday (same calendar day as yesterday)
 */
export const isYesterday = (date: string | Date): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  );
};

/**
 * Format a date as relative time (e.g. "2h ago", "5m ago", "3d ago").
 */
export const formatRelativeTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diffSeconds < 60) return 'Just now';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
  return new Intl.DateTimeFormat('en-NG', { month: 'short', day: 'numeric' }).format(d);
};

/**
 * Format date as "Feb 23, 2026 · 2:30pm"
 */
export const formatDateWithTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const datePart = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
  const timePart = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
  return `${datePart} · ${timePart.toLowerCase()}`;
};

/**
 * Format a kobo amount as NGN currency string.
 * All money values in the system are stored as integers in kobo.
 */
/**
 * Format a kobo amount as NGN. Safe for null/undefined/NaN to avoid "₦NO" or invalid display.
 */
export const formatNgnFromKobo = (
  koboAmount: number | null | undefined,
  options: { maximumFractionDigits?: number } = {},
): string => {
  const { maximumFractionDigits = 0 } = options;
  const num = Number(koboAmount);
  const safeKobo = typeof num === 'number' && Number.isFinite(num) ? num : 0;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(safeKobo / 100);
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

