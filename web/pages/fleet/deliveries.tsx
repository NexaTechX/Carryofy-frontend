import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import FleetLayout from '../../components/fleet/FleetLayout';
import { useAuth } from '../../lib/auth';
import { isFleetPortalUser } from '../../lib/fleet/roles';
import { fetchFleetDeliveries } from '../../lib/api/fleet';
import { formatNgnFromKobo } from '../../lib/api/utils';

export default function FleetDeliveriesPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<string>('');

  const queryKey = useMemo(
    () =>
      isAuthenticated && isFleetPortalUser(user?.role)
        ? ['fleet-deliveries', status]
        : null,
    [isAuthenticated, user?.role, status],
  );

  const { data: deliveries = [] } = useSWR(queryKey, () =>
    fetchFleetDeliveries(status ? { status } : {}),
  );

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) router.push('/auth/login');
    else if (!isFleetPortalUser(user.role)) router.push('/');
  }, [isLoading, isAuthenticated, user, router]);

  if (!user || !isFleetPortalUser(user.role)) return null;

  return (
    <FleetLayout>
      <Head>
        <title>Fleet deliveries · Carryofy</title>
      </Head>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-foreground">Deliveries</h1>

        <div className="flex flex-wrap gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-border-custom bg-[var(--color-surface-2)] px-3 py-2 text-sm text-foreground"
          >
            <option value="">All statuses</option>
            <option value="AWAITING_ASSIGNMENT">Awaiting assignment</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="PICKED_UP">Picked up</option>
            <option value="IN_TRANSIT">In transit</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border-custom">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border-custom bg-[var(--color-surface-2)] text-xs uppercase text-foreground/45">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Pickup</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Rider</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Delivery fee (est.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {(deliveries as Record<string, unknown>[]).map((d) => {
                const ord = d.order as Record<string, unknown> | undefined;
                const rider = d.rider as Record<string, unknown> | undefined;
                const riderCost = ord?.riderCostKobo as number | undefined;
                return (
                  <tr key={String(d.id)} className="text-foreground/70">
                    <td className="px-4 py-3 font-mono text-xs">
                      #{String(d.orderId ?? '').slice(0, 8)}…
                    </td>
                    <td className="max-w-[140px] truncate px-4 py-3 text-xs">
                      {String(d.pickupAddress ?? '—')}
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-xs">
                      {String(d.deliveryAddress ?? '—')}
                    </td>
                    <td className="px-4 py-3">{String(rider?.name ?? '—')}</td>
                    <td className="px-4 py-3">{String(d.status)}</td>
                    <td className="px-4 py-3">
                      {riderCost != null ? formatNgnFromKobo(riderCost) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {deliveries.length === 0 && (
            <p className="p-6 text-center text-foreground/45">No deliveries for your fleet yet.</p>
          )}
        </div>
      </div>
    </FleetLayout>
  );
}
