// SECTION 1.4 — resolved: API_URL (origin) vs API_BASE (/api/v1) convention

/**
 * When `NEXT_PUBLIC_API_BASE` is unset, use local Nest API in development so login/API calls
 * work without copying `.env.example` (avoids Axios "Network Error" to production from localhost).
 */
function defaultRestApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE;
  }
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000/api/v1';
  }
  return 'https://api.carryofy.com/api/v1';
}

function defaultApiOrigin(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  return 'https://api.carryofy.com';
}

/**
 * REST API base including `/api/v1` — use for axios `apiClient`, server fetch to JSON API, etc.
 */
export const getApiBaseUrl = (): string => {
  return defaultRestApiBase();
};

/**
 * API origin only (no `/api/v1`) — use for Socket.IO (`${origin}/location`), health checks, etc.
 * Prefer `NEXT_PUBLIC_API_URL`; do not use `NEXT_PUBLIC_API_BASE` as a fallback (wrong semantics).
 */
export const getApiBaseUrlWithoutSuffix = (): string => {
  const raw = defaultApiOrigin();
  return raw.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
};

/**
 * Construct full API URL with /api/v1 suffix
 */
export const getApiUrl = (endpoint: string = ''): string => {
  const base = getApiBaseUrlWithoutSuffix();
  const apiUrl = base.endsWith('/api/v1') ? base : `${base}/api/v1`;
  return endpoint ? `${apiUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}` : apiUrl;
};

export function isApiConnectionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string; name?: string };
  return (
    e.code === 'ERR_NETWORK' ||
    e.code === 'ECONNREFUSED' ||
    e.message === 'Network Error' ||
    e.name === 'AbortError' ||
    (typeof e.message === 'string' &&
      (e.message.includes('fetch failed') || e.message.includes('Network Error')))
  );
}

export type ApiConnectionErrorContext = 'auth' | 'load' | 'save' | 'general';

const API_CONNECTION_USER_MESSAGES: Record<ApiConnectionErrorContext, string> = {
  auth: "Unable to sign in. We couldn't reach the server—please check your connection and try again.",
  load: "We couldn't load this content. Please check your connection and try again.",
  save: "We couldn't save your changes. Please check your connection and try again.",
  general: "Something went wrong. We couldn't reach the server—please try again.",
};

/** User-facing copy when the app cannot reach the Carryofy API. */
export function getApiConnectionErrorMessage(
  context: ApiConnectionErrorContext = 'general',
): string {
  return API_CONNECTION_USER_MESSAGES[context];
}

/** Developer diagnostics — never show this string in the UI. */
export function logApiConnectionError(
  error: unknown,
  context?: { action?: string; url?: string },
): void {
  console.error('API connection failed', {
    action: context?.action,
    url: context?.url,
    apiBase: getApiBaseUrl(),
    error,
    ...(process.env.NODE_ENV === 'development'
      ? {
          devHint:
            'Ensure the API is running (default http://localhost:3000) or set NEXT_PUBLIC_API_BASE in .env.local',
        }
      : {}),
  });
}

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

