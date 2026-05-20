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

export async function createFleetRider(payload: {
  name: string;
  email: string;
  phone: string;
  password: string;
  vehicleType: string;
  vehicleNumber: string;
}): Promise<{ message: string; riderId: string; email: string }> {
  const { data } = await apiClient.post('/fleet/riders', payload);
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

export type FleetRiderBreakRequestRow = {
  id: string;
  riderId: string;
  riderName: string;
  riderEmail: string;
  startTime: string;
  endTime: string;
  reason: string | null;
  createdAt: string;
};

export async function fetchFleetRiderBreakRequests(params?: {
  limit?: number;
  from?: string;
  to?: string;
}): Promise<FleetRiderBreakRequestRow[]> {
  const { data } = await apiClient.get('/fleet/rider-break-requests', { params });
  const out = unwrap<unknown>(data);
  return Array.isArray(out) ? (out as FleetRiderBreakRequestRow[]) : [];
}

export async function fetchFleetDeliveries(params?: {
  status?: string;
  from?: string;
  to?: string;
}): Promise<unknown[]> {
  const { data } = await apiClient.get('/fleet/deliveries', { params });
  return unwrap(data);
}

export type FleetIncomingDelivery = {
  id: string;
  orderId: string;
  status: string;
  pickupAddress?: string | null;
  deliveryAddress?: string | null;
  updatedAt: string;
  createdAt: string;
  order?: {
    id: string;
    status: string;
    createdAt: string;
    address?: {
      line1: string;
      line2?: string | null;
      city: string;
      state: string;
    } | null;
    user?: { name: string; phone?: string | null };
    items?: Array<{
      quantity: number;
      product?: { title: string; images?: string[] };
    }>;
  };
};

export async function fetchFleetIncomingDeliveries(): Promise<
  FleetIncomingDelivery[]
> {
  const { data } = await apiClient.get('/fleet/deliveries/incoming');
  const out = unwrap<unknown>(data);
  return Array.isArray(out) ? (out as FleetIncomingDelivery[]) : [];
}

export type FleetEarningsRiderRow = {
  riderId: string;
  riderName: string;
  deliveryCount: number;
  totalAmountKobo: number;
  pendingAmountKobo: number;
  paidAmountKobo: number;
};

export async function fetchFleetEarningsPage(): Promise<{
  summary: {
    totalEarnedKobo: number;
    pendingPoolKobo: number;
    paidOutKobo: number;
  };
  riders: FleetEarningsRiderRow[];
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
