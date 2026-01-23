import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { useAuth } from '../../lib/auth';
import { aiOnboardingApi, AIOnboardingPreferences } from '../../lib/api/ai-onboarding';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function PreferencesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [preferences, setPreferences] = useState<AIOnboardingPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/auth/login?redirect=/buyer/preferences');
      return;
    }

    if (mounted && isAuthenticated) {
      loadPreferences();
    }
  }, [mounted, isAuthenticated, router]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await aiOnboardingApi.getPreferences();
      setPreferences(data);
    } catch (error: any) {
      console.error('Failed to load preferences:', error);
      toast.error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push('/ai-onboarding?edit=true');
  };

  if (!mounted || loading) {
    return (
      <BuyerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </BuyerLayout>
    );
  }

  if (!preferences) {
    return (
      <BuyerLayout>
        <Head>
          <title>AI Preferences - Buyer | Carryofy</title>
        </Head>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Preferences Set</h2>
            <p className="text-gray-600 mb-6">
              Complete the onboarding to personalize your shopping experience
            </p>
            <Link
              href="/ai-onboarding"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary-dark transition"
            >
              Start Onboarding
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </BuyerLayout>
    );
  }

  return (
    <>
      <Head>
        <title>AI Preferences - Buyer | Carryofy</title>
        <meta name="description" content="Manage your AI shopping preferences and personalization settings." />
      </Head>
      <BuyerLayout>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-[#ff6600]" />
              AI Shopping Preferences
            </h1>
            <p className="text-[#ffcc99] text-lg">
              Manage your personalized shopping preferences to get better recommendations
            </p>
          </div>

          {/* Preferences Display */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-6">
            <div className="space-y-6">
              {/* Categories */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Favorite Categories</h3>
                {preferences.favoriteCategories && preferences.favoriteCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {preferences.favoriteCategories.map((category) => (
                      <span
                        key={category}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm capitalize"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No categories selected</p>
                )}
              </div>

              {/* Budget Range */}
              {preferences.budgetRange && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Budget Range</h3>
                  <p className="text-gray-700 capitalize">{preferences.budgetRange}</p>
                </div>
              )}

              {/* Delivery Preference */}
              {preferences.deliveryPreference && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Delivery Preference</h3>
                  <p className="text-gray-700 capitalize">{preferences.deliveryPreference.replace('-', ' ')}</p>
                </div>
              )}

              {/* Shopping Frequency */}
              {preferences.shoppingFrequency && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Shopping Frequency</h3>
                  <p className="text-gray-700 capitalize">{preferences.shoppingFrequency}</p>
                </div>
              )}

              {/* Price Sensitivity */}
              {preferences.priceSensitivity && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Price Sensitivity</h3>
                  <p className="text-gray-700 capitalize">{preferences.priceSensitivity.replace('-', ' ')}</p>
                </div>
              )}

              {/* Notification Preference */}
              {preferences.notificationPreference && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Notification Preference</h3>
                  <p className="text-gray-700 capitalize">{preferences.notificationPreference.replace('-', ' ')}</p>
                </div>
              )}

              {/* Preferred Brands */}
              {preferences.preferredBrands && preferences.preferredBrands.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Preferred Brands</h3>
                  <div className="flex flex-wrap gap-2">
                    {preferences.preferredBrands.map((brand) => (
                      <span
                        key={brand}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Interests */}
              {preferences.specialInterests && preferences.specialInterests.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Special Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {preferences.specialInterests.map((interest) => (
                      <span
                        key={interest}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm capitalize"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Completion Status */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  {preferences.completedAt
                    ? `Completed on ${new Date(preferences.completedAt).toLocaleDateString()}`
                    : 'Draft - not yet completed'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <button
              onClick={handleEdit}
              className="px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary-dark transition flex items-center gap-2"
            >
              Edit Preferences
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </BuyerLayout>
    </>
  );
}
