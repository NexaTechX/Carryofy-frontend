import { apiClient } from './client';

export type DeliveryExceptionType =
  | 'CUSTOMER_UNREACHABLE'
  | 'ADDRESS_ISSUE'
  | 'REFUSED'
  | 'ACCIDENT'
  | 'VEHICLE_ISSUE'
  | 'OTHER';
export type DeliveryExceptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type DeliveryExceptionStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';

export interface DeliveryException {
  id: string;
  deliveryId: string;
  type: DeliveryExceptionType;
  severity: DeliveryExceptionSeverity;
  status: DeliveryExceptionStatus;
  reportedBy: string;
  reportedAt: string;
  description: string | null;
  slaDueAt: string | null;
  resolvedAt: string | null;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  delivery?: {
    id: string;
    orderId: string;
    order?: { id: string; userId: string };
    rider?: { id: string; name: string | null };
  };
  reporter?: { id: string; name: string | null };
  actions?: Array<{
    id: string;
    actorType: string;
    actionType: string;
    payload?: unknown;
    createdAt: string;
  }>;
  escalations?: Array<{
    id: string;
    fromLevel: string;
    toLevel: string;
    reason: string | null;
    escalatedAt: string;
  }>;
}

export interface CreateExceptionDto {
  deliveryId: string;
  type: DeliveryExceptionType;
  severity?: DeliveryExceptionSeverity;
  description?: string;
}

export async function createException(dto: CreateExceptionDto): Promise<DeliveryException> {
  const { data } = await apiClient.post<DeliveryException>('/delivery-exceptions', dto);
  return data;
}

export async function getExceptions(): Promise<DeliveryException[]> {
  const { data } = await apiClient.get<DeliveryException[]>('/delivery-exceptions');
  return data;
}

export async function getAdminExceptionQueue(params?: {
  status?: DeliveryExceptionStatus;
  severity?: DeliveryExceptionSeverity;
  deliveryId?: string;
}): Promise<DeliveryException[]> {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.severity) search.set('severity', params.severity);
  if (params?.deliveryId) search.set('deliveryId', params.deliveryId);
  const q = search.toString();
  const { data } = await apiClient.get<DeliveryException[]>(`/delivery-exceptions/admin/queue${q ? `?${q}` : ''}`);
  return data;
}

export async function getExceptionById(id: string): Promise<DeliveryException> {
  const { data } = await apiClient.get<DeliveryException>(`/delivery-exceptions/${id}`);
  return data;
}

export async function addExceptionAction(
  id: string,
  payload: { actionType: string; payload?: Record<string, unknown> }
): Promise<DeliveryException> {
  const { data } = await apiClient.post<DeliveryException>(`/delivery-exceptions/${id}/actions`, payload);
  return data;
}

export async function escalateException(
  id: string,
  payload: { toLevel: string; reason?: string }
): Promise<DeliveryException> {
  const { data } = await apiClient.post<DeliveryException>(`/delivery-exceptions/${id}/escalate`, payload);
  return data;
}

export async function resolveException(id: string, payload: { resolution?: string }): Promise<DeliveryException> {
  const { data } = await apiClient.put<DeliveryException>(`/delivery-exceptions/${id}/resolve`, payload);
  return data;
}
