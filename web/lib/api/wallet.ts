import apiClient from './client';

export type WalletTransactionType = 'REFERRAL_REWARD' | 'CASHBACK' | 'REFUND_CREDIT' | 'CHECKOUT_SPEND';

export interface WalletTransaction {
  id: string;
  amountKobo: number;
  type: WalletTransactionType;
  orderId: string | null;
  referenceId: string | null;
  createdAt: string;
}

export interface WalletTransactionsResponse {
  transactions: WalletTransaction[];
  total: number;
}

export async function getWalletBalance(): Promise<{ balanceKobo: number }> {
  const { data } = await apiClient.get<{ balanceKobo: number }>('/wallet/balance');
  return data;
}

export async function getWalletTransactions(params?: { limit?: number; offset?: number }): Promise<WalletTransactionsResponse> {
  const { data } = await apiClient.get<WalletTransactionsResponse>('/wallet/transactions', { params });
  return data;
}
