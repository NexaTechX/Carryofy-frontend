import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import FleetLayout from '../../components/fleet/FleetLayout';
import { useAuth } from '../../lib/auth';
import { fetchFleetPayoutHistory, requestFleetPayout } from '../../lib/api/fleet';
import { formatNgnFromKobo } from '../../lib/api/utils';
import { toast } from 'react-hot-toast';

export default function FleetPayoutsPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [amountNgn, setAmountNgn] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: payouts = [], mutate } = useSWR(
    isAuthenticated && user?.role === 'FLEET_OPERATOR' ? 'fleet-payouts' : null,
    fetchFleetPayoutHistory,
  );

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) router.push('/auth/login');
    else if (user.role !== 'FLEET_OPERATOR') router.push('/');
  }, [isLoading, isAuthenticated, user, router]);

  if (!user || user.role !== 'FLEET_OPERATOR') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ngn = parseFloat(amountNgn);
    if (!ngn || ngn <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!bankAccountName.trim() || !bankAccountNumber.trim() || !bankCode.trim()) {
      toast.error('Bank details required');
      return;
    }
    setSubmitting(true);
    try {
      await requestFleetPayout({
        amount: Math.round(ngn * 100),
        bankAccountName: bankAccountName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankCode: bankCode.trim(),
      });
      toast.success('Payout request submitted');
      setAmountNgn('');
      mutate();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Request failed';
      toast.error(typeof msg === 'string' ? msg : 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FleetLayout>
      <Head>
        <title>Fleet payouts · Carryofy</title>
      </Head>
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold text-white">Payouts</h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-zinc-800 bg-[#0f1218] p-6"
        >
          <h2 className="text-lg font-medium text-white">Request payout</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-zinc-400">Amount (NGN)</span>
              <input
                type="number"
                step="0.01"
                min={0}
                value={amountNgn}
                onChange={(e) => setAmountNgn(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-zinc-400">Bank code (Paystack)</span>
              <input
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
                placeholder="058"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-zinc-400">Account name</span>
              <input
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-zinc-400">Account number</span>
              <input
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit request'}
          </button>
        </form>

        <div>
          <h2 className="mb-3 text-lg font-medium text-white">History</h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {(payouts as Record<string, unknown>[]).map((p) => (
                  <tr key={String(p.id)}>
                    <td className="px-4 py-3 text-white">
                      {formatNgnFromKobo(Number(p.totalAmountKobo ?? 0))}
                    </td>
                    <td className="px-4 py-3">{String(p.status)}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      {p.createdAt ? new Date(String(p.createdAt)).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payouts.length === 0 && (
              <p className="p-6 text-center text-zinc-500">No payout requests yet.</p>
            )}
          </div>
        </div>
      </div>
    </FleetLayout>
  );
}
