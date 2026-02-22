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

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  amount: number;
  status: string;
  paymentRef?: string;
  delivery?: Delivery;
  createdAt: string;
  updatedAt: string;
}
