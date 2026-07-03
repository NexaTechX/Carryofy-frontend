import type { OrderCancellationReason } from '../../types/order';

/** Human-readable labels for every structured cancellation reason. */
export const CANCELLATION_REASON_LABELS: Record<OrderCancellationReason, string> = {
  SELLER_UNAVAILABLE: 'Seller unavailable',
  BUYER_CANCELLED: 'Cancelled by buyer',
  PAYMENT_FAILED: 'Payment failed',
  OUT_OF_STOCK: 'Out of stock',
  LOGISTICS_ISSUE: 'Logistics issue',
  OTHER: 'Other',
  UNKNOWN_PRE_FEATURE: 'Unknown (pre-feature)',
};

export function cancellationReasonLabel(
  reason: OrderCancellationReason | null | undefined,
): string {
  if (!reason) return 'Not specified';
  return CANCELLATION_REASON_LABELS[reason] ?? 'Not specified';
}

/**
 * Reasons a buyer may pick when canceling their own order. Operational reasons
 * (out of stock, seller unavailable, logistics) and the backfill sentinel are
 * excluded — those are set by admins/sellers/the system, not the buyer.
 */
export const BUYER_CANCELLATION_REASON_OPTIONS: {
  value: OrderCancellationReason;
  label: string;
}[] = [
  { value: 'BUYER_CANCELLED', label: 'I changed my mind / no longer need it' },
  { value: 'OTHER', label: 'Other (please describe)' },
];

/**
 * Reasons an admin may pick when canceling an order from the control center.
 * Excludes the backfill-only UNKNOWN_PRE_FEATURE sentinel.
 */
export const ADMIN_CANCELLATION_REASON_OPTIONS: {
  value: OrderCancellationReason;
  label: string;
}[] = [
  { value: 'SELLER_UNAVAILABLE', label: 'Seller unavailable' },
  { value: 'OUT_OF_STOCK', label: 'Out of stock' },
  { value: 'PAYMENT_FAILED', label: 'Payment failed' },
  { value: 'LOGISTICS_ISSUE', label: 'Logistics issue' },
  { value: 'BUYER_CANCELLED', label: 'Cancelled by buyer' },
  { value: 'OTHER', label: 'Other (please describe)' },
];
