import { formatNgnFromKobo } from '../api/utils';

export type SellerPayoutStatus =
  | 'awaiting_payment'
  | 'pending_confirmation'
  | 'confirmed'
  | 'canceled';

export interface SellerOrderPayoutFields {
  status: string;
  yourPayoutKobo?: number | null;
  payoutStatus?: SellerPayoutStatus;
  orderValueProductKobo?: number | null;
  platformFeeKobo?: number | null;
}

const PAID_PLUS_STATUSES = new Set([
  'PAID',
  'PROCESSING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
]);

export function isSellerOrderUnpaid(status: string): boolean {
  return status === 'PENDING_PAYMENT';
}

export function isSellerOrderPaidPlus(status: string): boolean {
  return PAID_PLUS_STATUSES.has(status);
}

/** Net payout in kobo when confirmed; null when payout must not be shown as a number. */
export function getSellerPayoutKobo(order: SellerOrderPayoutFields): number | null {
  if (order.status === 'CANCELED' || order.payoutStatus === 'canceled') {
    return null;
  }
  if (isSellerOrderUnpaid(order.status) || order.payoutStatus === 'awaiting_payment') {
    return null;
  }
  if (order.payoutStatus === 'pending_confirmation') {
    return null;
  }
  if (typeof order.yourPayoutKobo === 'number' && order.yourPayoutKobo >= 0) {
    return order.yourPayoutKobo;
  }
  return null;
}

/** Human-readable payout cell (never buyer order total). */
export function formatSellerPayoutLabel(order: SellerOrderPayoutFields): string {
  if (isSellerOrderUnpaid(order.status) || order.payoutStatus === 'awaiting_payment') {
    return 'Pending payment';
  }
  if (order.status === 'CANCELED' || order.payoutStatus === 'canceled') {
    return '—';
  }
  if (order.payoutStatus === 'pending_confirmation') {
    return 'Payout pending';
  }
  const kobo = getSellerPayoutKobo(order);
  if (kobo === null) {
    return '—';
  }
  return formatNgnFromKobo(kobo);
}

export function sellerPayoutDetailMessage(order: SellerOrderPayoutFields): string | null {
  if (isSellerOrderUnpaid(order.status) || order.payoutStatus === 'awaiting_payment') {
    return 'Payout pending — order not yet paid';
  }
  if (order.payoutStatus === 'pending_confirmation') {
    return 'Payout pending — confirming payment';
  }
  return null;
}
