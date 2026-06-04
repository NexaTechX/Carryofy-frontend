import React from 'react';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

const toneClasses: Record<Tone, string> = {
  success: 'text-success bg-success-soft border-success/30',
  warning: 'text-warning bg-warning-soft border-warning/30',
  danger: 'text-danger bg-danger-soft border-danger/30',
  info: 'text-info bg-info-soft border-info/30',
  primary: 'text-primary bg-primary/12 border-primary/30',
  neutral: 'text-foreground/70 bg-[color-mix(in_srgb,var(--color-foreground)_8%,transparent)] border-border-custom',
};

/**
 * Maps the platform's status strings (orders, payouts, KYC, deliveries) to a
 * semantic tone, so every role renders the same status the same way.
 */
const STATUS_TONE: Record<string, Tone> = {
  // Orders / deliveries
  PENDING_PAYMENT: 'warning',
  PAYMENT_PENDING_VERIFICATION: 'warning',
  PAID: 'info',
  PROCESSING: 'info',
  OUT_FOR_DELIVERY: 'info',
  DELIVERED: 'success',
  CANCELED: 'danger',
  CANCELLED: 'danger',
  FAILED_PAYMENT: 'danger',
  REFUNDED: 'neutral',
  // Payout lifecycle
  REQUESTED: 'warning',
  APPROVED: 'info',
  REJECTED: 'danger',
  // KYC
  NOT_SUBMITTED: 'neutral',
  SUBMITTED: 'warning',
  // Generic
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  SUSPENDED: 'danger',
};

function toneFor(status: string): Tone {
  return STATUS_TONE[status?.toUpperCase?.() ?? ''] ?? 'neutral';
}

function humanize(status: string): string {
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface StatusBadgeProps {
  /** Raw status string (e.g. "OUT_FOR_DELIVERY"); tone + label are derived. */
  status?: string;
  /** Override the derived tone. */
  tone?: Tone;
  /** Override the displayed label. */
  label?: string;
  /** Show a leading status dot. */
  dot?: boolean;
  className?: string;
}

export function StatusBadge({ status = '', tone, label, dot = true, className = '' }: StatusBadgeProps) {
  const resolvedTone = tone ?? toneFor(status);
  const text = label ?? humanize(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses[resolvedTone]} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {text}
    </span>
  );
}

export default StatusBadge;
