import Head from 'next/head';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import FleetLayout from '../../components/fleet/FleetLayout';
import { useAuth } from '../../lib/auth';
import { isFleetPortalUser } from '../../lib/fleet/roles';
import { fetchFleetEarningsPage } from '../../lib/api/fleet';
import { formatNgnFromKobo } from '../../lib/api/utils';

export default function FleetEarningsPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  const { data, error, isLoading: loadingData } = useSWR(
    isAuthenticated && isFleetPortalUser(user?.role) ? 'fleet-earnings-page' : null,
    fetchFleetEarningsPage,
  );

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) router.push('/auth/login');
    else if (!isFleetPortalUser(user.role)) router.push('/');
  }, [isLoading, isAuthenticated, user, router]);

  if (!user || !isFleetPortalUser(user.role)) return null;

  const summary = data?.summary;
  const riders = data?.riders ?? [];

  return (
    <FleetLayout>
      <Head>
        <title>Fleet earnings · Carryofy</title>
      </Head>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Earnings</h1>
            <p className="mt-1 text-sm text-foreground/45">
              Pooled logistics earnings by rider.
            </p>
          </div>
          <Link
            href="/fleet/payouts"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-black hover:bg-primary-dark"
          >
            Request payout
          </Link>
        </div>

        {loadingData ? (
          <p className="text-foreground/45">Loading…</p>
        ) : error ? (
          <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4 text-sm text-danger">
            Could not load earnings. Please try again.
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border-custom bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-foreground/45">
                  Total earned (all time)
                </p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {formatNgnFromKobo(summary?.totalEarnedKobo ?? 0)}
                </p>
              </div>
              <div className="rounded-xl border border-border-custom bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-foreground/45">Pending pool</p>
                <p className="mt-2 text-xl font-semibold text-primary">
                  {formatNgnFromKobo(summary?.pendingPoolKobo ?? 0)}
                </p>
              </div>
              <div className="rounded-xl border border-border-custom bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-foreground/45">Paid out</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {formatNgnFromKobo(summary?.paidOutKobo ?? 0)}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border-custom">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border-custom bg-[var(--color-surface-2)] text-xs uppercase text-foreground/45">
                  <tr>
                    <th className="px-4 py-3">Rider</th>
                    <th className="px-4 py-3">Deliveries</th>
                    <th className="px-4 py-3">Pending</th>
                    <th className="px-4 py-3">Paid</th>
                    <th className="px-4 py-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom">
                  {riders.map((row) => (
                    <tr key={row.riderId} className="text-foreground/70">
                      <td className="px-4 py-3 font-medium text-foreground">{row.riderName}</td>
                      <td className="px-4 py-3">{row.deliveryCount}</td>
                      <td className="px-4 py-3 text-primary">
                        {formatNgnFromKobo(row.pendingAmountKobo)}
                      </td>
                      <td className="px-4 py-3">{formatNgnFromKobo(row.paidAmountKobo)}</td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {formatNgnFromKobo(row.totalAmountKobo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {riders.length === 0 && (
                <p className="p-6 text-center text-foreground/45">No delivery earnings yet</p>
              )}
            </div>
          </>
        )}
      </div>
    </FleetLayout>
  );
}
