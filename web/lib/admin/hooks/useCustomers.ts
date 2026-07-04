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
  /** BUYER: orders placed; SELLER: orders with their products; RIDER: deliveries; ADMIN: 0 */
  orderCount: number;
  /** BUYER: total spent (kobo); SELLER: total sales (kobo); RIDER: total earnings (kobo); ADMIN: 0 */
  totalSpent: number;
  productCount?: number;
  deliveryCount?: number;
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
  sellerEarnings?: Array<{ orderId: string; gross: number; net: number; createdAt: string }>;
  riderDeliveries?: Array<{
    id: string;
    orderId: string;
    amount: number;
    status: string;
    deliveredAt?: string;
  }>;
  /** Number of reviews written by this user (buyer/seller). */
  reviewsWritten?: number;
  /** Number of support tickets raised. */
  supportTicketsRaised?: number;
  /** Account activity log entries for the drawer. */
  activityLog?: Array<{ id: string; action: string; at: string; meta?: string }>;
}

/** Last active filter: active in last N days, or inactive (no recent activity). */
export type LastActiveFilter = '7' | '30' | '90' | 'inactive';

export interface CustomersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  /** ISO date string; filter users joined on or after. */
  joinedFrom?: string;
  /** ISO date string; filter users joined on or before. */
  joinedTo?: string;
  /** 7 | 30 | 90 = active in last N days; 'inactive' = no activity in last 90 days. */
  lastActive?: LastActiveFilter;
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

export interface CustomerStats {
  total: number;
  buyers: number;
  sellers: number;
  riders: number;
  unverified: number;
  suspended: number;
}

/** Fetches aggregate user counts for dashboard stat cards. */
export function useCustomerStats() {
  return useQuery<CustomerStats>({
    queryKey: [CUSTOMERS_CACHE_KEY, 'stats'],
    queryFn: async () => {
      const { data } = await apiClient.get('/users/admin/stats');
      if (data && typeof data === 'object' && 'data' in data && 'statusCode' in data) {
        return data.data as CustomerStats;
      }
      return data as CustomerStats;
    },
    staleTime: 60_000,
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

function unwrapMessage(data: unknown): { message?: string } {
  if (data && typeof data === 'object' && 'data' in data && 'statusCode' in data) {
    return (data as { data: { message?: string } }).data;
  }
  return data as { message?: string };
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: string) => {
      const { data } = await apiClient.delete(`/users/admin/customer/${customerId}`);
      return unwrapMessage(data);
    },
    onSuccess: (data, customerId) => {
      toast.success(data.message || 'User deleted successfully');
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_CACHE_KEY] });
      queryClient.removeQueries({
        queryKey: [CUSTOMERS_CACHE_KEY, 'detail', customerId],
      });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    },
  });
}

