import { apiClient } from './client';

export interface ParsedOrderLine {
  rawLabel: string;
  quantity: number;
  suggestedProductId?: string;
  title?: string;
  unitPriceKobo?: number;
  confidence: 'high' | 'medium' | 'low' | 'none';
}

export async function parseOrderList(
  text: string,
  sellerId?: string,
): Promise<ParsedOrderLine[]> {
  const response = await apiClient.post('/ai/orders/parse-list', { text, sellerId });
  const data = (response.data as { data?: { lines?: ParsedOrderLine[] } })?.data ?? response.data;
  return (data as { lines?: ParsedOrderLine[] })?.lines ?? [];
}
