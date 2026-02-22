/**
 * Support ticket TypeScript types matching backend API DTOs
 */

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  adminNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}
