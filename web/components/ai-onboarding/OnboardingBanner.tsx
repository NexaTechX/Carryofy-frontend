import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Sparkles, X } from 'lucide-react';
import { aiOnboardingApi } from '../../lib/api/ai-onboarding';

export default function OnboardingBanner() {
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Don't show banner on the onboarding page itself
    if (router.pathname === '/ai-onboarding') {
      setIsLoading(false);
      return;
    }

    checkOnboardingStatus();
  }, [router.pathname]);

  const checkOnboardingStatus = async () => {
    try {
      const preferences = await aiOnboardingApi.getPreferences();
      // Show banner if preferences don't exist or onboarding isn't completed
      setShowBanner(!preferences || !preferences.completedAt);
    } catch (error: any) {
      // Silently handle errors - don't show banner if API fails
      // This prevents the banner from showing if the endpoint doesn't exist or has issues
      if (
        error?.response?.status === 404 || 
        error?.response?.status === 500 ||
        error?.code === 'ERR_NETWORK' ||
        error?.code === 'ECONNREFUSED' ||
        error?.message === 'Network Error'
      ) {
        // If endpoint doesn't exist, has server error, or network error, don't show banner
        setShowBanner(false);
      } else {
        console.error('Failed to check onboarding status:', error);
        setShowBanner(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !showBanner) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-primary/20 to-primary/10 border-b border-primary/30">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                Personalize your AI experience
              </p>
              <p className="text-xs text-gray-600">
                Complete a quick setup to get personalized AI assistance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/ai-onboarding"
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition whitespace-nowrap"
            >
              Get Started
            </Link>
            <button
              onClick={() => setShowBanner(false)}
              className="p-2 text-gray-500 hover:text-gray-700 transition"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

