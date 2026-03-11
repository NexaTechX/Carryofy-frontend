import apiClient from './client';

export type DisputeStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'WAITING_FOR_RESPONSE'
  | 'RESOLVED'
  | 'ESCALATED';
export type DisputeInitiatorRole = 'BUYER' | 'SELLER';
export type DisputePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface DisputeEvidence {
  id: string;
  fileUrl: string;
  fileName?: string | null;
  notes?: string | null;
  uploadedBy: string;
  createdAt: string;
}

export interface DisputeMessage {
  id: string;
  authorId: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
}

export interface DisputeAuditLog {
  id: string;
  action: string;
  performedBy: string;
  details?: unknown;
  createdAt: string;
}

export interface Dispute {
  id: string;
  orderId: string;
  openedByUserId: string;
  initiatorRole: DisputeInitiatorRole;
  reason: string;
  priority: DisputePriority;
  status: DisputeStatus;
  slaDueAt?: string | null;
  resolutionOutcome?: string | null;
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  assignedToAdminId?: string | null;
  createdAt: string;
  updatedAt: string;
  evidence?: DisputeEvidence[];
  messages?: DisputeMessage[];
  auditLogs?: DisputeAuditLog[];
}

export interface CreateDisputePayload {
  orderId: string;
  initiatorRole: DisputeInitiatorRole;
  reason: string;
  priority?: DisputePriority;
}

export interface AdminUpdateDisputePayload {
  status?: DisputeStatus;
  assignedToAdminId?: string | null;
  resolutionOutcome?: string;
  resolutionNotes?: string;
}

export async function createDispute(payload: CreateDisputePayload): Promise<Dispute> {
  const { data } = await apiClient.post<{ data?: Dispute } | Dispute>('/disputes', payload);
  return (data as { data?: Dispute })?.data ?? (data as Dispute);
}

export async function getDisputes(params?: {
  status?: DisputeStatus;
  orderId?: string;
}): Promise<Dispute[]> {
  const { data } = await apiClient.get<{ data?: Dispute[] }>('/disputes', { params });
  return Array.isArray(data?.data) ? data.data : [];
}

export async function getDispute(id: string): Promise<Dispute> {
  const { data } = await apiClient.get<{ data?: Dispute } | Dispute>(`/disputes/${id}`);
  return (data as { data?: Dispute })?.data ?? (data as Dispute);
}

export async function getAdminDisputeQueue(params?: {
  status?: DisputeStatus;
  orderId?: string;
  slaBreachRisk?: boolean;
}): Promise<Dispute[]> {
  const { data } = await apiClient.get<{ data?: Dispute[] }>('/disputes/admin/queue', { params });
  return Array.isArray(data?.data) ? data.data : [];
}

export async function addDisputeEvidence(
  disputeId: string,
  payload: { fileUrl: string; fileName?: string; notes?: string }
): Promise<Dispute> {
  const { data } = await apiClient.post<{ data?: Dispute } | Dispute>(`/disputes/${disputeId}/evidence`, payload);
  return (data as { data?: Dispute })?.data ?? (data as Dispute);
}

export async function addDisputeMessage(
  disputeId: string,
  payload: { body: string; isInternal?: boolean }
): Promise<Dispute> {
  const { data } = await apiClient.post<{ data?: Dispute } | Dispute>(`/disputes/${disputeId}/messages`, payload);
  return (data as { data?: Dispute })?.data ?? (data as Dispute);
}

export async function adminUpdateDispute(
  disputeId: string,
  payload: AdminUpdateDisputePayload
): Promise<Dispute> {
  const { data } = await apiClient.put<{ data?: Dispute } | Dispute>(`/disputes/${disputeId}/admin`, payload);
  return (data as { data?: Dispute })?.data ?? (data as Dispute);
}
