/**
 * Single source of truth for seller KYC messaging (ETA, CTAs, status destinations).
 * Keep every seller surface aligned so vendors never see conflicting timelines or dead links.
 */

/** Human-facing review SLA — use everywhere (banner, products gate, submitted, help). */
export const KYC_REVIEW_ETA = 'usually within 1 business day';

/** Short form for compact UI (buttons, chips). */
export const KYC_REVIEW_ETA_SHORT = '1 business day';

export const KYC_ONBOARDING_HREF = '/seller/onboarding';

export function kycStatusCtaLabel(
  status: string | null | undefined,
): string {
  switch (String(status || '').toUpperCase()) {
    case 'PENDING':
      return 'View status';
    case 'REJECTED':
      return 'Fix & resubmit';
    case 'APPROVED':
      return 'Add product';
    default:
      return 'Get verified';
  }
}

export function kycAddProductBlockedReason(
  status: string | null | undefined,
): string {
  switch (String(status || '').toUpperCase()) {
    case 'PENDING':
      return `Verification under review — you can list products once approved (${KYC_REVIEW_ETA}).`;
    case 'REJECTED':
      return 'Verification was rejected. Fix your details and resubmit to unlock product listing.';
    case 'APPROVED':
      return '';
    default:
      return 'Complete verification to list products and receive payouts.';
  }
}
