import { useState, useMemo } from 'react';
import useSWR from 'swr';
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
import {
  getAdminExceptionQueue,
  getExceptionById,
  resolveException,
  escalateException,
  addExceptionAction,
  type DeliveryException,
  type DeliveryExceptionStatus,
  type DeliveryExceptionSeverity,
} from '../../lib/api/delivery-exceptions';
import { toast } from 'react-hot-toast';
import { RefreshCw, AlertTriangle } from 'lucide-react';

const STATUS_FILTERS: Array<'ALL' | DeliveryExceptionStatus> = ['ALL', 'OPEN', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED'];
const STATUS_LABEL: Record<DeliveryExceptionStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  ESCALATED: 'Escalated',
  RESOLVED: 'Resolved',
};
const SEVERITY_LABEL: Record<DeliveryExceptionSeverity, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};
const TYPE_LABEL: Record<string, string> = {
  CUSTOMER_UNREACHABLE: 'Customer unreachable',
  ADDRESS_ISSUE: 'Address issue',
  REFUSED: 'Refused',
  ACCIDENT: 'Accident',
  VEHICLE_ISSUE: 'Vehicle issue',
  OTHER: 'Other',
};

const fetcherQueue = (status?: 'ALL' | DeliveryExceptionStatus, severity?: DeliveryExceptionSeverity) => () =>
  getAdminExceptionQueue({
    status: status === 'ALL' ? undefined : status,
    severity,
  });
const fetcherDetail = (id: string | null) => () => (id ? getExceptionById(id) : null);

