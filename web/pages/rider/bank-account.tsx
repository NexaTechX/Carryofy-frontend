import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth';
import { Loader2, Landmark, ArrowLeft } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../../lib/ui/toast';
import apiClient from '../../lib/api/client';
import { normalizeResponse } from '../../lib/admin/normalizeResponse';
import { NIGERIAN_BANKS } from '../../lib/constants/nigerian-banks';

interface RiderBankAccountResponse {
  id: string;
  riderId: string;
  accountName: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  createdAt: string;
  updatedAt: string;
}

export default function RiderBankAccount() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');

  // Secondary UX fallback only (edge auth/session desync); primary guard is middleware.
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      const q = new URLSearchParams({ redirect: router.asPath });
      void router.replace(`/auth/login?${q.toString()}`);
      return;
    }
    if (user.role !== 'RIDER') void router.replace('/');
  }, [user, isAuthenticated, isLoading, router]);

  // Prefill from existing bank account on file
  useEffect(() => {
    if (isLoading || !isAuthenticated || user?.role !== 'RIDER') return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.get('/rider/bank-account');
        const account = normalizeResponse<RiderBankAccountResponse | null>(data);
        if (!cancelled && account) {
          setAccountName(account.accountName ?? '');
          setAccountNumber(account.accountNumber ?? '');
          setBankCode(account.bankCode ?? '');
        }
      } catch (error) {
        console.error('Failed to load bank account', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoading, isAuthenticated, user?.role]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = accountName.trim();
    if (!trimmedName) {
      showErrorToast('Account name is required');
      return;
    }
    if (!/^\d{10}$/.test(accountNumber)) {
      showErrorToast('Account number must be exactly 10 digits');
      return;
    }
    const bank = NIGERIAN_BANKS.find((b) => b.code === bankCode);
    if (!bank) {
      showErrorToast('Please select your bank');
      return;
    }

    setSaving(true);
    try {
      await apiClient.put('/rider/bank-account', {
        accountName: trimmedName,
        accountNumber,
        bankCode: bank.code,
        bankName: bank.name,
      });
      showSuccessToast('Bank details saved');
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save bank details';
      showErrorToast(message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6600]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Payout Bank Account | Carryofy Rider</title>
      </Head>

      <nav className="border-b border-[#ff6600]/20 bg-[#1a1a1a] p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-[#ff6600]">Carryofy Rider</h1>
          <span className="text-sm text-[#ffcc99]">{user.name}</span>
        </div>
      </nav>

      <main className="max-w-md mx-auto p-6 mt-8">
        <Link
          href="/rider/dashboard"
          className="mb-4 inline-flex items-center gap-2 text-sm text-[#ffcc99]/70 transition hover:text-[#ff6600]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>

        <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-[#ff6600]/10 text-[#ff6600]">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Payout Bank Account</h2>
              <p className="text-[#ffcc99]/70 text-sm">Where we send your delivery earnings.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#ff6600]" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block text-sm">
                <span className="text-[#ffcc99]">Account Name</span>
                <input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="mt-1 w-full rounded-lg border border-[#ff6600]/20 bg-black/40 px-3 py-2 text-white placeholder-[#ffcc99]/40 focus:border-[#ff6600] focus:outline-none"
                />
              </label>

              <label className="block text-sm">
                <span className="text-[#ffcc99]">Account Number</span>
                <input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit account number"
                  className="mt-1 w-full rounded-lg border border-[#ff6600]/20 bg-black/40 px-3 py-2 text-white placeholder-[#ffcc99]/40 focus:border-[#ff6600] focus:outline-none"
                />
                {accountNumber.length > 0 && accountNumber.length !== 10 && (
                  <span className="mt-1 block text-xs text-red-400">Account number must be exactly 10 digits</span>
                )}
              </label>

              <label className="block text-sm">
                <span className="text-[#ffcc99]">Bank</span>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#ff6600]/20 bg-black/40 px-3 py-2 text-white focus:border-[#ff6600] focus:outline-none"
                >
                  <option value="">Select your bank</option>
                  {NIGERIAN_BANKS.map((bank) => (
                    <option key={bank.code} value={bank.code} className="bg-[#1a1a1a]">
                      {bank.name}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-[#ff6600] text-black transition-all hover:bg-[#cc5200] disabled:opacity-60"
              >
                {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                {saving ? 'Saving…' : 'Save Bank Details'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
