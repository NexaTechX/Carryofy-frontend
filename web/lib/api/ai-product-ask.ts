import { apiClient } from './client';

export async function askProductQuestion(
  productId: string,
  question: string,
): Promise<string> {
  const response = await apiClient.post('/ai/products/ask', { productId, question });
  const data = (response.data as { data?: { answer?: string } })?.data ?? response.data;
  return (data as { answer?: string })?.answer ?? '';
}
