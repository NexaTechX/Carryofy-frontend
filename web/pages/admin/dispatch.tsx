import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  AdminCard,
  AdminDrawer,
  AdminEmptyState,
  AdminPageHeader,
  AdminToolbar,
  AdminFilterChip,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableContainer,
  DataTableHead,
  LoadingState,
  StatusBadge,
} from '../../components/admin/ui';
import { getDispatchJobs, getDispatchJobById, triggerAutoDispatch, type DispatchJob, type DispatchJobStatus } from '../../lib/api/dispatch';
import { toast } from 'react-hot-toast';
import { RefreshCw, Play, Truck, ChevronDown, ChevronUp, Zap } from 'lucide-react';

const STATUS_FILTERS: Array<'ALL' | DispatchJobStatus> = ['ALL', 'PENDING', 'ASSIGNED', 'NEEDS_MANUAL', 'CANCELLED'];
const STATUS_LABEL: Record<DispatchJobStatus, string> = {
  PENDING: 'Pending',
  ASSIGNED: 'Assigned',
  NEEDS_MANUAL: 'Needs manual',
  CANCELLED: 'Cancelled',
};

const fetcherJobs = (status?: string) => () => getDispatchJobs({ status: status === 'ALL' ? undefined : status });
const fetcherJob = (id: string | null) => () => (id ? getDispatchJobById(id) : null);

