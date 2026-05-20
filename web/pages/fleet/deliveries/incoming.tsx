import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import FleetLayout from '../../../components/fleet/FleetLayout';
import { useAuth } from '../../../lib/auth';
import {
  assignFleetDelivery,
  fetchFleetIncomingDeliveries,
  fetchFleetRiders,
  type FleetIncomingDelivery,
} from '../../../lib/api/fleet';
import { toast } from 'react-hot-toast';

function formatAddress(d: FleetIncomingDelivery): string {
  const addr = d.order?.address;
  if (addr) {
    return [addr.line1, addr.line2, addr.city, addr.state].filter(Boolean).join(', ');
  }
  return d.deliveryAddress ?? '—';
}

function itemSummary(d: FleetIncomingDelivery): string {
  const items = d.order?.items ?? [];
  if (items.length === 0) return '—';
  const first = items[0]?.product?.title ?? 'Item';
  const extra = items.length > 1 ? ` +${items.length - 1} more` : '';
  const qty = items.reduce((s, i) => s + (i.quantity ?? 0), 0);
  return `${first} (${qty} unit${qty === 1 ? '' : 's'})${extra}`;
}

export default function FleetIncomingDeliveriesPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [assignTarget, setAssignTarget] = useState<FleetIncomingDelivery | null>(
    null,
  );
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const queryKey =
    isAuthenticated && user?.role === 'FLEET_OPERATOR'
      ? ['fleet-deliveries-incoming']
      : null;

  const { data: deliveries = [], mutate } = useSWR(queryKey, () =>
    fetchFleetIncomingDeliveries(),
  );

  const { data: riders = [] } = useSWR(
    assignTarget && queryKey ? ['fleet-riders'] : null,
    fetchFleetRiders,
  );

  const availableRiders = useMemo(
    () => riders.filter((r) => r.isAvailable),
    [riders],
  );

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) router.push('/auth/login');
    else if (user.role !== 'FLEET_OPERATOR') router.push('/');
  }, [isLoading, isAuthenticated, user, router]);

  const closeModal = () => {
    setAssignTarget(null);
    setSelectedRiderId('');
  };

  const handleAssign = async () => {
    if (!assignTarget || !selectedRiderId) {
      toast.error('Select a rider.');
      return;
    }
    setSubmitting(true);
    try {
      await assignFleetDelivery(assignTarget.id, selectedRiderId);
      toast.success('Rider assigned');
      closeModal();
      await mutate();
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === 'object' &&
        'response' in e &&
        (e as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      toast.error(typeof msg === 'string' ? msg : 'Failed to assign rider');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== 'FLEET_OPERATOR') return null;

  return (
    <FleetLayout>
      <Head>
        <title>Incoming deliveries · Carryofy Fleet</title>
      </Head>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Incoming</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Orders routed to your fleet — assign an available rider to each delivery.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Assigned to fleet</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {deliveries.map((d) => (
                <tr key={d.id} className="text-zinc-300">
                  <td className="px-4 py-3 font-mono text-xs">
                    #{String(d.orderId).slice(0, 8)}…
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-xs">
                    {formatAddress(d)}
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-xs">
                    {itemSummary(d)}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {new Date(d.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAssignTarget(d);
                        setSelectedRiderId('');
                      }}
                      className="rounded-lg bg-[#F97316] px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
                    >
                      Assign Rider
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {deliveries.length === 0 && (
            <p className="p-6 text-center text-zinc-500">
              No incoming deliveries right now.
            </p>
          )}
        </div>
      </div>

      {assignTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-rider-title"
        >
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-[#0f1218] p-6 shadow-xl">
            <h2
              id="assign-rider-title"
              className="text-lg font-semibold text-white"
            >
              Assign rider
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Order #{assignTarget.orderId.slice(0, 8)}…
            </p>
            <label className="mt-4 block text-xs font-medium text-zinc-500">
              Available riders
            </label>
            <select
              value={selectedRiderId}
              onChange={(e) => setSelectedRiderId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
            >
              <option value="">Select rider</option>
              {availableRiders.map((r) => (
                <option key={r.userId} value={r.userId}>
                  {r.name}
                </option>
              ))}
            </select>
            {availableRiders.length === 0 && (
              <p className="mt-2 text-xs text-amber-400">
                No available riders. Mark a rider as available first.
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssign}
                disabled={submitting || !selectedRiderId}
                className="rounded-lg bg-[#F97316] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {submitting ? 'Assigning…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </FleetLayout>
  );
}
