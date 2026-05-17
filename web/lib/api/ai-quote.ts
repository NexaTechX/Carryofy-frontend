import { apiClient } from './client';

export interface QuoteSuggestResult {
  sellerResponse: string;
  items: { id: string; sellerQuotedPriceKobo?: number; sellerNotes?: string }[];
  suggestedValidUntil?: string;
}

export async function suggestQuoteResponse(quoteRequestId: string): Promise<QuoteSuggestResult> {
  const response = await apiClient.post('/ai/quotes/suggest', { quoteRequestId });
  const data = (response.data as { data?: QuoteSuggestResult })?.data ?? response.data;
  return data as QuoteSuggestResult;
}
