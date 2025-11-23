import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

export interface KycAuditLog {
  id: string;
  sellerId: string;
  action: string;
  performedBy: string;
  reason?: string;
  timestamp: string;
}

export function useKycAuditLog(sellerId: string | null) {
  return useQuery<KycAuditLog[]>({
    queryKey: ['admin', 'sellers', sellerId, 'audit'],
    queryFn: async () => {
      if (!sellerId) return [];
      const { data } = await apiClient.get(`/sellers/${sellerId}/kyc/audit`);
      // Handle wrapped response from TransformInterceptor
      if (data && typeof data === 'object' && 'data' in data && 'statusCode' in data) {
        return data.data as KycAuditLog[];
      }
      return data as KycAuditLog[];
    },
    enabled: !!sellerId,
  });
}

