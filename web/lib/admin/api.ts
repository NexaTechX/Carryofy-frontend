import apiClient from '../api/client';
import {
  AdminDashboardData,
  DashboardMetrics,
  LowStockItem,
  OrderDistributionEntry,
  SalesTrendResponse,
  TopCategoriesResponse,
  CommissionRevenueResponse,
  SellerSummary,
  AdminProfile,
  AdminSeller,
  PendingProduct,
  AdminOrder,
  AdminDelivery,
  AdminOrderStatus,
  AdminDeliveryStatus,
  WarehouseStockItem,
  StockMovement,
  CreateInboundPayload,
  CreateOutboundPayload,
  AdjustStockPayload,
  AdminPayout,
  ProcessPayoutPayload,
  SalesReportDto,
  EarningsReportDto,
  InventoryReportDto,
  ReportsQueryParams,
  SupportTicket,
  SupportTicketStatus,
  AdminNotification,
  CreateNotificationPayload,
  PlatformSettings,
  PaymentGatewaySettings,
  TeamMember,
  CreateTeamMemberPayload,
  UpdateTeamMemberPayload,
} from './types';

const ADMIN_DASHBOARD_CACHE_TAG = 'admin-dashboard';

export const adminDashboardKeys = {
  all: [ADMIN_DASHBOARD_CACHE_TAG] as const,
};

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const { data } = await apiClient.get('/reports/dashboard');
  
  // Handle wrapped response
  const metrics = (data as Record<string, unknown>)?.data || (data as Record<string, unknown>)?.metrics || data;
  
  const metricsData = metrics as Record<string, unknown>;
  
  return {
    totalUsers: (metricsData?.totalUsers as number) ?? 0,
    totalSellers: (metricsData?.totalSellers as number) ?? 0,
    totalProducts: (metricsData?.totalProducts as number) ?? 0,
    totalOrders: (metricsData?.totalOrders as number) ?? 0,
    totalRevenue: (metricsData?.totalRevenue as number) ?? 0,
    totalCommissions: (metricsData?.totalCommissions as number) ?? 0,
    pendingOrders: (metricsData?.pendingOrders as number) ?? 0,
    activeDeliveries: (metricsData?.activeDeliveries as number) ?? 0,
    pendingApprovals: (metricsData?.pendingApprovals as number) ?? 0,
  };
}

export async function fetchSalesTrend(): Promise<SalesTrendResponse> {
  const { data } = await apiClient.get('/reports/sales-trend');
  
  // Handle wrapped response
  const response = (data as Record<string, unknown>)?.data || data;
  
  const responseData = response as Record<string, unknown>;
  
  return {
    trend: Array.isArray(responseData?.trend) ? responseData.trend : [],
    totalSales: (responseData?.totalSales as number) ?? 0,
    totalOrders: (responseData?.totalOrders as number) ?? 0,
    period: (responseData?.period as string) ?? 'last-7-days',
  };
}

export async function fetchOrderDistribution(): Promise<OrderDistributionEntry[]> {
  const { data } = await apiClient.get('/reports/order-distribution');
  
  // Handle wrapped response
  const response = (data as Record<string, unknown>)?.data || data;
  
  // If it's already an array, return it
  if (Array.isArray(response)) {
    return response;
  }
  
  // If it has a distribution property, use that
  const responseData = response as Record<string, unknown>;
  if (responseData?.distribution && Array.isArray(responseData.distribution)) {
    return responseData.distribution;
  }
  
  // Otherwise return empty array
  return [];
}

export async function fetchTopCategories(): Promise<TopCategoriesResponse> {
  try {
    const { data } = await apiClient.get('/reports/top-categories');
    
    // Handle wrapped response
    const response = (data as Record<string, unknown>)?.data || data;
    const responseData = response as Record<string, unknown>;
    
    return {
      categories: normalizeListResponse(responseData?.categories, ['categories', 'items', 'data']),
      total: (responseData?.total as number) ?? 0,
    };
  } catch (error) {
    // Return empty data if endpoint doesn't exist yet
    console.warn('Top categories endpoint not implemented yet:', error);
    return {
      categories: [],
      total: 0,
    };
  }
}

