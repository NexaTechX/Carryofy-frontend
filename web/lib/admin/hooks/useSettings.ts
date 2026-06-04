import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchPlatformSettings,
  updatePlatformSettings,
  fetchPaymentGatewaySettings,
  updatePaymentGatewaySettings,
  fetchTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  fetchCommissionRates,
  fetchCommissionHistory,
  setCommissionRate,
} from '../api';
import type {
  CommissionRates,
  CommissionConfigRow,
  CommissionPartyType,
  SetCommissionRatePayload,
} from '../api';
import type {
  PlatformSettings,
  PaymentGatewaySettings,
  TeamMember,
  CreateTeamMemberPayload,
  UpdateTeamMemberPayload,
} from '../types';

export function usePlatformSettings() {
  const query = useQuery<PlatformSettings>({
    queryKey: ['admin', 'settings', 'platform'],
    queryFn: fetchPlatformSettings,
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (endpoint may not exist)
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });

  useEffect(() => {
    if (query.error) {
      // Silently handle 404 errors
      const error = query.error as any;
      if (error?.response?.status !== 404) {
        console.error('Error fetching platform settings:', query.error);
      }
    }
  }, [query.error]);

  return query;
}

export function useUpdatePlatformSettings() {
  const queryClient = useQueryClient();
  
  return useMutation<PlatformSettings, Error, Partial<PlatformSettings>>({
    mutationFn: updatePlatformSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'platform'] });
    },
  });
}

export function usePaymentGatewaySettings() {
  const query = useQuery<PaymentGatewaySettings>({
    queryKey: ['admin', 'settings', 'payment-gateway'],
    queryFn: fetchPaymentGatewaySettings,
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (endpoint may not exist)
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });

  useEffect(() => {
    if (query.error) {
      // Silently handle 404 errors
      const error = query.error as any;
      if (error?.response?.status !== 404) {
        console.error('Error fetching payment gateway settings:', query.error);
      }
    }
  }, [query.error]);

  return query;
}

export function useUpdatePaymentGatewaySettings() {
  const queryClient = useQueryClient();
  
  return useMutation<PaymentGatewaySettings, Error, Partial<PaymentGatewaySettings>>({
    mutationFn: updatePaymentGatewaySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'payment-gateway'] });
    },
  });
}

export function useTeamMembers() {
  const query = useQuery<TeamMember[]>({
    queryKey: ['admin', 'settings', 'team'],
    queryFn: fetchTeamMembers,
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (endpoint may not exist)
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });

  useEffect(() => {
    if (query.error) {
      // Silently handle 404 errors
      const error = query.error as any;
      if (error?.response?.status !== 404) {
        console.error('Error fetching team members:', query.error);
      }
    }
  }, [query.error]);

  return query;
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation<TeamMember, Error, CreateTeamMemberPayload>({
    mutationFn: createTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'team'] });
    },
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation<TeamMember, Error, { memberId: string; payload: UpdateTeamMemberPayload }>({
    mutationFn: ({ memberId, payload }) => updateTeamMember(memberId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'team'] });
    },
  });
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'team'] });
    },
  });
}

// ---- Delivery commission split ----

export function useCommissionRates() {
  return useQuery<CommissionRates>({
    queryKey: ['admin', 'commission', 'rates'],
    queryFn: fetchCommissionRates,
    retry: (failureCount, error: any) =>
      error?.response?.status === 404 ? false : failureCount < 2,
  });
}

export function useCommissionHistory(partyType: CommissionPartyType) {
  return useQuery<CommissionConfigRow[]>({
    queryKey: ['admin', 'commission', 'history', partyType],
    queryFn: () => fetchCommissionHistory(partyType),
    retry: (failureCount, error: any) =>
      error?.response?.status === 404 ? false : failureCount < 2,
  });
}

export function useSetCommissionRate() {
  const queryClient = useQueryClient();
  return useMutation<CommissionConfigRow, Error, SetCommissionRatePayload>({
    mutationFn: setCommissionRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'commission'] });
    },
  });
}
