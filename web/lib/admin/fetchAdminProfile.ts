import apiClient from '../api/client';
import { normalizeResponse } from './normalizeResponse';
import type { AdminProfile } from './types';

/** Thin helper so AdminGuard does not import the full admin API barrel. */
export async function fetchAdminProfile(): Promise<AdminProfile> {
  const { data } = await apiClient.get('/users/me');
  return normalizeResponse<AdminProfile>(data);
}