export async function fetchCommissionRevenue(): Promise<CommissionRevenueResponse> {
  try {
    const { data } = await apiClient.get('/reports/commission-revenue');
    
    // Handle wrapped response
    const response = (data as Record<string, unknown>)?.data || data;
    const responseData = response as Record<string, unknown>;
    
    return {
      periods: normalizeListResponse(responseData?.periods, ['periods', 'items', 'data']),
      totalRevenue: (responseData?.totalRevenue as number) ?? 0,
      growth: (responseData?.growth as number) ?? 0,
    };
  } catch (error) {
    // Return empty data if endpoint doesn't exist yet
    console.warn('Commission revenue endpoint not implemented yet:', error);
    return {
      periods: [],
      totalRevenue: 0,
      growth: 0,
    };
  }
}

export async function fetchLowStock(threshold = 10): Promise<LowStockItem[]> {
  const { data } = await apiClient.get(`/warehouse/low-stock?threshold=${threshold}`);
  return normalizeListResponse<LowStockItem>(data, ['items', 'data', 'results', 'products', 'lowStock']);
}

async function fetchSellers(): Promise<SellerSummary[]> {
  const { data } = await apiClient.get('/sellers');
  return normalizeListResponse<SellerSummary>(data, ['sellers', 'items', 'data', 'results']);
}

export async function fetchAdminSellers(): Promise<AdminSeller[]> {
  const { data } = await apiClient.get('/sellers');
  return normalizeListResponse<AdminSeller>(data, ['sellers', 'items', 'data', 'results']);
}

export async function approveSellerRequest(sellerId: string): Promise<void> {
  await apiClient.put(`/sellers/${sellerId}/approve`);
}

export async function rejectSellerRequest(sellerId: string): Promise<void> {
  await apiClient.put(`/sellers/${sellerId}/reject`);
}

export async function fetchPendingProducts(): Promise<PendingProduct[]> {
  const { data } = await apiClient.get('/products/pending');
  return normalizeListResponse<PendingProduct>(data, ['products', 'items', 'data', 'results', 'pending']);
}

export async function fetchAllProducts(): Promise<PendingProduct[]> {
  const { data } = await apiClient.get('/products');
  return normalizeListResponse<PendingProduct>(data, ['products', 'items', 'data', 'results']);
}

export async function approveProductRequest(productId: string): Promise<void> {
  await apiClient.put(`/products/${productId}/approve`);
}

export async function rejectProductRequest(productId: string): Promise<void> {
  await apiClient.put(`/products/${productId}/reject`);
}

export async function fetchAdminOrders(): Promise<AdminOrder[]> {
  const { data } = await apiClient.get('/orders');
  return normalizeListResponse<AdminOrder>(data, ['orders', 'items', 'data', 'results']);
}

export async function fetchAdminOrderById(orderId: string): Promise<AdminOrder> {
  const { data } = await apiClient.get<AdminOrder>(`/orders/${orderId}`);
  return data;
}

export async function updateOrderStatusRequest(orderId: string, status: AdminOrderStatus): Promise<void> {
  await apiClient.put(`/orders/${orderId}/status`, { status });
}

export async function fetchActiveDeliveries(): Promise<AdminDelivery[]> {
  const { data } = await apiClient.get('/delivery/active');
  return normalizeListResponse<AdminDelivery>(data, ['deliveries', 'items', 'data', 'results']);
}

export async function fetchDeliveryByOrderId(orderId: string): Promise<AdminDelivery> {
  const { data } = await apiClient.get<AdminDelivery>(`/delivery/orders/${orderId}`);
  return data;
}

export async function assignDeliveryRequest(input: {
  orderId: string;
  rider?: string;
  eta?: string;
}): Promise<AdminDelivery> {
  const { data } = await apiClient.post<AdminDelivery>('/delivery/assign', input);
  return data;
}

