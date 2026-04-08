import apiClient from './client';

export interface ShippingQuoteItem {
  productId: string;
  quantity: number;
}

export interface ShippingQuoteRequest {
  addressId: string;
  items: ShippingQuoteItem[];
  shippingMethod: 'STANDARD' | 'EXPRESS' | 'SCHEDULED' | 'PICKUP';
  cartSubtotalKobo?: number;
  /** SECTION 7.3 — must match checkout orderType */
  orderType?: 'CONSUMER' | 'B2B';
}

export interface ShippingQuoteResponse {
  shippingFeeKobo: number;
  totalWeightKg?: number;
  quoteExpiresAt?: string;
  riderCostKobo?: number;
  pricingTier?: string;
  appliedDiscount?: string | null;
}

/** Backend only accepts STANDARD | PICKUP. Map EXPRESS/SCHEDULED to STANDARD. */
const API_SHIPPING_METHOD = (
  m: ShippingQuoteRequest['shippingMethod']
): 'STANDARD' | 'PICKUP' =>
  m === 'PICKUP' ? 'PICKUP' : 'STANDARD';

export async function fetchShippingQuote(
  request: ShippingQuoteRequest
): Promise<ShippingQuoteResponse> {
  const payload = {
    ...request,
    shippingMethod: API_SHIPPING_METHOD(request.shippingMethod),
  };
  const response = await apiClient.post<ShippingQuoteResponse | { data: ShippingQuoteResponse }>(
    '/shipping/quote',
    payload
  );
  const data = (response.data as { data?: ShippingQuoteResponse })?.data ?? response.data;
  return data as ShippingQuoteResponse;
}
