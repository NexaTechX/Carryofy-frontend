import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuth, tokenManager } from '../../lib/auth';
import { refreshAccessTokenBeforeRedirect } from '../../lib/api/client';
import { geocodeString } from '../../lib/api/geocode';
import { Building2, CheckCircle, Phone, AlertTriangle, ArrowLeft, ArrowRight, Store, Package } from 'lucide-react';

/**
 * Normalize phone to international format.
 * Converts Nigerian local format: 0XXXXXXXXXX → +234XXXXXXXXXX
 * Strips spaces, hyphens, parentheses.
 */
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-().]/g, '');
  if (/^0\d{10}$/.test(cleaned)) {
    cleaned = '+234' + cleaned.slice(1);
  }
  return cleaned;
}

function isValidPhone(phone: string): boolean {
  return /^\+[1-9]\d{9,14}$/.test(normalizePhone(phone));
}

const SELLER_BUSINESS_TYPES = [
  { id: 'retail', label: 'Sell to individuals', description: 'Sell directly to individual customers' },
  { id: 'wholesale', label: 'Sell to businesses in bulk', description: 'Sell in bulk to businesses. You can set minimum order quantities and bulk pricing.' },
  { id: 'both', label: 'Both', description: 'Sell to individuals and businesses (retail and wholesale)' },
];

const SELLER_PLANNED_CATEGORIES = [
  'Electronics & Gadgets',
  'Fashion & Apparel',
  'Home & Living',
  'Health & Beauty',
  'Groceries & Food',
  'Sports & Outdoors',
  'Baby & Kids',
  'Books & Stationery',
  'Automotive',
  'Other',
];

