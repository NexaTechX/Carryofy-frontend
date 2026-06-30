import Image from 'next/image';
import type { AdminSeller } from '../../lib/admin/types';

/** Human-readable labels for the onboarding enums collected by the seller wizard. */
const LABELS: Record<string, string> = {
  B2C_ONLY: 'Retail', B2B_ONLY: 'Wholesale', B2C_AND_B2B: 'Retail & wholesale',
  SOLE_PROPRIETORSHIP: 'Sole proprietorship', PARTNERSHIP: 'Partnership',
  LIMITED_LIABILITY: 'Limited liability', ENTERPRISE: 'Enterprise',
  FIXED_ADDRESS: 'Fixed address', MARKET_STALL: 'Market stall',
  MULTIPLE_LOCATIONS: 'Multiple locations', MOBILE: 'Mobile / no fixed base',
  UNDER_100K: 'Under ₦100k', FROM_100K_TO_500K: '₦100k – ₦500k',
  FROM_500K_TO_2M: '₦500k – ₦2M', ABOVE_2M: '₦2M+',
  HOME: 'Home', PERSONAL_STORE: 'Personal store', RENTED_WAREHOUSE: 'Rented warehouse',
  MANUFACTURER: 'Manufacturer', DISTRIBUTOR: 'Distributor', WHOLESALER: 'Wholesaler',
  IMPORTER: 'Importer', TRADE_FAIR: 'Trade fair / Alaba', OTHER: 'Other',
  PERSONAL: 'Personal', BUSINESS: 'Business',
};
const label = (v?: string | null) => (v ? LABELS[v] ?? v : null);
const naira = (kobo?: number | null) =>
  kobo != null ? `₦${(kobo / 100).toLocaleString('en-NG')}` : null;
const yesNo = (v?: boolean | null) => (v == null ? null : v ? 'Yes' : 'No');

function Field({ label: l, value }: { label: string; value?: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 mb-1">{l}</p>
      <p className="text-white break-words">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-3">{title}</p>
      <div className="grid grid-cols-2 gap-4 text-sm">{children}</div>
    </div>
  );
}

function Gallery({ title, urls }: { title: string; urls?: string[] }) {
  if (!urls || urls.length === 0) return null;
  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-3">
        {title} · {urls.length}
      </p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {urls.map((u, i) => (
          <a
            key={i}
            href={u}
            target="_blank"
            rel="noopener noreferrer"
            className="relative aspect-square overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#0f1419] transition hover:border-primary"
            title="Open full image"
          >
            <Image src={u} alt={`${title} ${i + 1}`} fill unoptimized className="object-cover" />
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * Renders the full set of onboarding data the seller submitted — business profile,
 * operating location, stock & supply, bank account, and product/store photos —
 * so an admin can review everything in one place before approving KYC.
 */
export default function SellerOnboardingDetails({ seller }: { seller: AdminSeller }) {
  const schedule = seller.operatingSchedule;
  const hours =
    schedule?.open && schedule?.close
      ? `${(schedule.days?.length ? schedule.days.join(', ') : 'Mon–Sat')} · ${schedule.open}–${schedule.close}`
      : null;
  const coords =
    seller.latitude != null && seller.longitude != null
      ? `${Number(seller.latitude).toFixed(5)}, ${Number(seller.longitude).toFixed(5)}`
      : null;

  return (
    <>
      <Section title="Business profile">
        <Field label="Primary category" value={seller.primaryCategory?.name} />
        <Field label="Sells" value={label(seller.sellingMode)} />
        <Field label="Legal entity" value={label(seller.legalEntityType)} />
        <Field label="Years in business" value={seller.yearsInOperation != null ? `${seller.yearsInOperation}` : null} />
        <Field label="WhatsApp" value={seller.whatsappNumber} />
        <Field
          label="Additional categories"
          value={seller.additionalCategoryIds?.length ? `${seller.additionalCategoryIds.length} selected` : null}
        />
        <div className="col-span-2">
          <Field label="Description" value={seller.businessDescription} />
        </div>
      </Section>

      <Section title="Operating location">
        <Field label="Operates from" value={label(seller.businessOperatesFrom)} />
        <Field label="Market name" value={seller.marketName} />
        <Field label="Stall number" value={seller.stallNumber} />
        <Field label="State" value={seller.state} />
        <Field label="LGA / Area" value={seller.lga} />
        <Field label="Nearest landmark" value={seller.nearestLandmark} />
        <Field label="Coordinates" value={coords ? <span className="font-mono text-xs">{coords}</span> : null} />
        <Field label="Operating hours" value={hours} />
        <div className="col-span-2">
          <Field label="Pickup address" value={seller.businessAddress} />
        </div>
        <div className="col-span-2">
          <Field label="Pickup instructions" value={seller.pickupInstructions} />
        </div>
      </Section>

      <Section title="Stock & supply">
        <Field label="Has physical stock" value={yesNo(seller.hasPhysicalStock)} />
        <Field label="Inventory value" value={label(seller.estimatedInventoryValue)} />
        <Field label="Stock held at" value={label(seller.stockLocation)} />
        <Field label="Fulfillment / sourcing" value={label(seller.sourcingType)} />
        <Field label="Minimum order value" value={naira(seller.minimumOrderValueKobo)} />
        <Field label="Same-day fulfillment" value={yesNo(seller.offersSameDayFulfillment)} />
      </Section>

      <Gallery title="Product photos" urls={seller.productPhotoUrls} />
      <Gallery title="Store / stall photos" urls={seller.storePhotoUrls} />

      {seller.bankAccount && (
        <Section title="Bank account (payouts)">
          <Field label="Bank" value={seller.bankAccount.bankName} />
          <Field label="Account number" value={<span className="font-mono">{seller.bankAccount.accountNumber}</span>} />
          <Field label="Account name" value={seller.bankAccount.accountName} />
          <Field label="Account type" value={label(seller.bankAccount.accountType)} />
        </Section>
      )}
    </>
  );
}
