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
  Feedback,
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

/**
 * Standardized response normalization utility
 * Handles both wrapped (data.data) and unwrapped (data) responses consistently
 */
function normalizeResponse<T>(response: unknown): T {
  if (!response || typeof response !== 'object') {
    return response as T;
  }
  
  const dataObj = response as Record<string, unknown>;
  
  // Check if response is wrapped in a 'data' property (TransformInterceptor pattern)
  if ('data' in dataObj && dataObj.data !== undefined) {
    return dataObj.data as T;
  }
  
  // Return the response as-is if not wrapped
  return response as T;
}

/**
 * Transform product from backend format (title, quantity) to frontend format (name, stockQuantity)
 */
function transformProduct<T extends { title?: string; name?: string; quantity?: number; stockQuantity?: number }>(product: T): T {
  return {
    ...product,
    name: product.title || product.name,
    stockQuantity: product.quantity ?? product.stockQuantity ?? 0,
  } as T;
}

/**
 * Transform array of products
 */
function transformProducts<T extends { title?: string; name?: string; quantity?: number; stockQuantity?: number }>(products: T[]): T[] {
  return products.map(transformProduct);
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const { data } = await apiClient.get('/reports/dashboard');
  
  // Normalize response - handle wrapped or unwrapped
  const normalized = normalizeResponse<Record<string, unknown>>(data);
  const metrics = (normalized?.metrics || normalized) as Record<string, unknown>;
  
  return {
    totalUsers: (metrics?.totalUsers as number) ?? 0,
    totalSellers: (metrics?.totalSellers as number) ?? 0,
    totalProducts: (metrics?.totalProducts as number) ?? 0,
    totalOrders: (metrics?.totalOrders as number) ?? 0,
    totalRevenue: (metrics?.totalRevenue as number) ?? 0,
    totalCommissions: (metrics?.totalCommissions as number) ?? 0,
    pendingOrders: (metrics?.pendingOrders as number) ?? 0,
    activeDeliveries: (metrics?.activeDeliveries as number) ?? 0,
    pendingApprovals: (metrics?.pendingApprovals as number) ?? 0,
    totalCustomers: (metrics?.totalCustomers as number) ?? 0,
    newCustomersThisMonth: (metrics?.newCustomersThisMonth as number) ?? 0,
    activeCustomersThisMonth: (metrics?.activeCustomersThisMonth as number) ?? 0,
    customerRetentionRate: (metrics?.customerRetentionRate as number) ?? 0,
  };
}

export async function fetchSalesTrend(): Promise<SalesTrendResponse> {
  const { data } = await apiClient.get('/reports/sales-trend');
  
  const normalized = normalizeResponse<Record<string, unknown>>(data);
  
  return {
    trend: Array.isArray(normalized?.trend) ? normalized.trend : [],
    totalSales: (normalized?.totalSales as number) ?? 0,
    totalOrders: (normalized?.totalOrders as number) ?? 0,
    period: (normalized?.period as string) ?? 'last-7-days',
  };
}

export async function fetchOrderDistribution(): Promise<OrderDistributionEntry[]> {
  const { data } = await apiClient.get('/reports/order-distribution');
  
  const normalized = normalizeResponse<unknown>(data);
  
  // If it's already an array, return it
  if (Array.isArray(normalized)) {
    return normalized;
  }
  
  // If it has a distribution property, use that
  if (normalized && typeof normalized === 'object' && 'distribution' in normalized) {
    const responseData = normalized as { distribution: unknown };
    if (Array.isArray(responseData.distribution)) {
      return responseData.distribution;
    }
  }
  
  // Otherwise return empty array
  return [];
}

export async function fetchTopCategories(): Promise<TopCategoriesResponse> {
  try {
    const { data } = await apiClient.get('/reports/top-categories');
    
    const normalized = normalizeResponse<Record<string, unknown>>(data);
    
    return {
      categories: normalizeListResponse(normalized?.categories, ['categories', 'items', 'data']),
      total: (normalized?.total as number) ?? 0,
    };
  } catch (error) {
    // Return empty data if endpoint doesn't exist yet
    return {
      categories: [],
      total: 0,
    };
  }
}

