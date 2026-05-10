import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import FleetLayout from '../../components/fleet/FleetLayout';
import { useAuth } from '../../lib/auth';
import { fetchFleetRiderBreakRequests, type FleetRiderBreakRequestRow } from '../../lib/api/fleet';
import { formatDateTime } from '../../lib/api/utils';
import { Coffee, RefreshCw } from 'lucide-react';

const fetcher = () => fetchFleetRiderBreakRequests({ limit: 200 });

export default function FleetBreakRequestsPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  const { data, isLoading: loadingRows, mutate } = useSWR(
    isAuthenticated && user?.role === 'FLEET_OPERATOR' ? 'fleet-rider-break-requests' : null,
    fetcher,
    { refreshInterval: 30000 },
  );

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) router.push('/auth/login');
    else if (user.role !== 'FLEET_OPERATOR') router.push('/');
  }, [isLoading, isAuthenticated, user, router]);

  if (!user || user.role !== 'FLEET_OPERATOR') return null;

  const rows: FleetRiderBreakRequestRow[] = Array.isArray(data) ? data : [];

  return (
    <FleetLayout>
      <Head>
        <title>Break requests · Carryofy Fleet</title>
      </Head>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
              <Coffee className="h-7 w-7 text-orange-400" />
              Rider break requests
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-zinc-400">
              Breaks submitted by riders assigned to your fleet (same flow as in the rider app: Profile → Request a break).
            </p>
          </div>
          <button
            type="button"
            onClick={() => mutate()}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          {loadingRows ? (
            <p className="p-8 text-center text-zinc-500">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-zinc-500">
              No break requests from your riders yet.
            </p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Requested</th>
                  <th className="px-4 py-3">Rider</th>
                  <th className="px-4 py-3">Break window</th>
                  <th className="px-4 py-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {rows.map((r) => (
                  <tr key={r.id} className="text-zinc-300">
                    <td className="whitespace-nowrap px-4 py-3">{formatDateTime(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{r.riderName}</div>
                      <div className="text-xs text-zinc-500">{r.riderEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="whitespace-nowrap">{formatDateTime(r.startTime)}</div>
                      <div className="whitespace-nowrap text-zinc-500">→ {formatDateTime(r.endTime)}</div>
                    </td>
                    <td className="max-w-md px-4 py-3 text-zinc-400">
                      {r.reason?.trim() ? (
                        <span className="whitespace-pre-wrap">{r.reason}</span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </FleetLayout>
  );
}
