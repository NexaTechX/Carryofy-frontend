import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useAuth } from '../lib/auth';
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

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.push('/auth/login?redirect=/ai-onboarding');
      return;
    }
  }, [router, authLoading, isAuthenticated, user]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="AI Onboarding - Personalize Your Experience | Carryofy"
        description="Set up your AI preferences to get personalized assistance. Choose your goals, use cases, tone, and more to tailor your Carryofy experience."
        canonical="https://carryofy.com/ai-onboarding"
      />
      <Head>
        <title>AI Onboarding - Carryofy</title>
      </Head>
      <AIOnboardingWizard />
    </>
  );
}

