import Link from 'next/link';
import { Check, Clock, Package, Rocket, ShieldCheck } from 'lucide-react';
import {
  KYC_ONBOARDING_HREF,
  KYC_REVIEW_ETA,
  kycAddProductBlockedReason,
  kycStatusCtaLabel,
} from '../../lib/seller/kyc-copy';

type PathStep = {
  key: string;
  label: string;
  detail: string;
  done: boolean;
  current: boolean;
};

/**
 * Single progress strip: Verified → Add product → Under review → Live.
 * Shown on the seller dashboard until the seller has an ACTIVE listing.
 */
export default function SellerPathToSaleChecklist({
  kycStatus,
  productCount = 0,
  hasActiveProduct = false,
  hasPendingProduct = false,
}: {
  kycStatus: string | null;
  productCount?: number;
  hasActiveProduct?: boolean;
  hasPendingProduct?: boolean;
}) {
  const status = String(kycStatus || 'NOT_SUBMITTED').toUpperCase();
  const verified = status === 'APPROVED';
  const waitingKyc = status === 'PENDING';
  const needsKyc = !verified && !waitingKyc;

  if (hasActiveProduct && verified) return null;

  const steps: PathStep[] = [
    {
      key: 'verify',
      label: 'Get verified',
      detail: waitingKyc
        ? `Under review — ${KYC_REVIEW_ETA}`
        : verified
          ? 'Identity approved'
          : 'Business details, ID & bank',
      done: verified,
      current: needsKyc || waitingKyc,
    },
    {
      key: 'list',
      label: 'Add first product',
      detail: verified
        ? productCount > 0
          ? `${productCount} listed`
          : 'Photo, title, price, stock'
        : 'Unlocks after verification',
      done: verified && productCount > 0,
      current: verified && productCount === 0 && !hasPendingProduct,
    },
    {
      key: 'review',
      label: 'Product under review',
      detail: hasPendingProduct
        ? 'Our team checks your listing'
        : 'Submitted products are reviewed before going live',
      done: hasActiveProduct,
      current: hasPendingProduct && !hasActiveProduct,
    },
    {
      key: 'live',
      label: 'Live & selling',
      detail: 'Buyers can order from your store',
      done: hasActiveProduct,
      current: false,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  let primaryHref = KYC_ONBOARDING_HREF;
  let primaryLabel = kycStatusCtaLabel(status);
  if (verified && productCount === 0) {
    primaryHref = '/seller/products/new';
    primaryLabel = 'Add first product';
  } else if (verified && hasPendingProduct) {
    primaryHref = '/seller/products';
    primaryLabel = 'View products';
  } else if (verified) {
    primaryHref = '/seller/products/new';
    primaryLabel = 'Add another product';
  }

  const blockedHint =
    !verified && status !== 'APPROVED'
      ? kycAddProductBlockedReason(status)
      : null;

  return (
    <div className="surface-card flex flex-col gap-4 border-l-2 border-l-primary p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-foreground">Your path to first sale</p>
          <p className="mt-1 text-xs text-foreground/55">
            {pct}% complete · {doneCount} of {steps.length} steps
          </p>
        </div>
        <Rocket className="h-8 w-8 shrink-0 text-primary/40" aria-hidden />
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.max(pct, 6)}%` }}
        />
      </div>

      <ol className="flex flex-col gap-2.5">
        {steps.map((s) => (
          <li key={s.key} className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                s.done
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : s.current
                    ? 'bg-primary/20 text-primary'
                    : 'bg-white/5 text-foreground/35'
              }`}
            >
              {s.done ? (
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              ) : s.key === 'verify' && waitingKyc ? (
                <Clock className="h-3.5 w-3.5" />
              ) : s.key === 'verify' ? (
                <ShieldCheck className="h-3.5 w-3.5" />
              ) : (
                <Package className="h-3.5 w-3.5" />
              )}
            </span>
            <div className="min-w-0">
              <p
                className={`text-xs font-semibold ${
                  s.done || s.current ? 'text-foreground' : 'text-foreground/45'
                }`}
              >
                {s.label}
              </p>
              <p className="text-[11px] text-foreground/50">{s.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      {blockedHint && (
        <p className="text-[11px] leading-relaxed text-foreground/55">{blockedHint}</p>
      )}

      <Link
        href={primaryHref}
        className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-black transition hover:bg-primary/90"
      >
        {primaryLabel}
      </Link>
    </div>
  );
}
