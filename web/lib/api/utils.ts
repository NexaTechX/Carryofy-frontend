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

