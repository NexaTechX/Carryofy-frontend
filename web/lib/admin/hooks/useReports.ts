import { useQuery } from '@tanstack/react-query';
import {
  fetchEarningsReport,
  fetchInventoryReport,
  fetchOrderDistribution,
  fetchSalesReport,
  fetchSalesTrend,
  fetchTopSellers,
} from '../../admin/api';
import {
  EarningsReportDto,
  InventoryReportDto,
  OrderDistributionEntry,
  ReportsQueryParams,
  SalesReportDto,
  SalesTrendResponse,
  TopSellerEntry,
} from '../../admin/types';

const reportKeys = {
  sales: (params: ReportsQueryParams | undefined) => ['admin', 'reports', 'sales', params] as const,
  earnings: (params: ReportsQueryParams | undefined) => ['admin', 'reports', 'earnings', params] as const,
  inventory: ['admin', 'reports', 'inventory'] as const,
  salesTrend: (params: ReportsQueryParams | undefined) => ['admin', 'reports', 'sales-trend', params] as const,
  orderDistribution: (params: ReportsQueryParams | undefined) => ['admin', 'reports', 'order-distribution', params] as const,
  topSellers: (params: ReportsQueryParams | undefined) => ['admin', 'reports', 'top-sellers', params] as const,
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

export function useSalesTrendReport(params?: ReportsQueryParams) {
  return useQuery<SalesTrendResponse>({
    queryKey: reportKeys.salesTrend(params),
    queryFn: () => fetchSalesTrend(params),
  });
}

export function useOrderDistributionReport(params?: ReportsQueryParams) {
  return useQuery<OrderDistributionEntry[]>({
    queryKey: reportKeys.orderDistribution(params),
    queryFn: () => fetchOrderDistribution(params),
  });
}

export function useTopSellersReport(params?: ReportsQueryParams) {
  return useQuery<TopSellerEntry[]>({
    queryKey: reportKeys.topSellers(params),
    queryFn: () => fetchTopSellers(params),
  });
}


