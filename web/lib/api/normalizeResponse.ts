import type { AxiosResponse } from 'axios';

/**
 * Unwrap a single `data` property when present (axios body or nested payload).
 */
export function normalizeResponse<T>(response: unknown): T {
  if (!response || typeof response !== 'object') {
    return response as T;
  }

  const record = response as Record<string, unknown>;

  if ('data' in record && record.data !== undefined) {
    return record.data as T;
  }

  return response as T;
}

/**
 * Unwrap NestJS TransformInterceptor envelope: `{ success, statusCode, message, data }`.
 */
export function unwrapApiEnvelope<T = unknown>(raw: unknown): T {
  if (!raw || typeof raw !== 'object') {
    return raw as T;
  }

  const record = raw as Record<string, unknown>;

  if ('data' in record && ('statusCode' in record || 'success' in record)) {
    return record.data as T;
  }

  return raw as T;
}

/**
 * Full unwrap: interceptor envelope, then nested `data`, for axios responses.
 */
export function extractAxiosData<T>(response: AxiosResponse<unknown> | { data?: unknown }): T {
  const body = response?.data;

  if (body && typeof body === 'object' && body !== null) {
    const record = body as Record<string, unknown>;

    if ('statusCode' in record && 'data' in record) {
      return record.data as T;
    }

    if ('data' in record && typeof record.data === 'object') {
      return record.data as T;
    }
  }

  return normalizeResponse<T>(unwrapApiEnvelope(body));
}

/**
 * Unwrap axios `response.data` (common shortcut for apiClient calls).
 */
export function unwrapAxiosBody<T>(axiosData: unknown): T {
  return normalizeResponse<T>(unwrapApiEnvelope(axiosData));
}
