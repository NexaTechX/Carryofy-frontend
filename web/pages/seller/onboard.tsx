import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * The standalone profile-onboarding + separate KYC flow has been unified into
 * /seller/onboarding. This route is kept only to redirect old links/bookmarks.
 */
export default function SellerOnboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/seller/onboarding');
  }, [router]);
  return null;
}
