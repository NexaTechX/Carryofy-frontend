import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { tokenManager, userManager } from '../../lib/auth';
import { Building2, CheckCircle } from 'lucide-react';

export default function SellerOnboardingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [alreadyOnboarded, setAlreadyOnboarded] = useState(false);
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    setMounted(true);
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    // Check authentication
    if (!tokenManager.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    const user = userManager.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role && user.role !== 'SELLER' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    // Check if seller is already onboarded
    try {
      const token = tokenManager.getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/sellers/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Seller profile exists, redirect to dashboard
        setAlreadyOnboarded(true);
        setTimeout(() => {
          router.push('/seller');
        }, 2000);
      } else if (response.status === 404) {
        // Not onboarded yet, show form
        setAlreadyOnboarded(false);
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

    setLoading(true);
    try {
      const token = tokenManager.getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

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
        setTimeout(() => {
          router.push('/seller');
        }, 2000);
      } else {
        const error = await response.json();
        toast.error(`Failed to onboard: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error onboarding:', error);
      toast.error('Failed to onboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#ffcc99]">Checking status...</p>
        </div>
      </div>
    );
  }

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
        <meta
          name="description"
          content="Complete your seller onboarding on Carryofy."
        />
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
              Let's get you started by setting up your seller profile
            </p>
          </div>

          {/* Onboarding Form */}
          <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-8">
            <h2 className="text-white text-2xl font-bold mb-6">Business Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Business Name *
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

