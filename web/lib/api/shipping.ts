import apiClient from './client';

export interface ShippingQuoteItem {
  productId: string;
  quantity: number;
}

export interface ShippingQuoteRequest {
  addressId: string;
  items: ShippingQuoteItem[];
  shippingMethod: 'STANDARD' | 'EXPRESS' | 'PICKUP';
}

export interface ShippingQuoteResponse {
  shippingFeeKobo: number;
  totalWeightKg: number;
}

export async function fetchShippingQuote(
  request: ShippingQuoteRequest
): Promise<ShippingQuoteResponse> {
  const response = await apiClient.post<ShippingQuoteResponse | { data: ShippingQuoteResponse }>(
    '/shipping/quote',
    request
  );
  const data = (response.data as { data?: ShippingQuoteResponse })?.data ?? response.data;
  return data as ShippingQuoteResponse;
}
