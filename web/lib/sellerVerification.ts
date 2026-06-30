/**
 * Single source of truth for the "Verified" supplier badge.
 *
 * A seller is shown as verified ONLY when their KYC has been approved by the
 * platform (`kycStatus === 'APPROVED'`). Never default to verified: an absent,
 * null, or unknown status must NOT render the badge. Defaulting to true (the
 * previous `isVerified !== false` / `?? true` pattern) stamped "Verified" on
 * every supplier — including unvetted ones — which is a trust/fraud liability
 * on a platform whose core promise is verified suppliers.
 */
export function isSellerVerified(
  seller?: { kycStatus?: string | null } | null,
): boolean {
  return seller?.kycStatus === "APPROVED";
}
