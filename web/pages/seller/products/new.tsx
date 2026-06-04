import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { ProductWizardForm } from '../../../components/seller/product/ProductWizardForm';
import { sellerGet } from '../../../lib/seller/http';
import { resolveSellerKycStatus } from '../../../lib/seller/kyc-status';

/**
 * Single KYC gate for product creation. This covers EVERY "Add Product" entry point
 * (dashboard FAB, toolbar, cards, mobile quick-action) in one place: a non-approved
 * seller is redirected to the KYC tab instead of filling a form that would 403 on
 * submit. Fails open to the form on error — the backend still guards submission.
 */
export default function AddProductPage() {
  const router = useRouter();
  const [state, setState] = useState<'checking' | 'allowed' | 'blocked'>('checking');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const kyc = await sellerGet<{
          status?: string;
          kyc?: Parameters<typeof resolveSellerKycStatus>[1];
        }>('/sellers/kyc');
        if (cancelled) return;
        const status = kyc ? resolveSellerKycStatus(kyc.status, kyc.kyc) : null;
        if (status === 'APPROVED') {
          setState('allowed');
        } else {
          setState('blocked');
          toast.error('Complete KYC verification before adding products.');
          router.replace('/seller/settings?tab=kyc');
        }
      } catch {
        if (!cancelled) setState('allowed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (state !== 'allowed') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#ff6600]/30 border-t-[#ff6600]" />
      </div>
    );
  }

  return <ProductWizardForm variant="create" />;
}
