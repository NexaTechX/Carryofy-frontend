import { useState, useEffect } from 'react';
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

function Step7Interests({ preferences, updatePreferences }: StepProps) {
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

function Step8Consent({ preferences, updatePreferences, onComplete, isLoading }: StepProps) {
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
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="font-semibold">Categories:</span>
            <span>{preferences.favoriteCategories?.length || 0} selected</span>
          </div>
          {preferences.budgetRange && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="font-semibold">Budget:</span>
              <span className="capitalize">{BUDGET_OPTIONS.find(b => b.id === preferences.budgetRange)?.label}</span>
            </div>
          )}
          {preferences.deliveryPreference && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="font-semibold">Delivery:</span>
              <span>{DELIVERY_OPTIONS.find(d => d.id === preferences.deliveryPreference)?.label}</span>
            </div>
          )}
          {preferences.shoppingFrequency && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="font-semibold">Frequency:</span>
              <span className="capitalize">{preferences.shoppingFrequency}</span>
            </div>
          )}
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
  const [preferences, setPreferences] = useState<Partial<AIOnboardingPreferences>>({});
  const totalSteps = 8;

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const data = await aiOnboardingApi.getPreferences();
      if (data) {
        setPreferences(data);
        // If already completed, redirect
        if (data.completedAt) {
          router.push('/buyer');
        }
      }
    } catch (error: any) {
      console.error('Failed to load preferences:', error);
    }
  };

  const updatePreferences = (data: Partial<UpdateAIOnboardingDto>) => {
    setPreferences((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
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

      console.log('Sending onboarding data:', dataToSend);
      await aiOnboardingApi.updatePreferences(dataToSend);
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
        return <Step7Interests {...stepProps} />;
      case 8:
        return <Step8Consent {...stepProps} />;
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
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
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
          {renderStep()}
        </div>

        {/* Navigation */}
        {currentStep < totalSteps && (
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Previous
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary-dark transition flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