export default function AdminDeliveryExceptions() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | DeliveryExceptionStatus>('OPEN');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | DeliveryExceptionSeverity>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');
  const [escalateTo, setEscalateTo] = useState('SUPPORT');
  const [escalateReason, setEscalateReason] = useState('');
  const [actionNote, setActionNote] = useState('');

  const { data: listData, isLoading, mutate } = useSWR(
    ['delivery-exceptions-admin', statusFilter, severityFilter],
    fetcherQueue(statusFilter, severityFilter === 'ALL' ? undefined : severityFilter),
    { refreshInterval: 20000 }
  );
  const list = Array.isArray(listData) ? listData : [];
  const { data: detail, mutate: mutateDetail } = useSWR(
    ['delivery-exception', selectedId],
    fetcherDetail(selectedId)
  );

  const filterCounts = useMemo(() => ({
    ALL: list.length,
    OPEN: list.filter((e) => e.status === 'OPEN').length,
    IN_PROGRESS: list.filter((e) => e.status === 'IN_PROGRESS').length,
    ESCALATED: list.filter((e) => e.status === 'ESCALATED').length,
    RESOLVED: list.filter((e) => e.status === 'RESOLVED').length,
  }), [list]);

  const openCount = list.filter((e) => e.status === 'OPEN').length;
  const escalatedCount = list.filter((e) => e.status === 'ESCALATED').length;
  const resolvedCount = list.filter((e) => e.status === 'RESOLVED').length;

  const handleResolve = async () => {
    if (!selectedId) return;
    try {
      await resolveException(selectedId, { resolution: resolution.trim() || undefined });
      toast.success('Exception resolved');
      setSelectedId(null);
      setResolution('');
      mutate();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to resolve');
    }
  };

  const handleEscalate = async () => {
    if (!selectedId) return;
    try {
      await escalateException(selectedId, { toLevel: escalateTo, reason: escalateReason.trim() || undefined });
      toast.success('Escalated');
      setEscalateReason('');
      mutateDetail();
      mutate();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to escalate');
    }
  };

  const handleAddAction = async () => {
    if (!selectedId || !actionNote.trim()) return;
    try {
      await addExceptionAction(selectedId, { actionType: 'NOTE', payload: { note: actionNote.trim() } });
      toast.success('Action added');
      setActionNote('');
      mutateDetail();
      mutate();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to add action');
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Delivery exceptions"
            tag="Logistics"
            subtitle="Triage delivery issues reported by riders or sellers. Add notes, escalate, or mark resolved."
          />

          <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminCard
              title="Open"
              description="Awaiting triage."
              onClick={() => setStatusFilter('OPEN')}
              pulseBorder={openCount > 0}
            >
              <p className="text-3xl font-semibold text-amber-400">{openCount}</p>
            </AdminCard>
            <AdminCard
              title="In progress"
              description="Being worked on."
              onClick={() => setStatusFilter('IN_PROGRESS')}
            >
              <p className="text-3xl font-semibold text-[#76e4f7]">{list.filter((e) => e.status === 'IN_PROGRESS').length}</p>
            </AdminCard>
            <AdminCard
              title="Escalated"
              description="Needs higher support."
              onClick={() => setStatusFilter('ESCALATED')}
              accent={escalatedCount > 0 ? 'red' : undefined}
            >
              <p className="text-3xl font-semibold text-red-400">{escalatedCount}</p>
            </AdminCard>
            <AdminCard
              title="Resolved"
              description="Closed today."
              onClick={() => setStatusFilter('RESOLVED')}
            >
              <p className="text-3xl font-semibold text-[#6ce7a2]">{resolvedCount}</p>
            </AdminCard>
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
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Severity
                </span>
                {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((s) => (
                  <AdminFilterChip
                    key={s}
                    active={severityFilter === s}
                    onClick={() => setSeverityFilter(s)}
                  >
                    {s === 'ALL' ? 'All' : SEVERITY_LABEL[s]}
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
              <LoadingState label="Loading exceptions…" />
            ) : list.length === 0 ? (
              <AdminEmptyState
                icon={<AlertTriangle className="h-5 w-5" />}
                title="No delivery exceptions"
                description="Exceptions reported by riders or sellers will appear here."
              />
            ) : (
              <DataTableContainer>
                <DataTable>
                  <DataTableHead>
                    <DataTableCell>Type</DataTableCell>
                    <DataTableCell>Delivery / Order</DataTableCell>
                    <DataTableCell>Severity</DataTableCell>
                    <DataTableCell>Status</DataTableCell>
                    <DataTableCell>Reported</DataTableCell>
                    <DataTableCell>SLA due</DataTableCell>
                    <DataTableCell></DataTableCell>
                  </DataTableHead>
                  <DataTableBody>
                    {list.map((ex) => (
                      <tr key={ex.id} className="border-b border-[#1f1f1f] hover:bg-[#151515]/50">
                        <DataTableCell className="text-gray-300">{TYPE_LABEL[ex.type] ?? ex.type}</DataTableCell>
                        <DataTableCell className="font-mono text-xs text-gray-300">
                          {ex.deliveryId?.slice(0, 8)}… / {ex.delivery?.orderId?.slice(0, 8)}…
                        </DataTableCell>
                        <DataTableCell>
                          <StatusBadge tone={ex.severity === 'HIGH' ? 'danger' : ex.severity === 'MEDIUM' ? 'warning' : 'neutral'} label={SEVERITY_LABEL[ex.severity]} />
                        </DataTableCell>
                        <DataTableCell>
                          <StatusBadge tone={ex.status === 'RESOLVED' ? 'success' : ex.status === 'ESCALATED' ? 'warning' : 'neutral'} label={STATUS_LABEL[ex.status] ?? ex.status} />
                        </DataTableCell>
                        <DataTableCell className="text-sm text-gray-500">
                          {ex.reporter?.name ?? ex.reportedBy?.slice(0, 8)} · {ex.reportedAt ? new Date(ex.reportedAt).toLocaleString() : '—'}
                        </DataTableCell>
                        <DataTableCell className="text-sm text-gray-500">
                          {ex.slaDueAt ? new Date(ex.slaDueAt).toLocaleString() : '—'}
                        </DataTableCell>
                        <DataTableCell>
                          <button
                            type="button"
                            onClick={() => setSelectedId(ex.id)}
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
      <AdminDrawer open={!!selectedId} onClose={() => setSelectedId(null)} title="Delivery exception">
        {detail ? (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Type / Severity</span>
              <p className="mt-1 text-white">
                {TYPE_LABEL[detail.type] ?? detail.type} · {SEVERITY_LABEL[detail.severity]}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Status</span>
              <p className="mt-1">
                <StatusBadge tone={detail.status === 'RESOLVED' ? 'success' : detail.status === 'ESCALATED' ? 'warning' : 'neutral'} label={STATUS_LABEL[detail.status] ?? detail.status} />
              </p>
            </div>
            {detail.description && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Description</span>
                <p className="mt-1 text-sm text-gray-300">{detail.description}</p>
              </div>
            )}
            <div className="text-sm text-gray-500">
              Delivery {detail.deliveryId} · Order {detail.delivery?.orderId} · Reported by {detail.reporter?.name ?? detail.reportedBy} at{' '}
              {detail.reportedAt ? new Date(detail.reportedAt).toLocaleString() : '—'}
            </div>
            {Array.isArray(detail.actions) && detail.actions.length > 0 && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Actions</span>
                <ul className="mt-2 list-inside list-disc text-sm space-y-1 text-gray-300">
                  {detail.actions.map((a) => (
                    <li key={a.id}>
                      {a.actionType} by {a.actorType} at {new Date(a.createdAt).toLocaleString()}
                      {a.payload && typeof a.payload === 'object' && 'note' in a.payload
                        ? <span className="text-gray-500"> — {String((a.payload as { note: unknown }).note ?? '')}</span>
                        : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {detail.status !== 'RESOLVED' && (
              <>
                <div className="border-t border-[#1f1f1f] pt-4">
                  <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 mb-2">Add note</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      placeholder="Note..."
                      className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddAction}
                      disabled={!actionNote.trim()}
                      className="rounded-full border border-[#2a2a2a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div className="border-t border-[#1f1f1f] pt-4">
                  <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 mb-2">Escalate to</label>
                  <div className="flex gap-2 flex-wrap">
                    <input
                      type="text"
                      value={escalateTo}
                      onChange={(e) => setEscalateTo(e.target.value)}
                      className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white w-32 focus:border-primary focus:outline-none"
                    />
                    <input
                      type="text"
                      value={escalateReason}
                      onChange={(e) => setEscalateReason(e.target.value)}
                      placeholder="Reason (optional)"
                      className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white placeholder-gray-500 min-w-[120px] focus:border-primary focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleEscalate}
                      className="rounded-full border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-400 transition hover:bg-amber-500/20"
                    >
                      Escalate
                    </button>
                  </div>
                </div>
                <div className="border-t border-[#1f1f1f] pt-4">
                  <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 mb-2">Resolution</label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Resolution notes..."
                    rows={2}
                    className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleResolve}
                    className="mt-2 rounded-full bg-[#6ce7a2]/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6ce7a2] transition hover:bg-[#6ce7a2]/30"
                  >
                    Mark resolved
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <LoadingState label="Loading…" />
        )}
      </AdminDrawer>
    </AdminLayout>
  );
}
