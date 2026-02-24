/**
 * Unified status chip color system for admin operational pages:
 * amber = pending/waiting, blue = in progress, green = completed/approved,
 * red = cancelled/rejected/failed, grey = closed/expired.
 * Maps to StatusBadge tones: warning, info, success, danger, neutral.
 */
export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

/** Pending/waiting → amber (warning) */
const AMBER_STATUSES = new Set([
  'PENDING_PAYMENT', 'PAID', 'OUT_FOR_DELIVERY',
  'REQUESTED', 'PENDING', 'FLAGGED', 'PREPARING',
]);

/** In progress → blue (info) */
const BLUE_STATUSES = new Set([
  'PROCESSING', 'OUT_FOR_DELIVERY', 'IN_TRANSIT', 'PICKED_UP',
]);

/** Completed/approved → green (success) */
const GREEN_STATUSES = new Set([
  'DELIVERED', 'COMPLETED', 'APPROVED', 'CLEAN',
]);

/** Cancelled/rejected/failed → red (danger) */
const RED_STATUSES = new Set([
  'CANCELED', 'CANCELLED', 'REJECTED', 'ISSUE', 'FAILED',
]);

/** Closed/expired → grey (neutral) */
const GREY_STATUSES = new Set([
  'CLOSED', 'EXPIRED', 'HIDDEN',
]);

export function getStatusTone(status: string): StatusTone {
  const s = (status || '').toUpperCase().replace(/\s+/g, '_');
  if (RED_STATUSES.has(s)) return 'danger';
  if (GREEN_STATUSES.has(s)) return 'success';
  if (BLUE_STATUSES.has(s)) return 'info';
  if (GREY_STATUSES.has(s)) return 'neutral';
  if (AMBER_STATUSES.has(s)) return 'warning';
  // Fallback by substring
  if (/PENDING|WAITING|REQUESTED|FLAGGED|PREPARING|PICKED|TRANSIT/.test(s)) return 'warning';
  if (/COMPLETED|DELIVERED|APPROVED|CLEAN/.test(s)) return 'success';
  if (/CANCEL|REJECT|FAIL|ISSUE/.test(s)) return 'danger';
  if (/PROCESSING|IN_PROGRESS/.test(s)) return 'info';
  if (/CLOSED|EXPIRED|HIDDEN/.test(s)) return 'neutral';
  return 'neutral';
}
