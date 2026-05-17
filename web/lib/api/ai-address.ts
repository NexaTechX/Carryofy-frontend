import { apiClient } from './client';

export interface NormalizedAddress {
  area: string;
  city: string;
  state: string;
  landmark?: string;
  deliveryNotes?: string;
}

export async function normalizeAddress(addressText: string): Promise<NormalizedAddress> {
  const response = await apiClient.post('/ai/address/normalize', {
    addressText,
    country: 'Nigeria',
  });
  const data = (response.data as { data?: NormalizedAddress })?.data ?? response.data;
  return data as NormalizedAddress;
}
