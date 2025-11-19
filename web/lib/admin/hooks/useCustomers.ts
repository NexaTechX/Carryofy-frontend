import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { toast } from 'react-hot-toast';

export type UserStatus = 'ACTIVE' | 'SUSPENDED';
export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN';

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
      return data;
    },
  });
}

export function useCustomerDetail(customerId: string | null) {
  return useQuery<AdminCustomerDetail>({
    queryKey: [CUSTOMERS_CACHE_KEY, 'detail', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('Customer ID is required');
      const { data } = await apiClient.get(`/users/admin/${customerId}`);
      return data;
    },
    enabled: !!customerId,
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

