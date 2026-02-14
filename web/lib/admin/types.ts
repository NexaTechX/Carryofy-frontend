export interface DashboardMetrics {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  todaysOrders?: number; // orders created today (admin)
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
  amountB2B?: number;
  amountB2C?: number;
  percentage: number;
}

export interface CommissionRevenueResponse {
  periods: CommissionPeriodEntry[];
  totalRevenue: number; // in kobo
  totalB2B?: number;
  totalB2C?: number;
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
  pendingQuoteRequestsCount?: number;
  b2bOrdersCount?: number;
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
  kycExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  kyc?: {
    id: string;
    businessType: string;
    registrationNumber?: string;
    taxId?: string;
    idType: string;
    idNumber: string;
    idImage: string;
    addressProofImage?: string;
    bvn?: string;
    submittedAt: string;
    rejectionReason?: string;
    rejectedBy?: string;
    rejectedAt?: string;
    submissionCount: number;
  } | null;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export type AdminProductStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface PendingProduct {
  id: string;
  title: string;
  name?: string; // Frontend field name (mapped from title)
  description?: string;
  price: number;
  images: string[];
  quantity: number;
  stockQuantity?: number; // Frontend field name (mapped from quantity)
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
  rider?: string | { id: string; name: string; phone?: string } | null;
  riderId?: string | null;
  eta?: string | null;
  deliveryAddress?: string | null;
  deliveryAddressInfo?: {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    country: string;
    postalCode?: string | null;
    fullAddress: string;
  } | null;
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
  address?: {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    country: string;
    postalCode?: string | null;
  } | null;
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
  orderId?: string | null;
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

export type PayoutStatus = 'REQUESTED' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'CANCELLED' | 'REJECTED';

export interface AdminPayout {
  id: string;
  sellerId: string;
  amount: number; // in kobo
  status: PayoutStatus;
  requestedAt: string;
  approvedAt?: string | null;
  processedAt?: string | null;
  paidAt?: string | null;
  cancelledAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  paystackTransferRef?: string | null;
  paystackRecipientCode?: string | null;
  createdAt: string;
  updatedAt: string;
  seller?: {
    id: string;
    businessName: string;
    user?: {
      id: string;
      name: string;
      email: string;
    };
  };
  earnings?: Array<{
    id: string;
    orderId: string;
    net: number; // in kobo
  }>;
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
  shippingCalculationMode: 'FLAT' | 'WEIGHT';
  baseFeeKobo: number;
  perKgFeeKobo: number;
  defaultWeightKg: number;
  standardMultiplier: number;
  expressMultiplier: number;
  shippingVersion: number;
  smsEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  riderBaseFeeKobo: number;
  riderPerKmFeeKobo: number;
  allowBankTransfer: boolean;
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

export interface Feedback {
  id: string;
  userId: string;
  rating: number; // 1-5 stars
  category: string;
  feedback: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

// Broadcast (admin notification/email broadcast)
export type BroadcastAudience = 'BUYER' | 'SELLER' | 'RIDER';

export enum BroadcastType {
  PRODUCT_LAUNCH = 'PRODUCT_LAUNCH',
  PROMOTION = 'PROMOTION',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
  OPERATIONAL_NOTICE = 'OPERATIONAL_NOTICE',
  URGENT_ALERT = 'URGENT_ALERT',
}

export enum BroadcastStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface BuyerFilters {
  newUsers?: boolean;
  activeBuyers?: boolean;
  b2bBuyers?: boolean;
  city?: string;
  state?: string;
}

export interface SellerFilters {
  verified?: boolean;
  categories?: string[];
  newlyApprovedProductsDays?: number;
}

export interface RiderFilters {
  activeOnly?: boolean;
  city?: string;
  onlineLast7Days?: boolean;
}

export interface AudienceFilters {
  buyer?: BuyerFilters;
  seller?: SellerFilters;
  rider?: RiderFilters;
}

export interface RoleMessage {
  body?: string;
  ctaLabel?: string;
  ctaLink?: string;
}

export interface RoleSpecificMessages {
  BUYER?: RoleMessage;
  SELLER?: RoleMessage;
  RIDER?: RoleMessage;
}

export interface Scheduling {
  sendNow: boolean;
  scheduledFor?: string;
  timezone?: string;
}

export interface RateLimit {
  usersPerMinute?: number;
}

export interface CreateBroadcastPayload {
  type: BroadcastType;
  audience: BroadcastAudience[];
  audienceFilters?: AudienceFilters;
  channels: { email?: boolean; inApp?: boolean };
  subject: string;
  body: string;
  roleSpecificMessages?: RoleSpecificMessages;
  ctaLabel?: string;
  ctaLink?: string;
  productIds?: string[];
  scheduling?: Scheduling;
  rateLimit?: RateLimit;
  internalNote?: string;
}

export interface BroadcastResult {
  sentInApp: number;
  sentEmail: number;
  failed: number;
}

export interface CreateBroadcastResponse {
  id: string;
  status: BroadcastStatus;
  result?: BroadcastResult;
}

export interface BroadcastProductOption {
  id: string;
  title: string;
  images: string[];
  approvedAt?: string | null;
  price?: number;
  sellerName?: string;
  categoryName?: string;
  quantity?: number;
}

export interface AudienceCount {
  BUYER: number;
  SELLER: number;
  RIDER: number;
  total: number;
}

export interface BroadcastListItem {
  id: string;
  type: BroadcastType;
  status: BroadcastStatus;
  audience: string[];
  channels: { email: boolean; inApp: boolean };
  subject: string;
  recipientCount: number;
  sentInApp: number;
  sentEmail: number;
  failed: number;
  emailOpens?: number;
  emailClicks?: number;
  inAppReads?: number;
  sentAt?: string;
  createdAt: string;
  sentByName?: string;
}

export interface BroadcastHistoryResponse {
  broadcasts: BroadcastListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BroadcastHistoryQuery {
  status?: BroadcastStatus;
  type?: BroadcastType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface BroadcastAnalytics {
  broadcastId: string;
  totalRecipients: number;
  sentInApp: number;
  sentEmail: number;
  failed: number;
  emailOpens: number;
  emailClicks: number;
  inAppReads: number;
  emailOpenRate: number;
  emailClickRate: number;
  inAppReadRate: number;
  perRolePerformance?: {
    BUYER?: {
      sent: number;
      opens?: number;
      clicks?: number;
      reads?: number;
    };
    SELLER?: {
      sent: number;
      opens?: number;
      clicks?: number;
      reads?: number;
    };
    RIDER?: {
      sent: number;
      opens?: number;
      clicks?: number;
      reads?: number;
    };
  };
  productCtr?: Record<string, number>;
}

export interface LocationPoint {
  userId: string;
  role: 'RIDER' | 'BUYER' | 'SELLER';
  lat: number;
  lng: number;
  lastUpdated?: string | null;
  label?: string;
}

export interface AdminLocationsResponse {
  riders: LocationPoint[];
  buyers: LocationPoint[];
  sellers: LocationPoint[];
}



