import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { 
  Sparkles, 
  ShoppingBag, 
  Wallet, 
  Truck, 
  Calendar,
  DollarSign,
  Bell,
  Tag,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Heart
} from 'lucide-react';
import { aiOnboardingApi, AIOnboardingPreferences, UpdateAIOnboardingDto } from '../../lib/api/ai-onboarding';
import { useCategories } from '../../lib/buyer/hooks/useCategories';
import BrandSelector from './BrandSelector';

interface StepProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  preferences: Partial<AIOnboardingPreferences>;
  updatePreferences: (data: Partial<UpdateAIOnboardingDto>) => void;
  isLoading: boolean;
}

const BUDGET_OPTIONS = [
  { id: 'low', label: 'Under ₦10,000', description: 'Budget-friendly shopping' },
  { id: 'medium', label: '₦10,000 - ₦50,000', description: 'Mid-range products' },
  { id: 'high', label: 'Above ₦50,000', description: 'Premium products' },
  { id: 'flexible', label: 'Flexible', description: 'Depends on the product' },
];

const DELIVERY_OPTIONS = [
  { id: 'same-day', label: 'Same-Day Delivery', description: 'Get it today (Lagos only)' },
  { id: 'express', label: 'Express (1-2 days)', description: 'Fast delivery' },
  { id: 'standard', label: 'Standard (3-5 days)', description: 'Regular delivery' },
  { id: 'flexible', label: 'Flexible', description: 'No preference' },
];

const SHOPPING_FREQUENCY_OPTIONS = [
  { id: 'daily', label: 'Daily', description: 'Shop almost every day' },
  { id: 'weekly', label: 'Weekly', description: 'Shop once or twice a week' },
  { id: 'monthly', label: 'Monthly', description: 'Shop a few times a month' },
  { id: 'occasional', label: 'Occasionally', description: 'Shop when needed' },
];

const PRICE_SENSITIVITY_OPTIONS = [
  { id: 'very-price-conscious', label: 'Very Price Conscious', description: 'Always looking for the best deals' },
  { id: 'price-conscious', label: 'Price Conscious', description: 'Compare prices before buying' },
  { id: 'value-focused', label: 'Value Focused', description: 'Quality matters more than price' },
  { id: 'premium-focused', label: 'Premium Focused', description: 'Willing to pay for quality' },
];

const NOTIFICATION_OPTIONS = [
  { id: 'all', label: 'All Notifications', description: 'Deals, new products, and updates' },
  { id: 'deals-only', label: 'Deals Only', description: 'Only special offers and discounts' },
  { id: 'new-products', label: 'New Products', description: 'New arrivals in my categories' },
  { id: 'none', label: 'No Notifications', description: 'I\'ll check manually' },
];

const SPECIAL_INTERESTS = [
  { id: 'organic', label: 'Organic Products', icon: '🌱' },
  { id: 'eco-friendly', label: 'Eco-Friendly', icon: '♻️' },
  { id: 'local', label: 'Local Brands', icon: '🏠' },
  { id: 'premium', label: 'Premium Quality', icon: '⭐' },
  { id: 'budget', label: 'Budget Options', icon: '💰' },
  { id: 'trending', label: 'Trending Items', icon: '🔥' },
];

