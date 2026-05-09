import { useRouter } from 'next/router';
import Head from 'next/head';
import useSWR from 'swr';
import AdminLayout from '../../../components/admin/AdminLayout';
import {
  AdminCard,
  AdminPageHeader,
  LoadingState,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableContainer,
  DataTableHead,
} from '../../../components/admin/ui';
import {
  fetchAdminFleetOperatorDetail,
  adminAssignRiderToFleet,
  adminApproveFleetPayout,
  adminProcessFleetPayout,
  adminRejectFleetPayout,
} from '../../../lib/admin/api';
import { formatNgnFromKobo } from '../../../lib/api/utils';
import { toast } from 'react-hot-toast';
import { useState, type FormEvent } from 'react';

export default function AdminFleetDetailPage() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const [riderId, setRiderId] = useState('');
  const [acting, setActing] = useState<string | null>(null);

  const { data, isLoading, mutate } = useSWR(
    id ? ['admin-fleet-detail', id] : null,
    () => fetchAdminFleetOperatorDetail(id),
  );

  const detail = data as Record<string, unknown> | undefined;
  const stats = detail?.stats as Record<string, number> | undefined;
  const riders = (detail?.riders as Record<string, unknown>[]) ?? [];
  const payoutRequests =
    (detail?.payoutRequests as Record<string, unknown>[]) ?? [];

  const attachRider = async (e: FormEvent) => {
    e.preventDefault();
    const rid = riderId.trim();
    if (!rid) {
      toast.error('Enter rider user UUID');
      return;
    }
    try {
      await adminAssignRiderToFleet(id, rid);
      toast.success('Rider attached to fleet');
      setRiderId('');
      mutate();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed';
      toast.error(typeof msg === 'string' ? msg : 'Failed');
    }
  };

  const runPayoutAction = async (
    payoutId: string,
    action: 'approve' | 'process' | 'reject',
  ) => {
    setActing(payoutId + action);
    try {
      if (action === 'approve') await adminApproveFleetPayout(payoutId);
      else if (action === 'process') await adminProcessFleetPayout(payoutId);
      else await adminRejectFleetPayout(payoutId);
      toast.success('Updated');
      mutate();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Action failed';
      toast.error(typeof msg === 'string' ? msg : 'Action failed');
    } finally {
      setActing(null);
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Fleet detail · Admin</title>
      </Head>
      <div className="admin-page-shell max-w-7xl space-y-6">
          <AdminPageHeader
            title={(detail?.name as string) ?? 'Fleet'}
            tag="Fleet"
            subtitle="Riders, pooled earnings, payout requests."
          />

          {isLoading || !detail ? (
            <LoadingState label="Loading…" />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <AdminCard className="p-4">
                  <p className="text-xs uppercase text-zinc-500">Pending pool</p>
                  <p className="mt-2 text-xl font-semibold text-amber-400">
                    {formatNgnFromKobo(stats?.pendingPoolKobo ?? 0)}
                  </p>
                </AdminCard>
                <AdminCard className="p-4">
                  <p className="text-xs uppercase text-zinc-500">Total earnings</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {formatNgnFromKobo(stats?.totalEarningsKobo ?? 0)}
                  </p>
                </AdminCard>
                <AdminCard className="p-4">
                  <p className="text-xs uppercase text-zinc-500">Paid out</p>
                  <p className="mt-2 text-xl font-semibold text-emerald-400">
                    {formatNgnFromKobo(stats?.paidOutKobo ?? 0)}
                  </p>
                </AdminCard>
              </div>

              <AdminCard title="Assign rider to fleet">
                <form onSubmit={attachRider} className="flex flex-wrap items-end gap-2">
                  <input
                    value={riderId}
                    onChange={(e) => setRiderId(e.target.value)}
                    placeholder="Rider user UUID"
                    className="min-w-[280px] flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black"
                  >
                    Attach rider
                  </button>
                </form>
              </AdminCard>

              <AdminCard title="Fleet riders">
                <DataTableContainer>
                  <DataTable>
                    <DataTableHead>
                      <tr>
                        <DataTableCell>Name</DataTableCell>
                        <DataTableCell>Email</DataTableCell>
                        <DataTableCell>Phone</DataTableCell>
                      </tr>
                    </DataTableHead>
                    <DataTableBody>
                      {riders.map((rp) => {
                        const u = rp.user as Record<string, string> | undefined;
                        return (
                          <tr key={String(rp.id)} className="border-t border-zinc-800">
                            <DataTableCell>{u?.name}</DataTableCell>
                            <DataTableCell>{u?.email}</DataTableCell>
                            <DataTableCell>{u?.phone ?? '—'}</DataTableCell>
                          </tr>
                        );
                      })}
                    </DataTableBody>
                  </DataTable>
                </DataTableContainer>
                {riders.length === 0 && (
                  <p className="py-4 text-center text-zinc-500">No riders yet.</p>
                )}
              </AdminCard>

              <AdminCard title="Payout requests">
                <DataTableContainer>
                  <DataTable>
                    <DataTableHead>
                      <tr>
                        <DataTableCell>Amount</DataTableCell>
                        <DataTableCell>Status</DataTableCell>
                        <DataTableCell>Created</DataTableCell>
                        <DataTableCell className="text-right">Actions</DataTableCell>
                      </tr>
                    </DataTableHead>
                    <DataTableBody>
                      {payoutRequests.map((p) => {
                        const pid = String(p.id);
                        const st = String(p.status);
                        return (
                          <tr key={pid} className="border-t border-zinc-800">
                            <DataTableCell>
                              {formatNgnFromKobo(Number(p.totalAmountKobo ?? 0))}
                            </DataTableCell>
                            <DataTableCell>{st}</DataTableCell>
                            <DataTableCell className="text-zinc-400">
                              {p.createdAt
                                ? new Date(String(p.createdAt)).toLocaleString()
                                : '—'}
                            </DataTableCell>
                            <DataTableCell className="text-right space-x-2">
                              {st === 'REQUESTED' && (
                                <>
                                  <button
                                    type="button"
                                    disabled={!!acting}
                                    onClick={() => runPayoutAction(pid, 'approve')}
                                    className="text-sm text-emerald-500"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!!acting}
                                    onClick={() => runPayoutAction(pid, 'reject')}
                                    className="text-sm text-red-400"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {st === 'APPROVED' && (
                                <button
                                  type="button"
                                  disabled={!!acting}
                                  onClick={() => runPayoutAction(pid, 'process')}
                                  className="text-sm text-amber-500"
                                >
                                  Pay (Paystack)
                                </button>
                              )}
                            </DataTableCell>
                          </tr>
                        );
                      })}
                    </DataTableBody>
                  </DataTable>
                </DataTableContainer>
                {payoutRequests.length === 0 && (
                  <p className="py-4 text-center text-zinc-500">No payout requests.</p>
                )}
              </AdminCard>
            </>
          )}
        </div>
    </AdminLayout>
  );
}
