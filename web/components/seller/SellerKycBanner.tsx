import Link from 'next/link';
import { ShieldCheck, Clock, ShieldX } from 'lucide-react';
import { kycRejectionReasonLabel } from '../../lib/kyc/rejection-reasons';
import {
  KYC_ONBOARDING_HREF,
  KYC_REVIEW_ETA,
  kycStatusCtaLabel,
} from '../../lib/seller/kyc-copy';

/**
 * Always-visible KYC state banner for the seller dashboard. Makes the "you must be
 * verified to sell" rule explicit (previously it was only implied by a disabled FAB).
 */
export default function SellerKycBanner({
  status,
  rejectionReason,
  rejectionReasonCode,
}: {
  status: string | null;
  rejectionReason?: string | null;
  rejectionReasonCode?: string | null;
}) {
  if (!status || status === 'APPROVED') return null;

  const kycHref = KYC_ONBOARDING_HREF;

  if (status === 'PENDING') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-300">Verification under review</p>
          <p className="mt-0.5 text-xs text-amber-200/80">
            We&apos;re reviewing your KYC. You can list products and receive payouts once approved
            — {KYC_REVIEW_ETA}.
          </p>
          <Link
            href={kycHref}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-black transition hover:bg-amber-400"
          >
            {kycStatusCtaLabel('PENDING')}
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'REJECTED') {
    const reasonLabel = kycRejectionReasonLabel(rejectionReasonCode);
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
        <ShieldX className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-300">Verification rejected</p>
          {reasonLabel && reasonLabel !== 'Other' && (
            <span className="mt-1.5 inline-flex rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-300">
              {reasonLabel}
            </span>
          )}
          {rejectionReason ? (
            <p className="mt-1.5 text-xs text-red-200/80">{rejectionReason}</p>
          ) : (
            <p className="mt-0.5 text-xs text-red-200/80">
              Your KYC was not approved. Review the reason, fix the details and resubmit.
            </p>
          )}
          <Link
            href={kycHref}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-600"
          >
            {kycStatusCtaLabel('REJECTED')}
          </Link>
        </div>
      </div>
    );
  }

  // NOT_SUBMITTED / EXPIRED / unknown → prompt to verify.
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#ff6600]/40 bg-[#ff6600]/10 p-4">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#ff6600]" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">Verify your identity to start selling</p>
        <p className="mt-0.5 text-xs text-[#ffcc99]/80">
          Complete KYC verification to list products and receive payouts. It only takes a few minutes.
        </p>
        <Link
          href={kycHref}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#ff6600] px-3 py-1.5 text-xs font-bold text-black transition hover:bg-[#cc5200]"
        >
          {kycStatusCtaLabel('NOT_SUBMITTED')}
        </Link>
      </div>
    </div>
  );
}
