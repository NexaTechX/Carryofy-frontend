import { apiClient } from './client';

export type DispatchJobStatus = 'PENDING' | 'ASSIGNED' | 'NEEDS_MANUAL' | 'CANCELLED';
export type DispatchAttemptStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'TIMEOUT';

export interface DispatchAttempt {
  id: string;
  riderId: string;
  status: DispatchAttemptStatus;
  respondedAt: string | null;
  createdAt: string;
  rider?: { id: string; name: string | null };
}

export interface DispatchDecisionLog {
  id: string;
  decisionType: string;
  riderRankingSnapshot?: Array<{ riderId: string; distanceKm: number; score: number }>;
  chosenRiderId: string | null;
  reason: string | null;
  createdAt: string;
}

export interface DispatchJob {
  id: string;
  deliveryId: string;
  status: DispatchJobStatus;
  priority: string;
  createdAt: string;
  updatedAt: string;
  delivery?: {
    id: string;
    orderId: string;
    status: string;
    order?: { id: string; userId: string; status: string };
    rider?: { id: string; name: string | null; phone: string | null };
  };
  attempts?: DispatchAttempt[];
  decisionLogs?: DispatchDecisionLog[];
}

export async function getDispatchJobs(params?: { status?: string; deliveryId?: string }): Promise<DispatchJob[]> {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.deliveryId) search.set('deliveryId', params.deliveryId);
  const q = search.toString();
  const { data } = await apiClient.get<DispatchJob[]>(`/dispatch/jobs${q ? `?${q}` : ''}`);
  return data;
}

export async function getDispatchJobById(id: string): Promise<DispatchJob> {
  const { data } = await apiClient.get<DispatchJob>(`/dispatch/jobs/${id}`);
  return data;
}

export async function triggerAutoDispatch(deliveryId: string): Promise<{ assigned: boolean; jobId?: string }> {
  const { data } = await apiClient.post<{ assigned: boolean; jobId?: string }>(
    `/dispatch/delivery/${deliveryId}/trigger`
  );
  return data;
}
