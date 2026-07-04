/**
 * KYC rejection reason codes shared by the admin review UI and the seller-facing
 * status views. Must stay in sync with the backend `KycRejectionReasonCode` enum
 * (CB/apps/api/prisma/schema.prisma).
 */
export type KycRejectionReasonCode =
  | 'ID_DOCUMENT_UNCLEAR'
  | 'ID_DOCUMENT_MISMATCH'
  | 'MISSING_DOCUMENTS'
  | 'EXPIRED_OR_INVALID_DOCUMENTS'
  | 'BUSINESS_REGISTRATION_INVALID'
  | 'TAX_ID_INVALID'
  | 'ADDRESS_PROOF_INVALID'
  | 'BVN_VERIFICATION_FAILED'
  | 'DUPLICATE_ID_NUMBER'
  | 'SUSPECTED_FRAUD'
  | 'INCOMPLETE_APPLICATION'
  | 'OTHER';

export const KYC_REJECTION_REASONS: Array<{
  code: KycRejectionReasonCode;
  label: string;
}> = [
  { code: 'ID_DOCUMENT_UNCLEAR', label: 'ID document is unclear or unreadable' },
  { code: 'ID_DOCUMENT_MISMATCH', label: 'ID document does not match provided information' },
  { code: 'MISSING_DOCUMENTS', label: 'Missing required documents' },
  { code: 'EXPIRED_OR_INVALID_DOCUMENTS', label: 'Documents are expired or invalid' },
  { code: 'BUSINESS_REGISTRATION_INVALID', label: 'Business registration documents are missing or invalid' },
  { code: 'TAX_ID_INVALID', label: 'Tax ID is missing or invalid' },
  { code: 'ADDRESS_PROOF_INVALID', label: 'Address proof is missing or invalid' },
  { code: 'BVN_VERIFICATION_FAILED', label: 'BVN verification failed' },
  { code: 'DUPLICATE_ID_NUMBER', label: 'Duplicate ID number detected' },
  { code: 'SUSPECTED_FRAUD', label: 'Suspicious or fraudulent information' },
  { code: 'INCOMPLETE_APPLICATION', label: 'Incomplete application' },
  { code: 'OTHER', label: 'Other (specify below)' },
];

/** Human-readable label for a rejection reason code; falls back to the raw code. */
export function kycRejectionReasonLabel(code?: string | null): string | null {
  if (!code) return null;
  const match = KYC_REJECTION_REASONS.find((r) => r.code === code);
  if (match) return match.code === 'OTHER' ? 'Other' : match.label;
  return code;
}
