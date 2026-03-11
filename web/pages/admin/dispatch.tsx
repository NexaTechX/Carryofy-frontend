import { useState } from 'react';
import useSWR from 'swr';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  AdminCard,
  AdminDrawer,
  AdminEmptyState,
  AdminPageHeader,
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
import { RefreshCw, Play, Truck } from 'lucide-react';

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

  const params = statusFilter === 'ALL' ? undefined : statusFilter;
  const { data: jobs = [], isLoading, mutate } = useSWR(
    ['dispatch-jobs', params],
    fetcherJobs(params),
    { refreshInterval: 15000 }
  );
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

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Dispatch"
        subtitle="Auto-dispatch jobs and rider assignment attempts. Trigger auto-dispatch for a delivery or review job history."
      />
      <AdminCard className="mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Delivery ID (trigger auto-dispatch)</span>
            <input
              type="text"
              value={triggerDeliveryId}
              onChange={(e) => setTriggerDeliveryId(e.target.value)}
              placeholder="e.g. uuid"
              className="rounded border border-gray-300 px-3 py-2 text-sm w-64"
            />
          </label>
          <button
            type="button"
            onClick={handleTrigger}
            disabled={triggering}
            className="inline-flex items-center gap-2 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            {triggering ? 'Triggering…' : 'Trigger'}
          </button>
        </div>
      </AdminCard>
      <AdminCard>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-sm ${statusFilter === s ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {s === 'ALL' ? 'All' : STATUS_LABEL[s]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => mutate()}
            className="ml-auto rounded p-1.5 text-gray-500 hover:bg-gray-100"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
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
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <DataTableCell className="font-mono text-xs">{j.id.slice(0, 8)}…</DataTableCell>
                    <DataTableCell className="font-mono text-xs">{j.deliveryId?.slice(0, 8)}…</DataTableCell>
                    <DataTableCell className="font-mono text-xs">{j.delivery?.orderId?.slice(0, 8)}…</DataTableCell>
                    <DataTableCell>
                      <StatusBadge tone={j.status === 'ASSIGNED' ? 'success' : j.status === 'NEEDS_MANUAL' ? 'warning' : 'neutral'} label={STATUS_LABEL[j.status as DispatchJobStatus]} />
                    </DataTableCell>
                    <DataTableCell>{j.delivery?.rider?.name ?? '—'}</DataTableCell>
                    <DataTableCell className="text-gray-500 text-sm">
                      {j.createdAt ? new Date(j.createdAt).toLocaleString() : '—'}
                    </DataTableCell>
                    <DataTableCell>
                      <button
                        type="button"
                        onClick={() => setSelectedId(j.id)}
                        className="text-indigo-600 hover:underline text-sm"
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
      <AdminDrawer
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        title="Dispatch job"
      >
        {jobDetail ? (
          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-500">Status</span>
              <p><StatusBadge tone={jobDetail.status === 'ASSIGNED' ? 'success' : jobDetail.status === 'NEEDS_MANUAL' ? 'warning' : 'neutral'} label={STATUS_LABEL[jobDetail.status as DispatchJobStatus]} /></p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Delivery ID</span>
              <p className="font-mono text-sm">{jobDetail.deliveryId}</p>
            </div>
            {jobDetail.delivery?.orderId && (
              <div>
                <span className="text-sm text-gray-500">Order ID</span>
                <p className="font-mono text-sm">{jobDetail.delivery.orderId}</p>
              </div>
            )}
            {jobDetail.attempts && jobDetail.attempts.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-700">Attempts</span>
                <ul className="mt-1 list-inside list-disc text-sm space-y-1">
                  {jobDetail.attempts.map((a) => (
                    <li key={a.id}>
                      {a.rider?.name ?? a.riderId} — {a.status} {a.respondedAt ? `at ${new Date(a.respondedAt).toLocaleString()}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {jobDetail.decisionLogs && jobDetail.decisionLogs.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-700">Decision log</span>
                <ul className="mt-1 text-sm space-y-2">
                  {jobDetail.decisionLogs.map((log) => (
                    <li key={log.id} className="border-l-2 border-gray-200 pl-2">
                      <span className="font-medium">{log.decisionType}</span>
                      {log.chosenRiderId && <span> → {log.chosenRiderId.slice(0, 8)}…</span>}
                      {log.reason && <span className="text-gray-500"> — {log.reason}</span>}
                      <span className="text-gray-400 text-xs ml-1">{new Date(log.createdAt).toLocaleString()}</span>
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
