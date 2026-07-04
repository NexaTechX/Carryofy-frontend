import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import { Gift, ArrowLeft, Copy, Share2, CheckCircle2, UserPlus } from 'lucide-react';
import { getMyReferralCode, getMyReferrals, type MyReferralsResponse } from '../../lib/api/referral';
import { formatNgnFromKobo, isApiConnectionError, getApiConnectionErrorMessage } from '../../lib/api/utils';
import { showSuccessToast } from '../../lib/ui/toast';
import LoadFailedState from '../../components/buyer/LoadFailedState';

export default function BuyerReferralsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<MyReferralsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!tokenManager.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    const user = userManager.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [codeRes, referralsRes] = await Promise.all([
        getMyReferralCode(),
        getMyReferrals(),
      ]);
      setCode(codeRes.code);
      setReferrals(referralsRes);
    } catch (err: any) {
      setLoadError(
        isApiConnectionError(err)
          ? getApiConnectionErrorMessage('load')
          : err?.response?.data?.message || null,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const shareUrl = typeof window !== 'undefined' && code
    ? `${window.location.origin}/auth/signup?referralCode=${encodeURIComponent(code)}`
    : '';

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      showSuccessToast('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = () => {
    if (!shareUrl || !code) return;
    if (navigator.share) {
      navigator.share({
        title: 'Join Carryofy',
        text: `Use my referral code ${code} when you sign up for Carryofy!`,
        url: shareUrl,
      }).then(() => showSuccessToast('Shared')).catch(() => {});
    } else {
      handleCopy();
    }
  };

  return (
    <>
      <Head>
        <title>Referrals | Carryofy</title>
      </Head>
      <BuyerLayout>
        <div className="mx-auto max-w-3xl px-4 py-8">
          <Link
            href="/buyer/profile"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to profile
          </Link>
          <div className="flex items-center gap-2 mb-6">
            <Gift className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-semibold text-white">Refer & Earn</h1>
          </div>

          {loading ? (
            <p className="text-gray-400">Loading…</p>
          ) : loadError ? (
            <LoadFailedState label="referral details" message={loadError} onRetry={fetchData} />
          ) : (
            <>
              {code && (
                <div className="rounded-xl border border-[#1f2432] bg-[#0e131d] p-6 mb-6">
                  <p className="text-sm text-gray-500 uppercase tracking-wider mb-2">Your referral code</p>
                  <p className="text-2xl font-mono font-semibold text-primary mb-4">{code}</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Share your link when friends sign up. When they place their first order, you earn ₦500.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#1f2432] bg-[#090c11] px-4 py-2 text-sm text-white hover:bg-[#1f2432]"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied' : 'Copy link'}
                    </button>
                    <button
                      type="button"
                      onClick={handleShare}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black hover:bg-primary/90"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                </div>
              )}

              {referrals && (
                <div className="rounded-xl border border-[#1f2432] bg-[#0e131d] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-white flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Your referrals
                    </h2>
                    <p className="text-sm text-gray-400">
                      Total earned: <span className="text-primary font-semibold">{formatNgnFromKobo(referrals.totalRewardedKobo)}</span>
                    </p>
                  </div>
                  {referrals.attributions.length === 0 ? (
                    <p className="text-gray-500 text-sm">No referrals yet. Share your link to get started.</p>
                  ) : (
                    <ul className="space-y-3">
                      {referrals.attributions.map((a) => (
                        <li key={a.id} className="flex items-center justify-between py-2 border-b border-[#1f2432] last:border-0">
                          <div>
                            <p className="text-white">
                              {a.referredUserName || a.referredUserEmail || a.referredUserId.slice(0, 8)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Joined {new Date(a.referredAt).toLocaleDateString()}
                              {a.rewardStatus === 'CREDITED' && a.rewardAmountKobo != null && (
                                <> · You earned {formatNgnFromKobo(a.rewardAmountKobo)}</>
                              )}
                            </p>
                          </div>
                          {a.rewardStatus === 'CREDITED' ? (
                            <span className="text-xs text-green-400 font-medium">Reward earned</span>
                          ) : (
                            <span className="text-xs text-amber-400">Pending first order</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </BuyerLayout>
    </>
  );
}
