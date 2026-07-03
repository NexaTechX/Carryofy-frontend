/**
 * Order-related TypeScript types matching backend API DTOs
 */

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    title: string;
    images: string[];
    seller?: {
      id: string;
      businessName: string;
    };
  };
}

export interface Delivery {
  id: string;
  status: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export type OrderCancellationReason =
  | 'SELLER_UNAVAILABLE'
  | 'BUYER_CANCELLED'
  | 'PAYMENT_FAILED'
  | 'OUT_OF_STOCK'
  | 'LOGISTICS_ISSUE'
  | 'OTHER'
  | 'UNKNOWN_PRE_FEATURE';

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  amount: number;
  status: string;
  cancellationReason?: OrderCancellationReason | null;
  cancellationReasonText?: string | null;
  canceledAt?: string | null;
  paymentRef?: string;
  delivery?: Delivery;
  createdAt: string;
  updatedAt: string;
}