export async function fetchCommissionRevenue(): Promise<CommissionRevenueResponse> {
  try {
    const { data } = await apiClient.get('/reports/commission-revenue');
    
    const normalized = normalizeResponse<Record<string, unknown>>(data);
    
    return {
      periods: normalizeListResponse(normalized?.periods, ['periods', 'items', 'data']),
      totalRevenue: (normalized?.totalRevenue as number) ?? 0,
      growth: (normalized?.growth as number) ?? 0,
    };
  } catch (error) {
    // Return empty data if endpoint doesn't exist yet
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

export async function rejectSellerRequest(sellerId: string, rejectionReason?: string): Promise<void> {
  await apiClient.put(`/sellers/${sellerId}/reject`, {
    rejectionReason: rejectionReason || undefined,
  });
}

export async function bulkApproveSellersRequest(sellerIds: string[]): Promise<{ approved: number; failed: number }> {
  const { data } = await apiClient.post('/sellers/bulk-approve', { sellerIds });
  return normalizeResponse<{ approved: number; failed: number }>(data);
}

export async function bulkRejectSellersRequest(sellerIds: string[], rejectionReason?: string): Promise<{ rejected: number; failed: number }> {
  const { data } = await apiClient.post('/sellers/bulk-reject', {
    sellerIds,
    rejectionReason: rejectionReason || undefined,
  });
  return normalizeResponse<{ rejected: number; failed: number }>(data);
}

export async function fetchPendingProducts(): Promise<PendingProduct[]> {
  const { data } = await apiClient.get('/products/pending');
  const normalized = normalizeListResponse<PendingProduct>(data, ['products', 'items', 'data', 'results', 'pending']);
  return transformProducts(normalized);
}

export async function fetchAllProducts(): Promise<PendingProduct[]> {
  const { data } = await apiClient.get('/products/admin/all');
  const normalized = normalizeListResponse<PendingProduct>(data, ['products', 'items', 'data', 'results']);
  return transformProducts(normalized);
}

export async function approveProductRequest(productId: string): Promise<void> {
  await apiClient.put(`/products/${productId}/approve`);
}

export async function rejectProductRequest(productId: string): Promise<void> {
  await apiClient.put(`/products/${productId}/reject`);
}

// Admin bulk product operations
export async function bulkApproveProductsRequest(productIds: string[]): Promise<{ approved: number; failed: number }> {
  const { data } = await apiClient.post('/products/admin/bulk-approve', { productIds });
  return normalizeResponse<{ approved: number; failed: number }>(data);
}

export async function bulkRejectProductsRequest(productIds: string[], reason?: string): Promise<{ rejected: number; failed: number }> {
  const { data } = await apiClient.post('/products/admin/bulk-reject', { productIds, reason });
  return normalizeResponse<{ rejected: number; failed: number }>(data);
}

export async function bulkDeleteProductsRequest(productIds: string[]): Promise<{ deleted: number; failed: number }> {
  const { data } = await apiClient.post('/products/admin/bulk-delete', { productIds });
  return normalizeResponse<{ deleted: number; failed: number }>(data);
}

export async function bulkStatusChangeRequest(productIds: string[], status: string): Promise<{ updated: number; failed: number }> {
  const { data } = await apiClient.post('/products/admin/bulk-status-change', { productIds, status });
  return normalizeResponse<{ updated: number; failed: number }>(data);
}

export async function fetchAdminOrders(): Promise<AdminOrder[]> {
  const { data } = await apiClient.get('/orders');
  return normalizeListResponse<AdminOrder>(data, ['orders', 'items', 'data', 'results']);
}

export async function fetchAdminOrderById(orderId: string): Promise<AdminOrder> {
  const { data } = await apiClient.get(`/orders/${orderId}`);
  return normalizeResponse<AdminOrder>(data);
}

export async function updateOrderStatusRequest(orderId: string, status: AdminOrderStatus): Promise<void> {
  await apiClient.put(`/orders/${orderId}/status`, { status });
}

export async function fetchActiveDeliveries(): Promise<AdminDelivery[]> {
  const { data } = await apiClient.get('/delivery/active');
  return normalizeListResponse<AdminDelivery>(data, ['deliveries', 'items', 'data', 'results']);
}

export async function fetchDeliveryByOrderId(orderId: string): Promise<AdminDelivery> {
  const { data } = await apiClient.get(`/delivery/orders/${orderId}`);
  return normalizeResponse<AdminDelivery>(data);
}

export interface AvailableRider {
  id: string;
  name: string;
  email: string;
  phone?: string;
  riderProfile?: {
    id: string;
    vehicleType?: string;
    vehicleNumber?: string;
    isAvailable: boolean;
    currentLat?: number;
    currentLng?: number;
    lastLocationUpdate?: string;
  };
}

export async function fetchAvailableRiders(): Promise<AvailableRider[]> {
  try {
    const { data } = await apiClient.get('/delivery/riders/available');
    const normalized = normalizeResponse<unknown>(data);
    
    if (Array.isArray(normalized)) {
      return normalized as AvailableRider[];
    }
    
    return [];
  } catch (error: any) {
    return [];
  }
}

export async function assignDeliveryRequest(input: {
  orderId: string;
  riderId?: string;
  rider?: string; // For backward compatibility
  eta?: string;
}): Promise<AdminDelivery> {
  // Use riderId if provided, otherwise use rider (for backward compatibility)
  const payload: any = {
    orderId: input.orderId,
    ...(input.riderId && { riderId: input.riderId }),
    ...(input.rider && !input.riderId && { riderId: input.rider }), // Fallback to rider if riderId not provided
    ...(input.eta && { eta: input.eta }),
  };
  const { data } = await apiClient.post('/delivery/assign', payload);
  return normalizeResponse<AdminDelivery>(data);
}

export async function updateDeliveryStatusRequest(
  deliveryId: string,
  status: AdminDeliveryStatus,
  updates?: { rider?: string; eta?: string }
): Promise<AdminDelivery> {
  const { data } = await apiClient.put(`/delivery/${deliveryId}/status`, {
    status,
    ...updates,
  });
  return normalizeResponse<AdminDelivery>(data);
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
  const { data } = await apiClient.get('/payouts/requests');
  return normalizeListResponse<AdminPayout>(data, ['payouts', 'items', 'data', 'results']);
}

export async function approvePayoutRequest(payoutId: string): Promise<void> {
  await apiClient.put(`/payouts/requests/${payoutId}/approve`);
}

export async function rejectPayoutRequest(payoutId: string): Promise<void> {
  await apiClient.put(`/payouts/requests/${payoutId}/reject`);
}

export async function processPayoutRequest(
  payoutId: string,
  payload: ProcessPayoutPayload
): Promise<void> {
  await apiClient.post(`/payouts/requests/${payoutId}/process`, payload);
}

export async function fetchSalesReport(
  params?: ReportsQueryParams
): Promise<SalesReportDto> {
  const { data } = await apiClient.get('/reports/sales', { params });
  
  const normalized = normalizeResponse<Record<string, unknown>>(data);
  const report = (normalized?.report || normalized) as Record<string, unknown>;
  
  return {
    totalSales: (report?.totalSales as number) ?? 0,
    totalOrders: (report?.totalOrders as number) ?? 0,
    totalProductsSold: (report?.totalProductsSold as number) ?? 0,
    startDate: report?.startDate as string | undefined,
    endDate: report?.endDate as string | undefined,
  };
}

export async function fetchEarningsReport(
  params?: ReportsQueryParams
): Promise<EarningsReportDto> {
  const { data } = await apiClient.get('/reports/earnings', { params });
  
  const normalized = normalizeResponse<Record<string, unknown>>(data);
  const report = (normalized?.report || normalized) as Record<string, unknown>;
  
  return {
    totalGross: (report?.totalGross as number) ?? 0,
    totalCommission: (report?.totalCommission as number) ?? 0,
    totalNet: (report?.totalNet as number) ?? 0,
    totalOrders: (report?.totalOrders as number) ?? 0,
    startDate: report?.startDate as string | undefined,
    endDate: report?.endDate as string | undefined,
  };
}

export async function fetchInventoryReport(): Promise<InventoryReportDto> {
  const { data } = await apiClient.get('/reports/inventory');
  
  const normalized = normalizeResponse<Record<string, unknown>>(data);
  const report = (normalized?.report || normalized) as Record<string, unknown>;
  
  return {
    totalProducts: (report?.totalProducts as number) ?? 0,
    totalQuantity: (report?.totalQuantity as number) ?? 0,
    lowStockCount: (report?.lowStockCount as number) ?? 0,
    outOfStockCount: (report?.outOfStockCount as number) ?? 0,
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
  const { data } = await apiClient.put(`/support/tickets/${ticketId}/status`, {
    status,
    adminNotes,
  });
  return normalizeResponse<SupportTicket>(data);
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
  try {
    const { data } = await apiClient.get('/notifications/unread-count');
    const normalized = normalizeResponse<{ count?: number }>(data);
    return normalized?.count ?? 0;
  } catch (error: any) {
    // Return 0 on error (e.g., 401 unauthorized, network error)
    return 0;
  }
}

export async function createNotificationRequest(
  payload: CreateNotificationPayload
): Promise<AdminNotification> {
  const { data } = await apiClient.post('/notifications', payload);
  return normalizeResponse<AdminNotification>(data);
}

export async function markNotificationsReadRequest(notificationIds?: string[]): Promise<number> {
  const { data } = await apiClient.put('/notifications/mark-as-read', {
    notificationIds,
  });
  const normalized = normalizeResponse<{ count?: number }>(data);
  return normalized?.count ?? 0;
}

export async function markNotificationReadRequest(notificationId: string): Promise<AdminNotification> {
  const { data } = await apiClient.put(`/notifications/${notificationId}/mark-as-read`);
  return normalizeResponse<AdminNotification>(data);
}

export async function deleteNotificationRequest(notificationId: string): Promise<void> {
  await apiClient.delete(`/notifications/${notificationId}`);
}

export async function fetchAdminProfile(): Promise<AdminProfile> {
  const { data } = await apiClient.get('/users/me');
  return normalizeResponse<AdminProfile>(data);
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
    totalCustomers: 0,
    newCustomersThisMonth: 0,
    activeCustomersThisMonth: 0,
    customerRetentionRate: 0,
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
  
  const normalized = normalizeResponse<Record<string, unknown>>(data);
  
  return {
    sellers: normalizeListResponse(normalized?.sellers, ['sellers', 'items', 'data']),
    orders: normalizeListResponse(normalized?.orders, ['orders', 'items', 'data']),
    products: normalizeListResponse(normalized?.products, ['products', 'items', 'data']),
    deliveries: normalizeListResponse(normalized?.deliveries, ['deliveries', 'items', 'data']),
  };
}

// Settings API
export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  try {
    const { data } = await apiClient.get('/settings/platform');
    return normalizeResponse<PlatformSettings>(data);
  } catch (error: any) {
    // Return default settings if endpoint doesn't exist
    if (error?.response?.status === 404) {
      return {
        commissionPercentage: 15,
        deliveryCalculation: 'distance',
        baseFee: 1500,
        perMileFee: 350,
        smsEnabled: true,
        emailEnabled: true,
        pushEnabled: false,
      };
    }
    throw error;
  }
}

export async function updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<PlatformSettings> {
  const { data } = await apiClient.put('/settings/platform', settings);
  return normalizeResponse<PlatformSettings>(data);
}

export async function fetchPaymentGatewaySettings(): Promise<PaymentGatewaySettings> {
  try {
    const { data } = await apiClient.get('/settings/payment-gateway');
    return normalizeResponse<PaymentGatewaySettings>(data);
  } catch (error: any) {
    // Return default settings if endpoint doesn't exist
    if (error?.response?.status === 404) {
      return {
        paystackSecretKey: '',
        flutterwaveSecretKey: '',
      };
    }
    throw error;
  }
}

export async function updatePaymentGatewaySettings(settings: Partial<PaymentGatewaySettings>): Promise<PaymentGatewaySettings> {
  const { data } = await apiClient.put('/settings/payment-gateway', settings);
  return normalizeResponse<PaymentGatewaySettings>(data);
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  try {
    const { data } = await apiClient.get('/settings/team');
    return normalizeListResponse<TeamMember>(data, ['members', 'team', 'items', 'data']);
  } catch (error: any) {
    // Return empty array if endpoint doesn't exist
    if (error?.response?.status === 404) {
      return [];
    }
    throw error;
  }
}

export async function createTeamMember(payload: CreateTeamMemberPayload): Promise<TeamMember> {
  const { data } = await apiClient.post('/settings/team', payload);
  return normalizeResponse<TeamMember>(data);
}

export async function updateTeamMember(memberId: string, payload: UpdateTeamMemberPayload): Promise<TeamMember> {
  const { data } = await apiClient.put(`/settings/team/${memberId}`, payload);
  return normalizeResponse<TeamMember>(data);
}

export async function deleteTeamMember(memberId: string): Promise<void> {
  await apiClient.delete(`/settings/team/${memberId}`);
}

// Feedback API
export async function fetchFeedbacks(): Promise<Feedback[]> {
  try {
    const { data } = await apiClient.get('/feedback');
    const normalized = normalizeResponse<unknown>(data);
    
    // Handle direct array response or wrapped response
    if (Array.isArray(normalized)) {
      return normalized;
    }
    
    return normalizeListResponse<Feedback>(normalized, ['feedbacks', 'items', 'data', 'results']);
  } catch (error) {
    throw error;
  }
}

export async function deleteFeedbackRequest(feedbackId: string): Promise<void> {
  await apiClient.delete(`/feedback/${feedbackId}`);
}
