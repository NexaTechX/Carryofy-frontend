import { useQuery } from '@tanstack/react-query';
import {
  fetchEarningsReport,
  fetchInventoryReport,
  fetchOrderDistribution,
  fetchSalesReport,
  fetchSalesTrend,
} from '../../admin/api';
import {
  EarningsReportDto,
  InventoryReportDto,
  OrderDistributionEntry,
  ReportsQueryParams,
  SalesReportDto,
  SalesTrendResponse,
} from '../../admin/types';

const reportKeys = {
  sales: (params: ReportsQueryParams | undefined) => ['admin', 'reports', 'sales', params] as const,
  earnings: (params: ReportsQueryParams | undefined) => ['admin', 'reports', 'earnings', params] as const,
  inventory: ['admin', 'reports', 'inventory'] as const,
  salesTrend: ['admin', 'reports', 'sales-trend'] as const,
  orderDistribution: ['admin', 'reports', 'order-distribution'] as const,
};

export function useSalesReport(params?: ReportsQueryParams) {
  return useQuery<SalesReportDto>({
    queryKey: reportKeys.sales(params),
    queryFn: () => fetchSalesReport(params),
  });
}

export function useEarningsReport(params?: ReportsQueryParams) {
  return useQuery<EarningsReportDto>({
    queryKey: reportKeys.earnings(params),
    queryFn: () => fetchEarningsReport(params),
  });
}

export function useInventoryReport() {
  return useQuery<InventoryReportDto>({
    queryKey: reportKeys.inventory,
    queryFn: fetchInventoryReport,
  });
}

export function useSalesTrendReport() {
  return useQuery<SalesTrendResponse>({
    queryKey: reportKeys.salesTrend,
    queryFn: fetchSalesTrend,
  });
}

export function useOrderDistributionReport() {
  return useQuery<OrderDistributionEntry[]>({
    queryKey: reportKeys.orderDistribution,
    queryFn: fetchOrderDistribution,
  });
}


