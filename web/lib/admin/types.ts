export interface DashboardMetrics {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number; // in kobo
  totalCommissions: number; // in kobo
  pendingOrders: number;
  activeDeliveries: number;
  pendingApprovals: number;
  totalCustomers?: number;
  newCustomersThisMonth?: number;
  activeCustomersThisMonth?: number;
  customerRetentionRate?: number;
}

export interface SalesTrendPoint {
  date: string;
  amount: number; // in kobo
}

export interface SalesTrendResponse {
  trend: SalesTrendPoint[];
  totalSales: number;
  totalOrders: number;
  period: string;
}

export interface TopCategoryEntry {
  category: string;
  count: number;
  revenue: number; // in kobo
  percentage: number;
}

export interface TopCategoriesResponse {
  categories: TopCategoryEntry[];
  total: number;
}

export interface CommissionPeriodEntry {
  period: string;
  amount: number; // in kobo
  percentage: number;
}

export interface CommissionRevenueResponse {
  periods: CommissionPeriodEntry[];
  totalRevenue: number; // in kobo
  growth: number; // percentage
}

export interface OrderDistributionEntry {
  status: string;
  count: number;
  percentage: number;
}

export interface OrderDistributionResponse {
  distribution: OrderDistributionEntry[];
  total: number;
}

export interface LowStockItem {
  productId: string;
  productTitle: string;
  quantity: number;
  sellerId: string;
  sellerName: string;
}

export interface SellerSummary {
  id: string;
  userId: string;
  businessName: string;
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export interface AdminDashboardData {
  metrics: DashboardMetrics;
  salesTrend: SalesTrendResponse;
  topCategories: TopCategoriesResponse;
  commissionRevenue: CommissionRevenueResponse;
  orderDistribution: OrderDistributionEntry[];
  lowStock: LowStockItem[];
  pendingSellerApprovals: number;
  pendingPayments: number;
}

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  verified: boolean;
  createdAt: string;
}

export type SellerKycStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AdminSeller {
  id: string;
  userId: string;
  businessName: string;
  kycStatus: SellerKycStatus;
  createdAt: string;
  updatedAt: string;
}

export type AdminProductStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface PendingProduct {
  id: string;
  title: string;
  description?: string;
  price: number;
  images: string[];
  quantity: number;
  category?: string;
  status: AdminProductStatus;
  sellerId: string;
  seller?: {
    id: string;
    businessName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type AdminOrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELED';

export type AdminDeliveryStatus = 'PREPARING' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'ISSUE';

export interface AdminOrderItem {
  id: string;
  productId: string;
  price: number;
  quantity: number;
  product?: {
    id: string;
    title?: string;
    images?: string[];
    seller?: {
      id: string;
      businessName: string;
    };
  };
}

export interface AdminDelivery {
  id: string;
  orderId: string;
  status: AdminDeliveryStatus;
  rider?: string | null;
  eta?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrder {
  id: string;
  userId: string;
  amount: number;
  status: AdminOrderStatus;
  paymentRef?: string;
  createdAt: string;
  updatedAt: string;
  items: AdminOrderItem[];
  delivery?: AdminDelivery | null;
  user?: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
  };
}

export type StockMovementType = 'INBOUND' | 'OUTBOUND' | 'ADJUSTMENT';

export interface WarehouseStockItem {
  productId: string;
  productTitle: string;
  quantity: number;
  sellerId: string;
  sellerName: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  createdBy?: string;
  createdAt: string;
  product?: {
    id: string;
    title?: string;
  };
}

export interface CreateInboundPayload {
  productId: string;
  sellerId: string;
  quantity: number;
  shelfId?: string;
  notes?: string;
}

export interface CreateOutboundPayload {
  orderId: string;
  productId: string;
  quantity: number;
  notes?: string;
}

export interface AdjustStockPayload {
  productId: string;
  quantity: number;
  reason: string;
}

export type PayoutStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';

export interface AdminPayout {
  id: string;
  sellerId: string;
  orderId: string;
  gross: number;
  commission: number;
  net: number;
  status: PayoutStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessPayoutPayload {
  bankAccount: string;
  bankCode: string;
  accountName: string;
}

export interface ReportsQueryParams {
  startDate?: string;
  endDate?: string;
  sellerId?: string;
  category?: string;
}

export interface SalesReportDto {
  totalSales: number;
  totalOrders: number;
  totalProductsSold: number;
  startDate?: string;
  endDate?: string;
}

export interface EarningsReportDto {
  totalGross: number;
  totalCommission: number;
  totalNet: number;
  totalOrders: number;
  startDate?: string;
  endDate?: string;
}

export interface InventoryReportDto {
  totalProducts: number;
  totalQuantity: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export type NotificationType = 'ORDER' | 'PRODUCT' | 'PAYOUT' | 'SYSTEM' | 'KYC';

export interface AdminNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  action?: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  action?: string;
}

// Settings Types
export interface PlatformSettings {
  commissionPercentage: number;
  deliveryCalculation: 'flat' | 'distance';
  baseFee: number;
  perMileFee: number;
  smsEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
}

export interface PaymentGatewaySettings {
  paystackSecretKey: string;
  flutterwaveSecretKey: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Support' | 'Finance';
  createdAt: string;
}

export interface CreateTeamMemberPayload {
  name: string;
  email: string;
  role: 'Admin' | 'Support' | 'Finance';
}

export interface UpdateTeamMemberPayload {
  name?: string;
  email?: string;
  role?: 'Admin' | 'Support' | 'Finance';
}

export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type SupportTicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  category: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  adminNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}




