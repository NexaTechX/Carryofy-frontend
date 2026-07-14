import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { ProductWizardForm } from '../../../components/seller/product/ProductWizardForm';
import { sellerGet } from '../../../lib/seller/http';
import { resolveSellerKycStatus } from '../../../lib/seller/kyc-status';
import { KYC_ONBOARDING_HREF, kycAddProductBlockedReason } from '../../../lib/seller/kyc-copy';

/**
 * Single KYC gate for product creation. Non-approved sellers never land in the form —
 * they go to onboarding/status with a clear reason. Fails closed on fetch error.
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
          toast.error(kycAddProductBlockedReason(status) || 'Complete verification before adding products.');
          router.replace(KYC_ONBOARDING_HREF);
        }
      } catch {
        if (!cancelled) {
          setState('blocked');
          toast.error('Could not verify your seller status. Try again in a moment.');
          router.replace('/seller');
        }
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
