import apiClient from './client';

export interface ReferralAttribution {
  id: string;
  referredUserId: string;
  referredUserName?: string;
  referredUserEmail?: string;
  referredAt: string;
  rewardStatus: string | null;
  rewardAmountKobo: number | null;
}

export interface MyReferralsResponse {
  attributions: ReferralAttribution[];
  totalRewardedKobo: number;
}

export async function getMyReferralCode(): Promise<{ code: string }> {
  const { data } = await apiClient.get<{ data?: { code: string } } | { code: string }>('/referral/code');
  const payload = (data as { data?: { code: string } })?.data ?? (data as { code: string });
  return payload ?? { code: '' };
}

export async function getMyReferrals(): Promise<MyReferralsResponse> {
  const { data } = await apiClient.get<{ data?: MyReferralsResponse }>('/referral/referrals');
  const payload = data?.data;
  return {
    attributions: Array.isArray(payload?.attributions) ? payload.attributions : [],
    totalRewardedKobo: payload?.totalRewardedKobo ?? 0,
  };
}

export async function validateReferralCode(code: string): Promise<{ valid: boolean }> {
  const { data } = await apiClient.get<{ data?: { valid: boolean } } | { valid: boolean }>('/referral/validate', { params: { code } });
  const payload = (data as { data?: { valid: boolean } })?.data ?? (data as { valid: boolean });
  return payload ?? { valid: false };
}
