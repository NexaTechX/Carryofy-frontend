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
  const { data } = await apiClient.get<{ data?: { balanceKobo: number } } | { balanceKobo: number }>('/wallet/balance');
  const payload = (data as { data?: { balanceKobo: number } })?.data ?? (data as { balanceKobo: number });
  return payload ?? { balanceKobo: 0 };
}

export async function getWalletTransactions(params?: { limit?: number; offset?: number }): Promise<WalletTransactionsResponse> {
  const { data } = await apiClient.get<{ data?: WalletTransactionsResponse } | WalletTransactionsResponse>('/wallet/transactions', { params });
  const payload = (data as { data?: WalletTransactionsResponse })?.data ?? (data as WalletTransactionsResponse);
  return {
    transactions: Array.isArray(payload?.transactions) ? payload.transactions : [],
    total: payload?.total ?? 0,
  };
}
