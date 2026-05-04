import apiClient from './client';

function unwrap<T>(response: unknown): T {
  if (
    response &&
    typeof response === 'object' &&
    'data' in (response as Record<string, unknown>) &&
    (response as { data?: unknown }).data !== undefined
  ) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export async function fetchFleetOverview(): Promise<{
  dashboard: {
    activeRiders: number;
    totalRiders: number;
    deliveriesToday: number;
    pendingPoolKobo: number;
  };
  earnings: {
    totalEarnedKobo: number;
    pendingPoolKobo: number;
    paidOutKobo: number;
  };
}> {
  const { data } = await apiClient.get('/fleet/overview');
  return unwrap(data);
}

export async function fetchFleetRiders(): Promise<
  Array<{
    userId: string;
    name: string;
    email: string;
    vehicleType?: string | null;
    isAvailable: boolean;
    currentDelivery: { id: string; orderId: string; status: string } | null;
    weekEarningsKobo: number;
  }>
> {
  const { data } = await apiClient.get('/fleet/riders');
  return unwrap(data);
}

export async function fetchFleetDeliveries(params?: {
  status?: string;
  from?: string;
  to?: string;
}): Promise<unknown[]> {
  const { data } = await apiClient.get('/fleet/deliveries', { params });
  return unwrap(data);
}

export async function fetchFleetEarningsPage(): Promise<{
  summary: {
    totalEarnedKobo: number;
    pendingPoolKobo: number;
    paidOutKobo: number;
  };
  byRider: Array<{
    riderId: string;
    name: string;
    email: string;
    fleetEarningsKobo: number;
  }>;
}> {
  const { data } = await apiClient.get('/fleet/earnings');
  return unwrap(data);
}

export async function requestFleetPayout(payload: {
  amount: number;
  bankAccountName: string;
  bankAccountNumber: string;
  bankCode: string;
}): Promise<{ message: string; payoutRequestId: string }> {
  const { data } = await apiClient.post('/fleet/payouts/request', payload);
  return unwrap(data);
}

export async function fetchFleetPayoutHistory(): Promise<unknown[]> {
  const { data } = await apiClient.get('/fleet/payouts');
  return unwrap(data);
}

export async function assignFleetDelivery(
  deliveryId: string,
  riderId: string,
): Promise<unknown> {
  const { data } = await apiClient.post(`/fleet/deliveries/${deliveryId}/assign`, {
    riderId,
  });
  return unwrap(data);
}
