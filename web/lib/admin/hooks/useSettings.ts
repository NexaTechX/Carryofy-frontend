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
} from '../api';
import type {
  PlatformSettings,
  PaymentGatewaySettings,
  TeamMember,
  CreateTeamMemberPayload,
  UpdateTeamMemberPayload,
} from '../types';

export function usePlatformSettings() {
  return useQuery<PlatformSettings>({
    queryKey: ['admin', 'settings', 'platform'],
    queryFn: fetchPlatformSettings,
  });
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
  return useQuery<PaymentGatewaySettings>({
    queryKey: ['admin', 'settings', 'payment-gateway'],
    queryFn: fetchPaymentGatewaySettings,
  });
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
  return useQuery<TeamMember[]>({
    queryKey: ['admin', 'settings', 'team'],
    queryFn: fetchTeamMembers,
  });
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