export default function SellerOnboardingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [alreadyOnboarded, setAlreadyOnboarded] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState<string>('');
  const [plannedCategories, setPlannedCategories] = useState<string[]>([]);

  // Phone state — shown when user's saved phone is missing/invalid
  const [currentPhone, setCurrentPhone] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [needsPhoneUpdate, setNeedsPhoneUpdate] = useState(false);

  const [businessAddress, setBusinessAddress] = useState('');
  const [pickupInstructions, setPickupInstructions] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');

  const totalSteps = 5;
  const togglePlannedCategory = (cat: string) => {
    setPlannedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle auth checking and onboarding status
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    if (user.role && user.role !== 'SELLER' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    checkOnboardingStatus();
  }, [authLoading, isAuthenticated, user, router]);

  const checkOnboardingStatus = async () => {
    try {
      const token = tokenManager.getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      // Check seller status
      const sellerRes = await fetch(`${apiUrl}/sellers/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (sellerRes.ok) {
        setAlreadyOnboarded(true);
        setTimeout(() => router.push('/seller'), 2000);
        return;
      }

      // Not onboarded — also load user profile to pre-check phone
      const userRes = await fetch(`${apiUrl}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        const phone = userData?.data?.phone || userData?.phone || '';
        setCurrentPhone(phone);

        // If phone is missing or not in valid international format, show phone field
        if (!phone || !isValidPhone(phone)) {
          setNeedsPhoneUpdate(true);
          // Pre-fill with normalized version if it looks like a local number
          if (phone) {
            setPhoneInput(normalizePhone(phone));
          }
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const canProceedFromStep1 = () => {
    if (!businessName.trim()) {
      toast.error('Please enter your business name');
      return false;
    }
    if (needsPhoneUpdate) {
      if (!phoneInput.trim()) {
        toast.error('Phone number is required for seller accounts');
        return false;
      }
      const normalized = normalizePhone(phoneInput.trim());
      if (!isValidPhone(normalized)) {
        toast.error('Please enter a valid phone number (e.g. 08012345678 or +2348012345678)');
        return false;
      }
    }
    return true;
  };

  const canProceedFromStep2 = () => {
    if (!businessAddress.trim()) {
      toast.error('Please enter your business / pickup address');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && !canProceedFromStep1()) return;
    if (step === 2 && !canProceedFromStep2()) return;
    if (step === 3 && !businessType) {
      toast.error('Please select your business type');
      return;
    }
    if (step < totalSteps) setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceedFromStep1()) return;

    setLoading(true);
    try {
      const token = tokenManager.getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      // Step 1: Update phone if needed (before onboarding)
      if (needsPhoneUpdate && phoneInput.trim()) {
        const normalizedPhone = normalizePhone(phoneInput.trim());
        const phoneRes = await fetch(`${apiUrl}/users/me`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ phone: normalizedPhone }),
        });

        if (!phoneRes.ok) {
          const err = await phoneRes.json().catch(() => ({}));
          const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
          toast.error(`Could not save phone number: ${msg || 'Please try again'}`);
          setLoading(false);
          return;
        }
      }

      // Step 2: Onboard seller
      let lat = latitude;
      let lng = longitude;

      if (lat === '' || lng === '') {
        const geoResult = await geocodeString(businessAddress.trim());
        if (geoResult) {
          lat = geoResult.latitude;
          lng = geoResult.longitude;
          setLatitude(lat);
          setLongitude(lng);
        } else {
          toast.error('Could not find coordinates for this address. Please ensure it is accurate.');
          setLoading(false);
          return;
        }
      }

      const response = await fetch(`${apiUrl}/sellers/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessName: businessName.trim(),
          businessType: businessType,
          businessAddress: businessAddress.trim(),
          pickupInstructions: pickupInstructions.trim() || undefined,
          latitude: Number(lat),
          longitude: Number(lng),
        }),
      });

      if (response.ok) {
        toast.success('Successfully onboarded! Redirecting to your seller dashboard...');
        refreshAccessTokenBeforeRedirect().finally(() => {
          setTimeout(() => router.push('/seller'), 2000);
        });
      } else {
        const error = await response.json().catch(() => ({}));
        const msg = Array.isArray(error.message) ? error.message.join(', ') : error.message;
        toast.error(`Failed to onboard: ${msg || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error onboarding:', error);
      toast.error('Failed to onboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (authLoading || checkingStatus) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#ffcc99]">{authLoading ? 'Loading...' : 'Checking status...'}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  if (alreadyOnboarded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-white text-2xl font-bold mb-2">Already Onboarded!</h1>
          <p className="text-[#ffcc99] mb-4">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Seller Onboarding - Carryofy</title>
        <meta name="description" content="Complete your seller onboarding on Carryofy." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-[#ff6600]/20 rounded-full mb-4">
              <Building2 className="w-12 h-12 text-[#ff6600]" />
            </div>
            <h1 className="text-white text-4xl font-bold mb-2">Welcome to Carryofy Seller Portal!</h1>
            <p className="text-[#ffcc99] text-lg">
              Let&apos;s get you started by setting up your seller profile
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className={`text-sm font-medium ${step >= s ? 'text-[#ff6600]' : 'text-[#ffcc99]/50'}`}
                >
                  Step {s}
                </span>
              ))}
            </div>
            <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`h-full flex-1 ${step >= s ? 'bg-[#ff6600]' : 'bg-white/5'}`}
                />
              ))}
            </div>
          </div>

          {/* Onboarding steps */}
          <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-8">
            {step === 1 && (
              <>
                <h2 className="text-white text-2xl font-bold mb-6">Business details</h2>
                {needsPhoneUpdate && (
                  <div className="mb-6 p-4 bg-amber-900/20 border border-amber-500/40 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-400 font-semibold text-sm mb-1">Phone Number Required</p>
                      <p className="text-amber-300 text-xs">
                        Your account needs a valid phone number. Local format like <strong>08012345678</strong> is accepted.
                      </p>
                    </div>
                  </div>
                )}
                <div className="space-y-6">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Business Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Enter your business name"
                      className="form-input flex w-full resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#ff6600]/30 bg-black focus:border-[#ff6600] h-14 placeholder:text-[#ffcc99] p-4 text-base font-normal leading-normal"
                    />
                    <p className="text-[#ffcc99] text-xs mt-2">
                      This will be visible to customers when they view your products
                    </p>
                  </div>
                  {needsPhoneUpdate && (
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        <span className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-[#ff6600]" />
                          Phone Number <span className="text-red-400">*</span>
                        </span>
                      </label>
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="08012345678 or +2348012345678"
                        className="form-input flex w-full resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#ff6600]/30 bg-black focus:border-[#ff6600] h-14 placeholder:text-[#ffcc99] p-4 text-base font-normal leading-normal"
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-white text-2xl font-bold mb-2">Pickup location</h2>
                <p className="text-[#ffcc99] text-sm mb-6">Where should our riders come to pick up orders from you?</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Business Pickup Address
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                      <textarea
                        value={businessAddress}
                        onChange={(e) => setBusinessAddress(e.target.value)}
                        placeholder="e.g. 123 Business Way, Ikeja, Lagos"
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 h-24"
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      This is where riders will come to pick up your products.
                    </p>
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Pickup Instructions
                    </label>
                    <input
                      type="text"
                      value={pickupInstructions}
                      onChange={(e) => setPickupInstructions(e.target.value)}
                      placeholder="e.g. Call on arrival. Blue gate, ask for Emeka."
                      className="form-input flex w-full resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#ff6600]/30 bg-black focus:border-[#ff6600] h-14 placeholder:text-[#ffcc99] p-4 text-base font-normal leading-normal"
                    />
                  </div>

                  {/* 
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Latitude <span className="text-red-400">*</span></label>
                      <input
                        type="number"
                        step="any"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : '')}
                        disabled
                        placeholder="Coordinates"
                        className="form-input flex w-full resize-none overflow-hidden rounded-xl text-[#A0A0A0] border border-[#ff6600]/20 bg-black/50 h-14 p-4 text-base font-normal leading-normal"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Longitude <span className="text-red-400">*</span></label>
                      <input
                        type="number"
                        step="any"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : '')}
                        disabled
                        placeholder="Coordinates"
                        className="form-input flex w-full resize-none overflow-hidden rounded-xl text-[#A0A0A0] border border-[#ff6600]/20 bg-black/50 h-14 p-4 text-base font-normal leading-normal"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.geolocation) {
                        toast.loading('Getting location...', { id: 'geo' });
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setLatitude(pos.coords.latitude);
                            setLongitude(pos.coords.longitude);
                            toast.success('Location updated!', { id: 'geo' });
                          },
                          (err) => {
                            toast.error('Could not get location. Please enter manually.', { id: 'geo' });
                            console.error(err);
                          }
                        );
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600]/10 transition"
                  >
                    <Building2 className="w-5 h-5" />
                    Use my current location
                  </button>
                  <p className="text-center text-[#ffcc99] text-xs">
                    Riders need these coordinates to find you precisely.
                  </p>
                  */}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-white text-2xl font-bold mb-2">How do you sell?</h2>
                <p className="text-[#ffcc99] text-sm mb-6">Select your business type so we can tailor your seller experience.</p>
                <div className="grid gap-4">
                  {SELLER_BUSINESS_TYPES.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setBusinessType(opt.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${businessType === opt.id
                        ? 'border-[#ff6600] bg-[#ff6600]/10'
                        : 'border-white/10 hover:border-[#ff6600]/50 bg-black/50'
                        }`}
                    >
                      <span className="text-white font-semibold block">{opt.label}</span>
                      <span className="text-[#ffcc99]/80 text-sm">{opt.description}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="text-white text-2xl font-bold mb-2">What do you plan to sell?</h2>
                <p className="text-[#ffcc99] text-sm mb-6">Select the categories you want to list products in (you can add more later).</p>
                <div className="flex flex-wrap gap-2">
                  {SELLER_PLANNED_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => togglePlannedCategory(cat)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition ${plannedCategories.includes(cat)
                        ? 'bg-[#ff6600] text-black'
                        : 'bg-white/10 text-[#ffcc99] hover:bg-white/20'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <h2 className="text-white text-2xl font-bold mb-6">Review & submit</h2>
                <div className="space-y-4 mb-6">
                  <div className="p-4 rounded-xl bg-black/50 border border-white/10">
                    <p className="text-[#ffcc99] text-xs uppercase tracking-wide mb-1">Business name</p>
                    <p className="text-white font-semibold">{businessName || '—'}</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <span className="text-sm text-gray-400 block mb-1">Business Address</span>
                    <span className="text-white font-medium">{businessAddress}</span>
                  </div>
                  {/* 
                    {(latitude && longitude) && (
                      <p className="text-[#A0A0A0] text-xs mt-1">
                        GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                      </p>
                    )}
                    */}
                </div>
                <div className="p-4 rounded-xl bg-black/50 border border-white/10">
                  <p className="text-[#ffcc99] text-xs uppercase tracking-wide mb-1">Business type</p>
                  <p className="text-white font-semibold">
                    {SELLER_BUSINESS_TYPES.find((t) => t.id === businessType)?.label ?? '—'}
                  </p>
                </div>
                {plannedCategories.length > 0 && (
                  <div className="p-4 rounded-xl bg-black/50 border border-white/10">
                    <p className="text-[#ffcc99] text-xs uppercase tracking-wide mb-1">Planned categories</p>
                    <p className="text-white font-medium">{plannedCategories.join(', ')}</p>
                  </div>
                )}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                  <h3 className="text-white font-semibold mb-2">What happens next?</h3>
                  <ul className="text-[#ffcc99] text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-[#ff6600] mt-0.5">•</span>
                      <span>Your application will be reviewed by our team</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#ff6600] mt-0.5">•</span>
                      <span>You&apos;ll be able to add products once approved</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#ff6600] mt-0.5">•</span>
                      <span>We&apos;ll notify you via email about your KYC status</span>
                    </li>
                  </ul>
                </div>
                <form onSubmit={handleSubmit}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#ff6600] hover:bg-[#cc5200] disabled:bg-[#ff6600]/50 disabled:cursor-not-allowed text-black px-6 py-4 rounded-xl font-bold text-lg transition"
                  >
                    {loading ? 'Submitting...' : 'Complete seller onboarding'}
                  </button>
                </form>
              </>
            )}

            {/* Navigation (steps 1–4) */}
            {step < 5 && (
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  disabled={step === 1}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/20 text-[#ffcc99] hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex items-center gap-2 px-6 py-3 bg-[#ff6600] hover:bg-[#cc5200] text-black font-semibold rounded-xl transition"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-[#ffcc99] text-sm">
              Need help?{' '}
              <a href="mailto:support@carryofy.com" className="text-[#ff6600] hover:text-[#cc5200] transition">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div >
    </>
  );
}
