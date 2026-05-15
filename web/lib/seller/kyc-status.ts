export type SellerKycStatus =
  | 'NOT_SUBMITTED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export interface SellerKycRecord {
  submissionCount?: number;
  submittedAt?: string | null;
}

const VALID_STATUSES: SellerKycStatus[] = [
  'NOT_SUBMITTED',
  'PENDING',
  'APPROVED',
  'REJECTED',
];

function hasSubmittedKyc(kyc?: SellerKycRecord | null): boolean {
  if (!kyc) return false;
  return (kyc.submissionCount ?? 0) > 0 || !!kyc.submittedAt;
}

/**
 * Normalizes API/profile KYC status so sellers who already submitted are not
 * treated as NOT_SUBMITTED (avoids showing "Apply for KYC" again).
 */
export function resolveSellerKycStatus(
  apiStatus?: string | null,
  kyc?: SellerKycRecord | null,
  sellerProfileStatus?: string | null,
): SellerKycStatus {
  const raw = apiStatus ?? sellerProfileStatus ?? 'NOT_SUBMITTED';
  let status = String(raw).toUpperCase() as SellerKycStatus;

  if (status === 'NOT_SUBMITTED' && hasSubmittedKyc(kyc)) {
    status = 'PENDING';
  }

  if (!VALID_STATUSES.includes(status)) {
    return 'NOT_SUBMITTED';
  }

  return status;
}
