/** Handles both wrapped (data.data) and unwrapped API responses. */
export function normalizeResponse<T>(response: unknown): T {
  if (!response || typeof response !== 'object') {
    return response as T;
  }

  const dataObj = response as Record<string, unknown>;

  if ('data' in dataObj && dataObj.data !== undefined) {
    return dataObj.data as T;
  }

  return response as T;
}