function Step1Categories({ preferences, updatePreferences }: StepProps) {
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.categories || [];
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    preferences.favoriteCategories || []
  );

  const toggleCategory = (categorySlug: string) => {
    const newCategories = selectedCategories.includes(categorySlug)
      ? selectedCategories.filter(c => c !== categorySlug)
      : [...selectedCategories, categorySlug];
    setSelectedCategories(newCategories);
    updatePreferences({ favoriteCategories: newCategories });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">What do you like to shop for?</h2>
        <p className="text-gray-600">Select your favorite categories</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {categories
          .filter(cat => cat.isActive)
          .map((category) => (
            <button
              key={category.id}
              onClick={() => toggleCategory(category.slug)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedCategories.includes(category.slug)
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-primary/50'
              }`}
            >
              <div className="font-semibold mb-1">{category.name}</div>
              {category.description && (
                <div className="text-xs text-gray-500 line-clamp-2">{category.description}</div>
              )}
            </button>
          ))}
      </div>
      {selectedCategories.length === 0 && (
        <p className="text-center text-sm text-gray-500">Select at least one category</p>
      )}
    </div>
  );
}

function Step2Budget({ preferences, updatePreferences }: StepProps) {
  const [selectedBudget, setSelectedBudget] = useState<string | undefined>(preferences.budgetRange);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">What's your typical budget range?</h2>
        <p className="text-gray-600">This helps us show you relevant products</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {BUDGET_OPTIONS.map((budget) => (
          <button
            key={budget.id}
            onClick={() => {
              setSelectedBudget(budget.id);
              updatePreferences({ budgetRange: budget.id });
            }}
            className={`p-6 rounded-xl border-2 text-left transition-all ${
              selectedBudget === budget.id
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-primary/50'
            }`}
          >
            <div className="font-semibold text-lg mb-2">{budget.label}</div>
            <div className="text-sm text-gray-600">{budget.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step3Delivery({ preferences, updatePreferences }: StepProps) {
  const [selectedDelivery, setSelectedDelivery] = useState<string | undefined>(preferences.deliveryPreference);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Truck className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">How fast do you need delivery?</h2>
        <p className="text-gray-600">Choose your preferred delivery speed</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {DELIVERY_OPTIONS.map((delivery) => (
          <button
            key={delivery.id}
            onClick={() => {
              setSelectedDelivery(delivery.id);
              updatePreferences({ deliveryPreference: delivery.id });
            }}
            className={`p-6 rounded-xl border-2 text-left transition-all ${
              selectedDelivery === delivery.id
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-primary/50'
            }`}
          >
            <div className="font-semibold text-lg mb-2">{delivery.label}</div>
            <div className="text-sm text-gray-600">{delivery.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step4Frequency({ preferences, updatePreferences }: StepProps) {
  const [selectedFrequency, setSelectedFrequency] = useState<string | undefined>(preferences.shoppingFrequency);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">How often do you shop?</h2>
        <p className="text-gray-600">Help us understand your shopping habits</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {SHOPPING_FREQUENCY_OPTIONS.map((frequency) => (
          <button
            key={frequency.id}
            onClick={() => {
              setSelectedFrequency(frequency.id);
              updatePreferences({ shoppingFrequency: frequency.id });
            }}
            className={`p-6 rounded-xl border-2 text-left transition-all ${
              selectedFrequency === frequency.id
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-primary/50'
            }`}
          >
            <div className="font-semibold text-lg mb-2">{frequency.label}</div>
            <div className="text-sm text-gray-600">{frequency.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step5PriceSensitivity({ preferences, updatePreferences }: StepProps) {
  const [selectedSensitivity, setSelectedSensitivity] = useState<string | undefined>(preferences.priceSensitivity);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">How important is price to you?</h2>
        <p className="text-gray-600">This helps us prioritize deals and recommendations</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {PRICE_SENSITIVITY_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => {
              setSelectedSensitivity(option.id);
              updatePreferences({ priceSensitivity: option.id });
            }}
            className={`p-6 rounded-xl border-2 text-left transition-all ${
              selectedSensitivity === option.id
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-primary/50'
            }`}
          >
            <div className="font-semibold text-lg mb-2">{option.label}</div>
            <div className="text-sm text-gray-600">{option.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step6Notifications({ preferences, updatePreferences }: StepProps) {
  const [selectedNotification, setSelectedNotification] = useState<string | undefined>(preferences.notificationPreference);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bell className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">What notifications do you want?</h2>
        <p className="text-gray-600">Stay updated on deals and new products</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {NOTIFICATION_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => {
              setSelectedNotification(option.id);
              updatePreferences({ notificationPreference: option.id });
            }}
            className={`p-6 rounded-xl border-2 text-left transition-all ${
              selectedNotification === option.id
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-primary/50'
            }`}
          >
            <div className="font-semibold text-lg mb-2">{option.label}</div>
            <div className="text-sm text-gray-600">{option.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step7Brands({ preferences, updatePreferences }: StepProps) {
  const [selectedBrands, setSelectedBrands] = useState<string[]>(preferences.preferredBrands || []);

  const handleBrandsChange = (brands: string[]) => {
    setSelectedBrands(brands);
    updatePreferences({ preferredBrands: brands });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Tag className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Any preferred brands?</h2>
        <p className="text-gray-600">Search and select your favorite brands (optional)</p>
      </div>
      <BrandSelector
        selectedBrands={selectedBrands}
        onBrandsChange={handleBrandsChange}
        favoriteCategories={preferences.favoriteCategories}
      />
    </div>
  );
}

function Step8Interests({ preferences, updatePreferences }: StepProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(preferences.specialInterests || []);

  const toggleInterest = (interestId: string) => {
    const newInterests = selectedInterests.includes(interestId)
      ? selectedInterests.filter(i => i !== interestId)
      : [...selectedInterests, interestId];
    setSelectedInterests(newInterests);
    updatePreferences({ specialInterests: newInterests });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Any special interests?</h2>
        <p className="text-gray-600">Select any that apply (optional)</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {SPECIAL_INTERESTS.map((interest) => (
          <button
            key={interest.id}
            onClick={() => toggleInterest(interest.id)}
            className={`p-4 rounded-xl border-2 transition-all ${
              selectedInterests.includes(interest.id)
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-primary/50'
            }`}
          >
            <div className="text-2xl mb-2">{interest.icon}</div>
            <div className="text-sm font-semibold">{interest.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step9Consent({ preferences, updatePreferences, onComplete, isLoading }: StepProps) {
  const [consent, setConsent] = useState(preferences.consent || false);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">You're all set!</h2>
        <p className="text-gray-600">Review and complete your setup</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-6 space-y-4 max-w-2xl mx-auto">
        <h3 className="font-semibold text-lg mb-4">Your Preferences Summary</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className="font-semibold">Categories:</span>
            <span>{preferences.favoriteCategories?.length || 0} selected</span>
          </div>
          {preferences.budgetRange && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="font-semibold">Budget:</span>
              <span>{BUDGET_OPTIONS.find(b => b.id === preferences.budgetRange)?.label}</span>
            </div>
          )}
          {preferences.deliveryPreference && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="font-semibold">Delivery:</span>
              <span>{DELIVERY_OPTIONS.find(d => d.id === preferences.deliveryPreference)?.label}</span>
            </div>
          )}
          {preferences.shoppingFrequency && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="font-semibold">Frequency:</span>
              <span className="capitalize">{preferences.shoppingFrequency}</span>
            </div>
          )}
          {preferences.priceSensitivity && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="font-semibold">Price Sensitivity:</span>
              <span>{PRICE_SENSITIVITY_OPTIONS.find(p => p.id === preferences.priceSensitivity)?.label}</span>
            </div>
          )}
          {preferences.notificationPreference && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="font-semibold">Notifications:</span>
              <span>{NOTIFICATION_OPTIONS.find(n => n.id === preferences.notificationPreference)?.label}</span>
            </div>
          )}
          {preferences.preferredBrands && preferences.preferredBrands.length > 0 && (
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Preferred Brands:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {preferences.preferredBrands.slice(0, 5).map((brand) => (
                    <span key={brand} className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                      {brand}
                    </span>
                  ))}
                  {preferences.preferredBrands.length > 5 && (
                    <span className="text-sm text-gray-500">+{preferences.preferredBrands.length - 5} more</span>
                  )}
                </div>
              </div>
            </div>
          )}
          {preferences.specialInterests && preferences.specialInterests.length > 0 && (
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Special Interests:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {preferences.specialInterests.map((interest) => (
                    <span key={interest} className="px-2 py-1 bg-primary/10 text-primary rounded text-sm capitalize">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>How this helps you:</strong> We'll use these preferences to personalize product recommendations, 
            show you relevant deals, and tailor your shopping experience to match your style and budget.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg max-w-2xl mx-auto">
        <input
          type="checkbox"
          id="consent"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            updatePreferences({ consent: e.target.checked });
          }}
          className="mt-1 w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
        />
        <label htmlFor="consent" className="text-sm text-gray-700 cursor-pointer">
          I consent to AI-powered personalized shopping recommendations based on my preferences.
        </label>
      </div>
      <div className="flex justify-center">
        <button
          onClick={onComplete}
          disabled={!consent || isLoading}
          className="px-8 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Complete Setup
              <CheckCircle2 className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function AIOnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<Partial<AIOnboardingPreferences>>({});
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const totalSteps = 9;
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isEditMode = router.query.edit === 'true';

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Try to sync saved data when coming back online
      if (retryCount > 0) {
        const saved = localStorage.getItem('ai-onboarding-draft');
        if (saved) {
          try {
            const draft = JSON.parse(saved);
            debouncedAutoSave(draft, draft.lastStepCompleted || currentStep);
          } catch (e) {
            console.error('Failed to sync on reconnect:', e);
          }
        }
      }
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [retryCount, currentStep]);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const data = await aiOnboardingApi.getPreferences();
      if (data) {
        setPreferences(data);
        // If already completed and not in edit mode, redirect
        if (data.completedAt && !isEditMode) {
          router.push('/buyer');
          return;
        }
        // Resume from last step if draft exists
        if (data.isDraft && data.lastStepCompleted) {
          setCurrentStep(Math.min(data.lastStepCompleted + 1, totalSteps));
        }
      }
    } catch (error: any) {
      console.error('Failed to load preferences:', error);
      // Try to load from localStorage as fallback
      try {
        const saved = localStorage.getItem('ai-onboarding-draft');
        if (saved) {
          const draft = JSON.parse(saved);
          setPreferences(draft);
          if (draft.lastStepCompleted) {
            setCurrentStep(Math.min(draft.lastStepCompleted + 1, totalSteps));
          }
        }
      } catch (e) {
        console.error('Failed to load from localStorage:', e);
      }
    }
  };

  const updatePreferences = (data: Partial<UpdateAIOnboardingDto>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...data };
      // Auto-save draft after a delay
      debouncedAutoSave(updated, currentStep);
      return updated;
    });
  };

  const debouncedAutoSave = async (prefs: Partial<AIOnboardingPreferences>, step: number, retry = 0): Promise<void> => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        setSaveError(null);
        const dataToSave: UpdateAIOnboardingDto = {
          favoriteCategories: Array.isArray(prefs.favoriteCategories) ? prefs.favoriteCategories : [],
          preferredBrands: Array.isArray(prefs.preferredBrands) ? prefs.preferredBrands : [],
          specialInterests: Array.isArray(prefs.specialInterests) ? prefs.specialInterests : [],
          budgetRange: prefs.budgetRange,
          deliveryPreference: prefs.deliveryPreference,
          shoppingFrequency: prefs.shoppingFrequency,
          priceSensitivity: prefs.priceSensitivity,
          notificationPreference: prefs.notificationPreference,
          lastStepCompleted: step,
          isDraft: true,
        };

        // Always save to localStorage first as backup
        try {
          localStorage.setItem('ai-onboarding-draft', JSON.stringify({
            ...prefs,
            lastStepCompleted: step,
          }));
        } catch (e) {
          console.error('Failed to save to localStorage:', e);
        }

        // Try to save to API
        if (!isOffline) {
          try {
            await aiOnboardingApi.saveDraft(dataToSave);
            setRetryCount(0);
          } catch (error: any) {
            // If network error and retries left, retry
            if (
              (error?.code === 'ERR_NETWORK' || 
               error?.code === 'ECONNREFUSED' || 
               error?.message === 'Network Error') &&
              retry < 3
            ) {
              console.warn(`Auto-save failed, retrying (${retry + 1}/3)...`);
              setRetryCount(retry + 1);
              // Retry after exponential backoff
              setTimeout(() => {
                debouncedAutoSave(prefs, step, retry + 1);
              }, Math.pow(2, retry) * 1000);
              return;
            } else {
              throw error;
            }
          }
        }
      } catch (error: any) {
        console.error('Auto-save failed:', error);
        const errorMessage = error?.response?.data?.message || 
                            error?.message || 
                            'Failed to save. Your progress is saved locally.';
        setSaveError(errorMessage);
        setRetryCount(retry);
      } finally {
        setIsSaving(false);
      }
    }, 1000); // 1 second debounce
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<number, string> = {};
    
    switch (step) {
      case 1:
        if (!preferences.favoriteCategories || preferences.favoriteCategories.length === 0) {
          errors[1] = 'Please select at least one category';
          setValidationErrors(errors);
          return false;
        }
        break;
      case 2:
        if (!preferences.budgetRange) {
          errors[2] = 'Please select a budget range';
          setValidationErrors(errors);
          return false;
        }
        break;
      case 3:
        if (!preferences.deliveryPreference) {
          errors[3] = 'Please select a delivery preference';
          setValidationErrors(errors);
          return false;
        }
        break;
      case 4:
        if (!preferences.shoppingFrequency) {
          errors[4] = 'Please select shopping frequency';
          setValidationErrors(errors);
          return false;
        }
        break;
      case 5:
        if (!preferences.priceSensitivity) {
          errors[5] = 'Please select price sensitivity';
          setValidationErrors(errors);
          return false;
        }
        break;
      case 6:
        if (!preferences.notificationPreference) {
          errors[6] = 'Please select notification preference';
          setValidationErrors(errors);
          return false;
        }
        break;
      case 7:
      case 8:
        // Optional steps - no validation needed
        break;
      case 9:
        if (!preferences.consent) {
          errors[9] = 'Please provide consent to continue';
          setValidationErrors(errors);
          return false;
        }
        break;
    }

    setValidationErrors({});
    return true;
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    // Skip optional steps (7 and 8) by moving to next step
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Clear validation errors when going back
      setValidationErrors({});
    }
  };

  const handleComplete = async () => {
    if (!validateStep(9)) {
      return;
    }

    setIsLoading(true);
    try {
      // Build data object with only DTO fields - no extra properties
      const dataToSend: UpdateAIOnboardingDto = {
        favoriteCategories: Array.isArray(preferences.favoriteCategories) 
          ? preferences.favoriteCategories 
          : [],
        preferredBrands: Array.isArray(preferences.preferredBrands) 
          ? preferences.preferredBrands 
          : [],
        specialInterests: Array.isArray(preferences.specialInterests) 
          ? preferences.specialInterests 
          : [],
        consent: true,
        lastStepCompleted: 9,
        isDraft: false,
      };

      // Only add optional fields if they have valid values
      if (preferences.budgetRange && typeof preferences.budgetRange === 'string') {
        dataToSend.budgetRange = preferences.budgetRange;
      }
      if (preferences.deliveryPreference && typeof preferences.deliveryPreference === 'string') {
        dataToSend.deliveryPreference = preferences.deliveryPreference;
      }
      if (preferences.shoppingFrequency && typeof preferences.shoppingFrequency === 'string') {
        dataToSend.shoppingFrequency = preferences.shoppingFrequency;
      }
      if (preferences.priceSensitivity && typeof preferences.priceSensitivity === 'string') {
        dataToSend.priceSensitivity = preferences.priceSensitivity;
      }
      if (preferences.notificationPreference && typeof preferences.notificationPreference === 'string') {
        dataToSend.notificationPreference = preferences.notificationPreference;
      }

      await aiOnboardingApi.updatePreferences(dataToSend);
      
      // Clear localStorage draft
      try {
        localStorage.removeItem('ai-onboarding-draft');
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }

      toast.success('Shopping preferences saved!');
      router.push('/buyer');
    } catch (error: any) {
      console.error('Failed to save preferences:', error);
      console.error('Error response:', error?.response?.data);
      
      // Extract error message from validation response
      let errorMessage = 'Failed to save preferences';
      if (error?.response?.data) {
        if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join(', ');
        } else if (typeof error.response.data.message === 'string') {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    const stepProps: StepProps = {
      currentStep,
      totalSteps,
      onNext: handleNext,
      onPrevious: handlePrevious,
      onComplete: handleComplete,
      preferences,
      updatePreferences,
      isLoading,
    };

    switch (currentStep) {
      case 1:
        return <Step1Categories {...stepProps} />;
      case 2:
        return <Step2Budget {...stepProps} />;
      case 3:
        return <Step3Delivery {...stepProps} />;
      case 4:
        return <Step4Frequency {...stepProps} />;
      case 5:
        return <Step5PriceSensitivity {...stepProps} />;
      case 6:
        return <Step6Notifications {...stepProps} />;
      case 7:
        return <Step7Brands {...stepProps} />;
      case 8:
        return <Step8Interests {...stepProps} />;
      case 9:
        return <Step9Consent {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full mb-4">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">Personalize Your Shopping</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Tell us about your shopping preferences</h1>
          <p className="text-gray-600">Help us recommend the best products for you</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <div className="flex items-center gap-3">
              {isOffline && (
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  Offline
                </span>
              )}
              {saveError && (
                <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                  Save failed - saved locally
                </span>
              )}
              <span className="text-sm text-gray-500">
                {Math.round((currentStep / totalSteps) * 100)}% Complete
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8">
          {validationErrors[currentStep] && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700">
              {validationErrors[currentStep]}
            </div>
          )}
          {renderStep()}
          {isSaving && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Saving progress...
            </div>
          )}
        </div>

        {/* Navigation */}
        {currentStep < totalSteps && (
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Previous
            </button>
            <div className="flex items-center gap-3">
              {(currentStep === 7 || currentStep === 8) && (
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  Skip
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={isSaving}
                className="px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