export async function updateDeliveryStatusRequest(
  deliveryId: string,
  status: AdminDeliveryStatus,
  updates?: { rider?: string; eta?: string }
): Promise<AdminDelivery> {
  const { data } = await apiClient.put<AdminDelivery>(`/delivery/${deliveryId}/status`, {
    status,
    ...updates,
  });
  return data;
}

export async function fetchWarehouseStock(): Promise<WarehouseStockItem[]> {
  const { data } = await apiClient.get('/warehouse/stock');
  return normalizeListResponse<WarehouseStockItem>(data, ['stock', 'items', 'data', 'results']);
}

export async function fetchWarehouseMovements(): Promise<StockMovement[]> {
  const { data } = await apiClient.get('/warehouse/movements');
  return normalizeListResponse<StockMovement>(data, ['movements', 'items', 'data', 'results']);
}

export async function createInboundStockRequest(payload: CreateInboundPayload): Promise<void> {
  await apiClient.post('/warehouse/inbound', payload);
}

export async function createOutboundStockRequest(payload: CreateOutboundPayload): Promise<void> {
  await apiClient.post('/warehouse/outbound', payload);
}

export async function adjustStockRequest(payload: AdjustStockPayload): Promise<void> {
  await apiClient.put('/warehouse/stock/adjust', payload);
}

export async function fetchPayouts(): Promise<AdminPayout[]> {
  const { data } = await apiClient.get('/payouts');
  return normalizeListResponse<AdminPayout>(data, ['payouts', 'items', 'data', 'results']);
}

export async function approvePayoutRequest(payoutId: string): Promise<void> {
  await apiClient.put(`/payouts/${payoutId}/approve`);
}

export async function rejectPayoutRequest(payoutId: string): Promise<void> {
  await apiClient.put(`/payouts/${payoutId}/reject`);
}

export async function processPayoutRequest(
  payoutId: string,
  payload: ProcessPayoutPayload
): Promise<void> {
  await apiClient.post(`/payouts/${payoutId}/process`, payload);
}

export async function fetchSalesReport(
  params?: ReportsQueryParams
): Promise<SalesReportDto> {
  const { data } = await apiClient.get('/reports/sales', { params });
  
  // Handle both direct response and wrapped response
  const dataObj = data as Record<string, unknown>;
  const report = dataObj?.report || dataObj?.data || data;
  const reportData = report as Record<string, unknown>;
  
  return {
    totalSales: (reportData?.totalSales as number) ?? 0,
    totalOrders: (reportData?.totalOrders as number) ?? 0,
    totalProductsSold: (reportData?.totalProductsSold as number) ?? 0,
    startDate: reportData?.startDate as string | undefined,
    endDate: reportData?.endDate as string | undefined,
  };
}

export async function fetchEarningsReport(
  params?: ReportsQueryParams
): Promise<EarningsReportDto> {
  const { data } = await apiClient.get('/reports/earnings', { params });
  
  // Handle both direct response and wrapped response
  const dataObj = data as Record<string, unknown>;
  const report = dataObj?.report || dataObj?.data || data;
  const reportData = report as Record<string, unknown>;
  
  return {
    totalGross: (reportData?.totalGross as number) ?? 0,
    totalCommission: (reportData?.totalCommission as number) ?? 0,
    totalNet: (reportData?.totalNet as number) ?? 0,
    totalOrders: (reportData?.totalOrders as number) ?? 0,
    startDate: reportData?.startDate as string | undefined,
    endDate: reportData?.endDate as string | undefined,
  };
}

export async function fetchInventoryReport(): Promise<InventoryReportDto> {
  const { data } = await apiClient.get('/reports/inventory');
  
  // Handle both direct response and wrapped response
  const dataObj = data as Record<string, unknown>;
  const report = dataObj?.report || dataObj?.data || data;
  const reportData = report as Record<string, unknown>;
  
  return {
    totalProducts: (reportData?.totalProducts as number) ?? 0,
    totalQuantity: (reportData?.totalQuantity as number) ?? 0,
    lowStockCount: (reportData?.lowStockCount as number) ?? 0,
    outOfStockCount: (reportData?.outOfStockCount as number) ?? 0,
  };
}

