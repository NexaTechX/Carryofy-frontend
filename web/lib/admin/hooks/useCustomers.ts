import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { toast } from 'react-hot-toast';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'RIDER_PENDING';
export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN' | 'RIDER';

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  verified: boolean;
  orderCount: number;
  totalSpent: number;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCustomerDetail extends AdminCustomer {
  addresses: Array<{
    id: string;
    label: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    postalCode?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  orders: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}

export interface CustomersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface CustomersResponse {
  users: AdminCustomer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const CUSTOMERS_CACHE_KEY = 'admin-customers';

export function useAdminCustomers(params: CustomersQueryParams = {}) {
  return useQuery<CustomersResponse>({
    queryKey: [CUSTOMERS_CACHE_KEY, params],
    queryFn: async () => {
      const { data } = await apiClient.get('/users/admin/all', { params });
      
      // Handle wrapped response from TransformInterceptor
      // Backend wraps response in { statusCode, message, data }
      if (data && typeof data === 'object' && 'data' in data && 'statusCode' in data) {
        return data.data as CustomersResponse;
      }
      
      // If already unwrapped or different structure
      return data as CustomersResponse;
    },
  });
}

export function useCustomerDetail(customerId: string | null) {
  return useQuery<AdminCustomerDetail>({
    queryKey: [CUSTOMERS_CACHE_KEY, 'detail', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('Customer ID is required');
      const { data } = await apiClient.get(`/users/admin/${customerId}`);
      
      // Handle wrapped response from TransformInterceptor
      if (data && typeof data === 'object' && 'data' in data && 'statusCode' in data) {
        return data.data as AdminCustomerDetail;
      }
      
      return data as AdminCustomerDetail;
    },
    enabled: !!customerId,
    retry: 1, // Only retry once on failure
    retryOnMount: false, // Don't retry when component remounts
  });
}

export function useUpdateCustomerStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      status,
    }: {
      customerId: string;
      status: UserStatus;
    }) => {
      const { data } = await apiClient.put(`/users/admin/${customerId}/status`, {
        status,
      });
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || 'Customer status updated successfully');
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_CACHE_KEY] });
      queryClient.invalidateQueries({
        queryKey: [CUSTOMERS_CACHE_KEY, 'detail', variables.customerId],
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to update customer status'
      );
    },
  });
}

