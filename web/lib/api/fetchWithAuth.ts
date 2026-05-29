import { tokenManager } from '../auth/token';
import { getApiUrl } from './utils';
import { refreshAccessTokenAndGet } from './client';
import { unwrapAxiosBody } from './normalizeResponse';

export type FetchWithAuthInit = RequestInit & {
  /** When true (default), unwrap `{ data }` / TransformInterceptor envelopes from JSON bodies. */
  unwrapBody?: boolean;
};

/**
 * Authenticated `fetch` aligned with `apiClient` (Bearer token, refresh on 401, response unwrap).
 * Use for seller/legacy pages still on raw fetch — prefer `apiClient` for new code.
 */
export async function fetchWithAuth<T = unknown>(
  endpoint: string,
  init: FetchWithAuthInit = {},
): Promise<T> {
  const { unwrapBody = true, headers: initHeaders, ...rest } = init;
  const url = endpoint.startsWith('http') ? endpoint : getApiUrl(endpoint);

  const headers = new Headers(initHeaders);
  if (!headers.has('Content-Type') && rest.body && typeof rest.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const attachToken = () => {
    const token = tokenManager.getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  };

  attachToken();

  let response = await fetch(url, { ...rest, headers });

  if (response.status === 401) {
    const newToken = await refreshAccessTokenAndGet();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(url, { ...rest, headers });
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      (errorBody as { message?: string })?.message ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  const json: unknown = await response.json();
  return (unwrapBody ? unwrapAxiosBody<T>(json) : json) as T;
}
