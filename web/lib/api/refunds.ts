import apiClient from './client';

export interface Refund {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  reason: string;
  status: 'REQUESTED' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  adminNotes?: string;
  processedBy?: string;
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    amount: number;
    status: string;
  };
}

export interface CreateRefundDto {
  orderId: string;
  amount: number;
  reason: string;
}

/**
 * Get user's refunds
 */
export async function getUserRefunds(): Promise<Refund[]> {
  try {
    const response = await apiClient.get<Refund[] | { data: Refund[] }>('/refunds/my-refunds');
    const responseData = response.data;
    if (responseData && typeof responseData === 'object' && 'data' in responseData && Array.isArray(responseData.data)) {
      return responseData.data;
    }
    return responseData as Refund[];
  } catch (error: any) {
    console.error('Error fetching refunds:', error);
    throw error;
  }
}

/**
 * Create refund request
 */
export async function createRefund(data: CreateRefundDto): Promise<Refund> {
  try {
    const response = await apiClient.post<Refund | { data: Refund }>('/refunds', data);
    const responseData = response.data;
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      return responseData.data;
    }
    return responseData as Refund;
  } catch (error: any) {
    console.error('Error creating refund:', error);
    throw error;
  }
}

/**
 * Get refund by ID
 */
export async function getRefundById(refundId: string): Promise<Refund> {
  try {
    const response = await apiClient.get<Refund | { data: Refund }>(`/refunds/${refundId}`);
    const responseData = response.data;
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      return responseData.data;
    }
    return responseData as Refund;
  } catch (error: any) {
    console.error(`Error fetching refund ${refundId}:`, error);
    throw error;
  }
}

