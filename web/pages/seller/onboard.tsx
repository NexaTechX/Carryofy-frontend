import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuth, tokenManager } from '../../lib/auth';
import { refreshAccessTokenBeforeRedirect } from '../../lib/api/client';
import { Building2, CheckCircle, Phone, AlertTriangle } from 'lucide-react';

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

export default function SellerOnboardingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [alreadyOnboarded, setAlreadyOnboarded] = useState(false);
  const [businessName, setBusinessName] = useState('');

  // Phone state — shown when user's saved phone is missing/invalid
  const [currentPhone, setCurrentPhone] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [needsPhoneUpdate, setNeedsPhoneUpdate] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!businessName.trim()) {
      toast.error('Please enter your business name');
      return;
    }

    // Validate phone if it needs updating
    if (needsPhoneUpdate) {
      if (!phoneInput.trim()) {
        toast.error('Phone number is required for seller accounts');
        return;
      }
      const normalized = normalizePhone(phoneInput.trim());
      if (!isValidPhone(normalized)) {
        toast.error('Please enter a valid phone number (e.g. 08012345678 or +2348012345678)');
        return;
      }
    }

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
      const response = await fetch(`${apiUrl}/sellers/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ businessName: businessName.trim() }),
      });

      if (response.ok) {
        toast.success('Successfully onboarded! Redirecting to dashboard...');
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

          {/* Onboarding Form */}
          <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-8">
            <h2 className="text-white text-2xl font-bold mb-6">Business Information</h2>

            {/* Phone warning banner */}
            {needsPhoneUpdate && (
              <div className="mb-6 p-4 bg-amber-900/20 border border-amber-500/40 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-400 font-semibold text-sm mb-1">Phone Number Required</p>
                  <p className="text-amber-300 text-xs">
                    Your account needs a valid phone number to complete seller onboarding.
                    You can enter it below — local format like <strong>08012345678</strong> is accepted.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Business Name */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Business Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Enter your business name"
                  required
                  className="form-input flex w-full resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#ff6600]/30 bg-black focus:border-[#ff6600] h-14 placeholder:text-[#ffcc99] p-4 text-base font-normal leading-normal"
                />
                <p className="text-[#ffcc99] text-xs mt-2">
                  This will be visible to customers when they view your products
                </p>
              </div>

              {/* Phone Number — only shown when profile phone is missing or invalid */}
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
                    required
                    className="form-input flex w-full resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#ff6600]/30 bg-black focus:border-[#ff6600] h-14 placeholder:text-[#ffcc99] p-4 text-base font-normal leading-normal"
                  />
                  <p className="text-[#ffcc99] text-xs mt-2">
                    Enter your Nigerian number (e.g. 08012345678) — we&apos;ll convert it automatically
                  </p>
                </div>
              )}

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-2">What happens next?</h3>
                <ul className="text-[#ffcc99] text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-[#ff6600] mt-0.5">•</span>
                    <span>Your application will be reviewed by our team</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#ff6600] mt-0.5">•</span>
                    <span>You'll be able to add products once approved</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#ff6600] mt-0.5">•</span>
                    <span>We'll notify you via email about your KYC status</span>
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ff6600] hover:bg-[#cc5200] disabled:bg-[#ff6600]/50 disabled:cursor-not-allowed text-black px-6 py-4 rounded-xl font-bold text-lg transition"
              >
                {loading ? 'Submitting...' : 'Complete Onboarding'}
              </button>
            </form>
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
      </div>
    </>
  );
}
