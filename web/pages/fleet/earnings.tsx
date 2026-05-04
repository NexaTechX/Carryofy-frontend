import Head from 'next/head';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import FleetLayout from '../../components/fleet/FleetLayout';
import { useAuth } from '../../lib/auth';
import { fetchFleetEarningsPage } from '../../lib/api/fleet';
import { formatNgnFromKobo } from '../../lib/api/utils';

export default function FleetEarningsPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  const { data } = useSWR(
    isAuthenticated && user?.role === 'FLEET_OPERATOR' ? 'fleet-earnings-page' : null,
    fetchFleetEarningsPage,
  );

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) router.push('/auth/login');
    else if (user.role !== 'FLEET_OPERATOR') router.push('/');
  }, [isLoading, isAuthenticated, user, router]);

  if (!user || user.role !== 'FLEET_OPERATOR') return null;

  const summary = data?.summary;
  const byRider = data?.byRider ?? [];

  return (
    <FleetLayout>
      <Head>
        <title>Fleet earnings · Carryofy</title>
      </Head>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Earnings</h1>
            <p className="mt-1 text-sm text-zinc-500">Pooled logistics earnings by rider.</p>
          </div>
          <Link
            href="/fleet/payouts"
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-black"
          >
            Request payout
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-[#0f1218] p-4">
            <p className="text-xs uppercase text-zinc-500">Total earned</p>
            <p className="mt-2 text-xl font-semibold text-white">
              {formatNgnFromKobo(summary?.totalEarnedKobo ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-[#0f1218] p-4">
            <p className="text-xs uppercase text-zinc-500">Pending pool</p>
            <p className="mt-2 text-xl font-semibold text-orange-400">
              {formatNgnFromKobo(summary?.pendingPoolKobo ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-[#0f1218] p-4">
            <p className="text-xs uppercase text-zinc-500">Paid out</p>
            <p className="mt-2 text-xl font-semibold text-emerald-400">
              {formatNgnFromKobo(summary?.paidOutKobo ?? 0)}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Rider</th>
                <th className="px-4 py-3">Fleet earnings attributed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {byRider.map((row) => (
                <tr key={row.riderId}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{row.name}</div>
                    <div className="text-xs text-zinc-500">{row.email}</div>
                  </td>
                  <td className="px-4 py-3">{formatNgnFromKobo(row.fleetEarningsKobo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {byRider.length === 0 && (
            <p className="p-6 text-center text-zinc-500">No fleet earnings recorded yet.</p>
          )}
        </div>
      </div>
    </FleetLayout>
  );
}
