import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useAuth, tokenManager } from '../lib/auth';
import SEO from '../components/seo/SEO';

const AIOnboardingWizard = dynamic(() => import('../components/ai-onboarding/AIOnboardingWizard'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  ),
});

export default function AIOnboardingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [sellerCheckDone, setSellerCheckDone] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.push('/auth/login?redirect=/ai-onboarding');
      return;
    }
    // Sellers use seller onboarding at /seller/onboard; keep them in seller experience
    if (user.role === 'SELLER' && router.query.edit !== 'true') {
      router.replace('/seller');
      return;
    }
    // If user has a seller profile (even if role is BUYER), send them to seller dashboard so they don't get buyer onboarding
    const checkSellerProfile = async () => {
      try {
        const token = tokenManager.getAccessToken();
        const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
        const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;
        const res = await fetch(`${apiUrl}/sellers/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          router.replace('/seller');
          return;
        }
      } catch {
        // ignore
      }
      setSellerCheckDone(true);
    };
    checkSellerProfile();
  }, [router, authLoading, isAuthenticated, user]);

  if (authLoading || !isAuthenticated || (!sellerCheckDone && user?.role !== 'SELLER')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If we're still here and user is SELLER, don't render wizard (redirect runs above)
  if (user?.role === 'SELLER') return null;

  return (
    <>
      <SEO
        title="Welcome to Carryofy — Personalize Your B2B Experience"
        description="Welcome to smarter B2B trade in Lagos. Set your preferences and goals so Carryofy can tailor sourcing, categories, and recommendations to your retail business."
        canonical="https://carryofy.com/ai-onboarding"
      />
      <Head>
        <title>AI Onboarding - Carryofy</title>
      </Head>
      <AIOnboardingWizard />
    </>
  );
}

