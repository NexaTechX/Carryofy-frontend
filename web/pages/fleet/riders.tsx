import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import FleetLayout from '../../components/fleet/FleetLayout';
import { useAuth } from '../../lib/auth';
import { fetchFleetRiders, assignFleetDelivery } from '../../lib/api/fleet';
import { formatNgnFromKobo } from '../../lib/api/utils';
import { toast } from 'react-hot-toast';

export default function FleetRidersPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [deliveryId, setDeliveryId] = useState('');
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);

  const { data: riders = [], mutate } = useSWR(
    isAuthenticated && user?.role === 'FLEET_OPERATOR' ? 'fleet-riders' : null,
    fetchFleetRiders,
  );

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) router.push('/auth/login');
    else if (user.role !== 'FLEET_OPERATOR') router.push('/');
  }, [isLoading, isAuthenticated, user, router]);

  if (!user || user.role !== 'FLEET_OPERATOR') return null;

  const handleAssign = async (riderUserId: string) => {
    const id = deliveryId.trim();
    if (!id) {
      toast.error('Enter a delivery ID');
      return;
    }
    setAssigningUserId(riderUserId);
    try {
      await assignFleetDelivery(id, riderUserId);
      toast.success('Delivery assigned');
      setDeliveryId('');
      mutate();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Assignment failed';
      toast.error(typeof msg === 'string' ? msg : 'Assignment failed');
    } finally {
      setAssigningUserId(null);
    }
  };

  return (
    <FleetLayout>
      <Head>
        <title>Fleet riders · Carryofy</title>
      </Head>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-white">Riders</h1>

        <div className="rounded-xl border border-zinc-800 bg-[#0f1218] p-4">
          <p className="text-sm text-zinc-400">
            Enter a delivery UUID, then click <strong className="text-zinc-200">Assign</strong> next to a rider.
          </p>
          <input
            type="text"
            value={deliveryId}
            onChange={(e) => setDeliveryId(e.target.value)}
            placeholder="Delivery ID (UUID)"
            className="mt-3 w-full max-w-xl rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Rider</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Available</th>
                <th className="px-4 py-3">Current delivery</th>
                <th className="px-4 py-3">Week earnings</th>
                <th className="px-4 py-3 text-right">Assign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {riders.map((r) => (
                <tr key={r.userId} className="text-zinc-300">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{r.name}</div>
                    <div className="text-xs text-zinc-500">{r.email}</div>
                  </td>
                  <td className="px-4 py-3">{r.vehicleType ?? '—'}</td>
                  <td className="px-4 py-3">{r.isAvailable ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {r.currentDelivery
                      ? `${r.currentDelivery.orderId.slice(0, 8)}… (${r.currentDelivery.status})`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">{formatNgnFromKobo(r.weekEarningsKobo)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={assigningUserId === r.userId}
                      onClick={() => handleAssign(r.userId)}
                      className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
                    >
                      {assigningUserId === r.userId ? '…' : 'Assign'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {riders.length === 0 && (
            <p className="p-6 text-center text-zinc-500">No riders assigned to this fleet yet.</p>
          )}
        </div>
      </div>
    </FleetLayout>
  );
}
