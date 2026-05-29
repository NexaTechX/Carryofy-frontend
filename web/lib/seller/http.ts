import apiClient from '../api/client';
import { unwrapAxiosBody } from '../api/normalizeResponse';

/**
 * Authenticated GET for seller surfaces. Returns `null` on failure (matches legacy raw-fetch UX).
 */
export async function sellerGet<T>(path: string): Promise<T | null> {
  try {
    const { data } = await apiClient.get(path);
    return unwrapAxiosBody<T>(data);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[sellerGet] ${path}`, error);
    }
    return null;
  }
}

/** Authenticated PUT; returns `false` on failure (legacy raw-fetch parity). */
export async function sellerPut(path: string, body?: unknown): Promise<boolean> {
  try {
    await apiClient.put(path, body);
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[sellerPut] ${path}`, error);
    }
    return false;
  }
}