export default function AdminDispatch() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | DispatchJobStatus>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [triggerDeliveryId, setTriggerDeliveryId] = useState('');
  const [triggering, setTriggering] = useState(false);
  const [showRetrySection, setShowRetrySection] = useState(false);

  const params = statusFilter === 'ALL' ? undefined : statusFilter;
  const { data: jobsData, isLoading, mutate } = useSWR(
    ['dispatch-jobs', params],
    fetcherJobs(params),
    { refreshInterval: 15000 }
  );
  const jobs = Array.isArray(jobsData) ? jobsData : [];
  const { data: jobDetail, mutate: mutateDetail } = useSWR(
    ['dispatch-job', selectedId],
    fetcherJob(selectedId)
  );

  const handleTrigger = async () => {
    const id = triggerDeliveryId.trim();
    if (!id) {
      toast.error('Enter a delivery ID');
      return;
    }
    setTriggering(true);
    try {
      const result = await triggerAutoDispatch(id);
      toast.success(result.assigned ? 'Rider auto-assigned' : 'No rider assigned (needs manual or already assigned)');
      setTriggerDeliveryId('');
      mutate();
      if (result.jobId) setSelectedId(result.jobId);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Trigger failed');
    } finally {
      setTriggering(false);
    }
  };

  const filterCounts = {
    ALL: jobs.length,
    PENDING: jobs.filter((j) => j.status === 'PENDING').length,
    ASSIGNED: jobs.filter((j) => j.status === 'ASSIGNED').length,
    NEEDS_MANUAL: jobs.filter((j) => j.status === 'NEEDS_MANUAL').length,
    CANCELLED: jobs.filter((j) => j.status === 'CANCELLED').length,
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Dispatch"
            tag="Logistics"
            subtitle="Automatic rider assignment. When a delivery is created, the system tries to assign the nearest available rider. Review job history and retry assignment when needed."
          />

          <section className="mb-8 rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6">
            <button
              type="button"
              onClick={() => setShowRetrySection(!showRetrySection)}
              className="flex w-full items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Retry auto-dispatch</h2>
                  <p className="text-sm text-gray-400">
                    Manually trigger rider assignment for a delivery that has no rider yet
                  </p>
                </div>
              </div>
              {showRetrySection ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
            {showRetrySection && (
              <div className="mt-6 flex flex-wrap items-end gap-4 border-t border-[#1f1f1f] pt-6">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                    Delivery ID
                  </label>
                  <input
                    type="text"
                    value={triggerDeliveryId}
                    onChange={(e) => setTriggerDeliveryId(e.target.value)}
                    placeholder="Paste delivery ID from Deliveries page"
                    className="w-72 rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTrigger}
                  disabled={triggering}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  {triggering ? 'Triggering…' : 'Retry'}
                </button>
                <Link
                  href="/admin/deliveries"
                  className="text-sm font-medium text-primary hover:text-primary-light"
                >
                  Or assign rider manually in Deliveries →
                </Link>
              </div>
            )}
          </section>

          <AdminCard>
            <AdminToolbar className="mb-6 flex flex-wrap items-center gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Status
                </span>
                {STATUS_FILTERS.map((s) => (
                  <AdminFilterChip
                    key={s}
                    active={statusFilter === s}
                    count={filterCounts[s]}
                    onClick={() => setStatusFilter(s)}
                  >
                    {s === 'ALL' ? 'All' : STATUS_LABEL[s]}
                  </AdminFilterChip>
                ))}
              </div>
              <button
                type="button"
                onClick={() => mutate()}
                className="ml-auto rounded-full border border-[#2a2a2a] p-2 text-gray-400 transition hover:border-primary hover:text-primary"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </AdminToolbar>
            {isLoading ? (
              <LoadingState label="Loading dispatch jobs…" />
            ) : jobs.length === 0 ? (
              <AdminEmptyState
                icon={<Truck className="h-5 w-5" />}
                title="No dispatch jobs"
                description="Jobs are created when a delivery is created (e.g. after payment) and auto-dispatch runs."
              />
            ) : (
              <DataTableContainer>
                <DataTable>
                  <DataTableHead>
                    <DataTableCell>Job ID</DataTableCell>
                    <DataTableCell>Delivery</DataTableCell>
                    <DataTableCell>Order</DataTableCell>
                    <DataTableCell>Status</DataTableCell>
                    <DataTableCell>Rider</DataTableCell>
                    <DataTableCell>Created</DataTableCell>
                    <DataTableCell></DataTableCell>
                  </DataTableHead>
                  <DataTableBody>
                    {jobs.map((j) => (
                      <tr
                        key={j.id}
                        className="border-b border-[#1f1f1f] hover:bg-[#151515]/50"
                      >
                        <DataTableCell className="font-mono text-xs text-gray-300">{j.id.slice(0, 8)}…</DataTableCell>
                        <DataTableCell className="font-mono text-xs text-gray-300">{j.deliveryId?.slice(0, 8)}…</DataTableCell>
                        <DataTableCell className="font-mono text-xs text-gray-300">{j.delivery?.orderId?.slice(0, 8)}…</DataTableCell>
                        <DataTableCell>
                          <StatusBadge tone={j.status === 'ASSIGNED' ? 'success' : j.status === 'NEEDS_MANUAL' ? 'warning' : 'neutral'} label={STATUS_LABEL[j.status as DispatchJobStatus]} />
                        </DataTableCell>
                        <DataTableCell className="text-gray-300">{j.delivery?.rider?.name ?? '—'}</DataTableCell>
                        <DataTableCell className="text-gray-500 text-sm">
                          {j.createdAt ? new Date(j.createdAt).toLocaleString() : '—'}
                        </DataTableCell>
                        <DataTableCell>
                          <button
                            type="button"
                            onClick={() => setSelectedId(j.id)}
                            className="text-primary hover:text-primary-light hover:underline text-sm font-medium"
                          >
                            View
                          </button>
                        </DataTableCell>
                      </tr>
                    ))}
                  </DataTableBody>
                </DataTable>
              </DataTableContainer>
            )}
          </AdminCard>
        </div>
      </div>
      <AdminDrawer
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        title="Dispatch job"
      >
        {jobDetail ? (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Status</span>
              <p className="mt-1"><StatusBadge tone={jobDetail.status === 'ASSIGNED' ? 'success' : jobDetail.status === 'NEEDS_MANUAL' ? 'warning' : 'neutral'} label={STATUS_LABEL[jobDetail.status as DispatchJobStatus]} /></p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Delivery ID</span>
              <p className="mt-1 font-mono text-sm text-white">{jobDetail.deliveryId}</p>
            </div>
            {jobDetail.delivery?.orderId && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Order ID</span>
                <p className="mt-1 font-mono text-sm text-white">{jobDetail.delivery.orderId}</p>
              </div>
            )}
            {Array.isArray(jobDetail.attempts) && jobDetail.attempts.length > 0 && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Attempts</span>
                <ul className="mt-2 list-inside list-disc text-sm space-y-1 text-gray-300">
                  {jobDetail.attempts.map((a) => (
                    <li key={a.id}>
                      {a.rider?.name ?? a.riderId} — {a.status} {a.respondedAt ? `at ${new Date(a.respondedAt).toLocaleString()}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray(jobDetail.decisionLogs) && jobDetail.decisionLogs.length > 0 && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Decision log</span>
                <ul className="mt-2 text-sm space-y-2">
                  {jobDetail.decisionLogs.map((log) => (
                    <li key={log.id} className="border-l-2 border-[#2a2a2a] pl-3 text-gray-300">
                      <span className="font-medium text-white">{log.decisionType}</span>
                      {log.chosenRiderId && <span> → {log.chosenRiderId.slice(0, 8)}…</span>}
                      {log.reason && <span className="text-gray-500"> — {log.reason}</span>}
                      <span className="text-gray-500 text-xs ml-1">{new Date(log.createdAt).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <LoadingState label="Loading job…" />
        )}
      </AdminDrawer>
    </AdminLayout>
  );
}
