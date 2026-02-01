import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface RealtimeContextValue {
  refetchOrders: () => void;
  refetchDeliveries: () => void;
  refetchNotifications: () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
}

interface RealtimeProviderProps {
  children: ReactNode;
  enabled?: boolean;
  interval?: number;
}

export function RealtimeProvider({
  children,
  enabled = true,
  interval = 15000, // 15 seconds
}: RealtimeProviderProps) {
  const queryClient = useQueryClient();

  const refetchOrders = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };

  const refetchDeliveries = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'deliveries'] });
  };

  const refetchNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
  };

  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      // Refetch critical data periodically
      refetchOrders();
      refetchDeliveries();
      refetchNotifications();
    }, interval);

    return () => clearInterval(intervalId);
  }, [enabled, interval]);

  const value: RealtimeContextValue = {
    refetchOrders,
    refetchDeliveries,
    refetchNotifications,
  };

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