function normalizeListResponse<T>(response: unknown, candidateKeys: string[]): T[] {
  const visited = new Set<unknown>();

  const visit = (value: unknown): T[] => {
    if (Array.isArray(value)) {
      return value as T[];
    }

    if (!value || typeof value !== 'object' || visited.has(value)) {
      return [];
    }

    visited.add(value);
    const record = value as Record<string, unknown>;

    for (const key of candidateKeys) {
      if (key in record) {
        const normalized = visit(record[key]);
        if (normalized.length) {
          return normalized;
        }
      }
    }

    for (const nested of Object.values(record)) {
      const normalized = visit(nested);
      if (normalized.length) {
        return normalized;
      }
    }

    return [];
  };

  return visit(response);
}

export async function fetchSupportTickets(): Promise<SupportTicket[]> {
  const { data } = await apiClient.get('/support/tickets');
  return normalizeListResponse<SupportTicket>(data, ['tickets', 'items', 'data', 'results', 'supportTickets']);
}

export async function updateSupportTicketStatusRequest(
  ticketId: string,
  status: SupportTicketStatus,
  adminNotes?: string
): Promise<SupportTicket> {
  const { data } = await apiClient.put<SupportTicket>(`/support/tickets/${ticketId}/status`, {
    status,
    adminNotes,
  });
  return data;
}

export async function fetchNotifications(params?: { limit?: number; unreadOnly?: boolean }): Promise<AdminNotification[]> {
  const queryParams: Record<string, string> = {};
  if (params?.limit) queryParams.limit = String(params.limit);
  if (params?.unreadOnly) queryParams.unreadOnly = String(params.unreadOnly);
  const { data } = await apiClient.get('/notifications', {
    params: queryParams,
  });
  return normalizeListResponse<AdminNotification>(data, ['notifications', 'items', 'data', 'results']);
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>('/notifications/unread-count');
  return data.count;
}

export async function createNotificationRequest(
  payload: CreateNotificationPayload
): Promise<AdminNotification> {
  const { data } = await apiClient.post<AdminNotification>('/notifications', payload);
  return data;
}

export async function markNotificationsReadRequest(notificationIds?: string[]): Promise<number> {
  const { data } = await apiClient.put<{ count: number }>('/notifications/mark-as-read', {
    notificationIds,
  });
  return data.count;
}

export async function markNotificationReadRequest(notificationId: string): Promise<AdminNotification> {
  const { data } = await apiClient.put<AdminNotification>(`/notifications/${notificationId}/mark-as-read`);
  return data;
}

export async function deleteNotificationRequest(notificationId: string): Promise<void> {
  await apiClient.delete(`/notifications/${notificationId}`);
}

export async function fetchAdminProfile(): Promise<AdminProfile> {
  const { data } = await apiClient.get<AdminProfile>('/users/me');
  return data;
}

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  // Use Promise.allSettled to handle failures gracefully
  const results = await Promise.allSettled([
    fetchDashboardMetrics(),
    fetchSalesTrend(),
    fetchTopCategories(),
    fetchCommissionRevenue(),
    fetchOrderDistribution(),
    fetchLowStock(),
    fetchSellers(),
  ]);

  // Extract results with fallbacks
  const metrics = results[0].status === 'fulfilled' ? results[0].value : {
    totalUsers: 0,
    totalSellers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCommissions: 0,
    pendingOrders: 0,
    activeDeliveries: 0,
    pendingApprovals: 0,
  };

  const salesTrend = results[1].status === 'fulfilled' ? results[1].value : {
    trend: [],
    totalSales: 0,
    totalOrders: 0,
    period: 'last-7-days',
  };

  const topCategories = results[2].status === 'fulfilled' ? results[2].value : {
    categories: [],
    total: 0,
  };

  const commissionRevenue = results[3].status === 'fulfilled' ? results[3].value : {
    periods: [],
    totalRevenue: 0,
    growth: 0,
  };

  const orderDistribution = results[4].status === 'fulfilled' ? results[4].value : [];
  const lowStock = results[5].status === 'fulfilled' ? results[5].value : [];
  const sellers = results[6].status === 'fulfilled' ? results[6].value : [];

  const pendingSellerApprovals = (sellers || []).filter((seller) => seller.kycStatus === 'PENDING').length;
  const pendingPayments =
    (orderDistribution || []).find((entry) => entry.status.toLowerCase().includes('pending'))?.count ?? 0;

  return {
    metrics,
    salesTrend,
    topCategories,
    commissionRevenue,
    orderDistribution: orderDistribution || [],
    lowStock: lowStock || [],
    pendingSellerApprovals,
    pendingPayments,
  };
}

