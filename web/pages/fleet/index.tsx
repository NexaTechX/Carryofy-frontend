import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import FleetLayout from '../../components/fleet/FleetLayout';
import { useAuth } from '../../lib/auth';
import { fetchFleetOverview } from '../../lib/api/fleet';
import { formatNgnFromKobo } from '../../lib/api/utils';

function isFleetPortalUser(role: string | undefined): boolean {
  return role === 'FLEET_OPERATOR' || role === 'FLEET' || role === 'ADMIN';
}

export default function FleetOverviewPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  const fleetPortal = isFleetPortalUser(user?.role);

  const { data, isLoading: loadingData } = useSWR(
    isAuthenticated && fleetPortal ? 'fleet-overview' : null,
    fetchFleetOverview,
    { refreshInterval: 60000 },
  );

  // Secondary UX fallback only (edge auth/session desync); primary guard is middleware.
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      const q = new URLSearchParams({ redirect: router.asPath });
      void router.replace(`/auth/login?${q.toString()}`);
      return;
    }
    if (!fleetPortal) void router.replace('/');
  }, [isLoading, isAuthenticated, user, fleetPortal, router]);

  if (isLoading || !user || !fleetPortal) {
    return isLoading ? (
      <FleetLayout>
        <p className="text-zinc-500">Loading…</p>
      </FleetLayout>
    ) : null;
  }

  const dash = data?.dashboard;
  const earn = data?.earnings;

  return (
    <FleetLayout>
      <Head>
        <title>Fleet overview · Carryofy</title>
      </Head>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Overview</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Monitor riders, deliveries, and pooled earnings.
          </p>
        </div>

        {loadingData ? (
          <p className="text-zinc-500">Loading…</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-zinc-800 bg-[#0f1218] p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Active riders</p>
              <p className="mt-2 text-2xl font-semibold text-white">{dash?.activeRiders ?? 0}</p>
              <p className="text-xs text-zinc-500">of {dash?.totalRiders ?? 0} total</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-[#0f1218] p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Deliveries today</p>
              <p className="mt-2 text-2xl font-semibold text-white">{dash?.deliveriesToday ?? 0}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-[#0f1218] p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Pending pool</p>
              <p className="mt-2 text-2xl font-semibold text-orange-400">
                {formatNgnFromKobo(dash?.pendingPoolKobo ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-[#0f1218] p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Total earned (all time)</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {formatNgnFromKobo(earn?.totalEarnedKobo ?? 0)}
              </p>
            </div>
          </div>
        )}
      </div>
    </FleetLayout>
  );
}
