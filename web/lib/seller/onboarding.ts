export interface SellerMeProfile {
  id?: string;
  businessName?: string;
  logo?: string | null;
  businessAddress?: string | null;
  pickupAddress?: string | null;
  pickupInstructions?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  sellingMode?: string | null;
  needsProfileOnboarding?: boolean;
  onboardingCompletedAt?: string | null;
  kycStatus?: string;
}

/** Unwrap API envelope `{ data: T }` or raw T. */
export function unwrapSellerMePayload(raw: unknown): SellerMeProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const inner = obj.data ?? raw;
  if (!inner || typeof inner !== 'object') return null;
  return inner as SellerMeProfile;
}

export function sellerNeedsProfileOnboardingFromProfile(
  profile: SellerMeProfile | null | undefined,
): boolean {
  if (!profile) return true;
  if (typeof profile.needsProfileOnboarding === 'boolean') {
    return profile.needsProfileOnboarding;
  }
  if (!profile.businessAddress?.trim()) return true;
  if (profile.latitude == null || profile.longitude == null) return true;
  if (!profile.sellingMode) return true;
  return false;
}