// Global Search API
export interface GlobalSearchResult {
  sellers: Array<{
    id: string;
    businessName: string;
    kycStatus: string;
    email?: string;
  }>;
  orders: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    user?: { name?: string; email?: string };
  }>;
  products: Array<{
    id: string;
    title: string;
    price: number;
    status: string;
    seller?: { businessName: string };
  }>;
  deliveries: Array<{
    id: string;
    orderId: string;
    status: string;
    rider?: string;
  }>;
}

export async function globalSearch(query: string): Promise<GlobalSearchResult> {
  const { data } = await apiClient.get('/admin/search', {
    params: { q: query },
  });
  
  // Normalize response - handle both direct response and wrapped response
  const dataObj = data as Record<string, unknown>;
  const response = dataObj?.data || data;
  const searchData = response as Record<string, unknown>;
  
  return {
    sellers: normalizeListResponse(searchData?.sellers, ['sellers', 'items', 'data']),
    orders: normalizeListResponse(searchData?.orders, ['orders', 'items', 'data']),
    products: normalizeListResponse(searchData?.products, ['products', 'items', 'data']),
    deliveries: normalizeListResponse(searchData?.deliveries, ['deliveries', 'items', 'data']),
  };
}

// Settings API
export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const { data } = await apiClient.get('/settings/platform');
  const response = (data as Record<string, unknown>)?.data || data;
  return response as PlatformSettings;
}

export async function updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<PlatformSettings> {
  const { data } = await apiClient.put('/settings/platform', settings);
  const response = (data as Record<string, unknown>)?.data || data;
  return response as PlatformSettings;
}

export async function fetchPaymentGatewaySettings(): Promise<PaymentGatewaySettings> {
  const { data } = await apiClient.get('/settings/payment-gateway');
  const response = (data as Record<string, unknown>)?.data || data;
  return response as PaymentGatewaySettings;
}

export async function updatePaymentGatewaySettings(settings: Partial<PaymentGatewaySettings>): Promise<PaymentGatewaySettings> {
  const { data } = await apiClient.put('/settings/payment-gateway', settings);
  const response = (data as Record<string, unknown>)?.data || data;
  return response as PaymentGatewaySettings;
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const { data } = await apiClient.get('/settings/team');
  return normalizeListResponse<TeamMember>(data, ['members', 'team', 'items', 'data']);
}

export async function createTeamMember(payload: CreateTeamMemberPayload): Promise<TeamMember> {
  const { data } = await apiClient.post('/settings/team', payload);
  const response = (data as Record<string, unknown>)?.data || data;
  return response as TeamMember;
}

export async function updateTeamMember(memberId: string, payload: UpdateTeamMemberPayload): Promise<TeamMember> {
  const { data } = await apiClient.put(`/settings/team/${memberId}`, payload);
  const response = (data as Record<string, unknown>)?.data || data;
  return response as TeamMember;
}

export async function deleteTeamMember(memberId: string): Promise<void> {
  await apiClient.delete(`/settings/team/${memberId}`);
}
