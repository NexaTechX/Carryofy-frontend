import Head from 'next/head';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { Users, Truck, Wallet, TrendingUp, ArrowUpRight, Inbox, CreditCard } from 'lucide-react';
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
        <p className="text-foreground/45">Loading…</p>
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
      <div className="space-y-8">
        <div className="reveal-up">
          <p className="text-sm font-medium text-foreground/50">Welcome back, {user?.name?.split(/\s+/)[0] ?? 'operator'} 👋</p>
          <h1 className="mt-1 font-display text-[32px] font-bold leading-tight tracking-tight text-foreground">Fleet Overview</h1>
          <p className="mt-1 text-sm text-foreground/50">Monitor riders, deliveries, and pooled earnings.</p>
        </div>

        {loadingData ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="surface-card h-[132px] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 reveal-stagger sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: 'Active riders', icon: Users, href: '/fleet/riders',
                value: String(dash?.activeRiders ?? 0), sub: `of ${dash?.totalRiders ?? 0} total`,
              },
              {
                label: 'Deliveries today', icon: Truck, href: '/fleet/deliveries',
                value: String(dash?.deliveriesToday ?? 0),
              },
              {
                label: 'Pending pool', icon: Wallet, href: '/fleet/payouts', accent: true,
                value: formatNgnFromKobo(dash?.pendingPoolKobo ?? 0),
              },
              {
                label: 'Total earned (all time)', icon: TrendingUp, href: '/fleet/earnings',
                value: formatNgnFromKobo(earn?.totalEarnedKobo ?? 0),
              },
            ].map(({ label, icon: Icon, href, value, sub, accent }) => (
              <Link
                key={label}
                href={href}
                className={`surface-card group flex flex-col gap-3.5 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-elevated${accent ? ' border-l-2 border-l-primary' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 -translate-x-1 text-foreground/30 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />
                </div>
                <p className="font-display text-3xl font-bold leading-none tracking-tight text-foreground tabular-nums">{value}</p>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/55">{label}</p>
                  {sub ? <p className="mt-1 text-xs text-foreground/45">{sub}</p> : null}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-foreground/45">Quick actions</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Manage riders', desc: 'Add riders & assign deliveries', icon: Users, href: '/fleet/riders' },
              { label: 'Incoming deliveries', desc: 'Accept new dispatch requests', icon: Inbox, href: '/fleet/deliveries/incoming' },
              { label: 'Request payout', desc: 'Withdraw your pending pool', icon: CreditCard, href: '/fleet/payouts' },
            ].map(({ label, desc, icon: Icon, href }) => (
              <Link
                key={label}
                href={href}
                className="surface-card group flex items-center gap-3 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-elevated"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="truncate text-xs text-foreground/45">{desc}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-foreground/30 transition group-hover:text-primary" aria-hidden />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </FleetLayout>
  );
}
