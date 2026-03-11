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

  const { data: list = [], isLoading, mutate } = useSWR(
    ['delivery-exceptions-admin', statusFilter, severityFilter],
    fetcherQueue(statusFilter, severityFilter === 'ALL' ? undefined : severityFilter),
    { refreshInterval: 20000 }
  );
  const { data: detail, mutate: mutateDetail } = useSWR(
    ['delivery-exception', selectedId],
    fetcherDetail(selectedId)
  );

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
      <AdminPageHeader
        title="Delivery exceptions"
        subtitle="Queue of delivery issues reported by riders or sellers. Triage by status and severity, add actions, escalate or resolve."
      />
      <AdminCard>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">Status:</span>
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
          <span className="ml-4 text-sm text-gray-500">Severity:</span>
          {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeverityFilter(s)}
              className={`rounded-full px-3 py-1 text-sm ${severityFilter === s ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {s === 'ALL' ? 'All' : SEVERITY_LABEL[s]}
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
                  <tr key={ex.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <DataTableCell>{TYPE_LABEL[ex.type] ?? ex.type}</DataTableCell>
                    <DataTableCell className="font-mono text-xs">
                      {ex.deliveryId?.slice(0, 8)}… / {ex.delivery?.orderId?.slice(0, 8)}…
                    </DataTableCell>
                    <DataTableCell>
                      <StatusBadge tone={ex.severity === 'HIGH' ? 'danger' : ex.severity === 'MEDIUM' ? 'warning' : 'neutral'} label={SEVERITY_LABEL[ex.severity]} />
                    </DataTableCell>
                    <DataTableCell>
                      <StatusBadge tone={ex.status === 'RESOLVED' ? 'success' : ex.status === 'ESCALATED' ? 'warning' : 'neutral'} label={STATUS_LABEL[ex.status]} />
                    </DataTableCell>
                    <DataTableCell className="text-sm text-gray-600">
                      {ex.reporter?.name ?? ex.reportedBy?.slice(0, 8)} · {ex.reportedAt ? new Date(ex.reportedAt).toLocaleString() : '—'}
                    </DataTableCell>
                    <DataTableCell className="text-sm text-gray-600">
                      {ex.slaDueAt ? new Date(ex.slaDueAt).toLocaleString() : '—'}
                    </DataTableCell>
                    <DataTableCell>
                      <button
                        type="button"
                        onClick={() => setSelectedId(ex.id)}
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
      <AdminDrawer open={!!selectedId} onClose={() => setSelectedId(null)} title="Delivery exception">
        {detail ? (
          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-500">Type / Severity</span>
              <p>
                {TYPE_LABEL[detail.type] ?? detail.type} · {SEVERITY_LABEL[detail.severity]}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Status</span>
              <p>
                <StatusBadge tone={detail.status === 'RESOLVED' ? 'success' : 'neutral'} label={STATUS_LABEL[detail.status]} />
              </p>
            </div>
            {detail.description && (
              <div>
                <span className="text-sm text-gray-500">Description</span>
                <p className="text-sm">{detail.description}</p>
              </div>
            )}
            <div className="text-sm text-gray-500">
              Delivery {detail.deliveryId} · Order {detail.delivery?.orderId} · Reported by {detail.reporter?.name ?? detail.reportedBy} at{' '}
              {detail.reportedAt ? new Date(detail.reportedAt).toLocaleString() : '—'}
            </div>
            {detail.actions && detail.actions.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-700">Actions</span>
                <ul className="mt-1 text-sm space-y-1">
                  {detail.actions.map((a) => (
                    <li key={a.id}>
                      {a.actionType} by {a.actorType} at {new Date(a.createdAt).toLocaleString()}
                      {a.payload && typeof a.payload === 'object' && 'note' in a.payload
                        ? <span className="text-gray-600"> — {String((a.payload as { note: unknown }).note ?? '')}</span>
                        : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {detail.status !== 'RESOLVED' && (
              <>
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Add note (action)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      placeholder="Note..."
                      className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddAction}
                      disabled={!actionNote.trim()}
                      className="rounded bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Escalate to</label>
                  <div className="flex gap-2 flex-wrap">
                    <input
                      type="text"
                      value={escalateTo}
                      onChange={(e) => setEscalateTo(e.target.value)}
                      className="rounded border border-gray-300 px-3 py-2 text-sm w-32"
                    />
                    <input
                      type="text"
                      value={escalateReason}
                      onChange={(e) => setEscalateReason(e.target.value)}
                      placeholder="Reason (optional)"
                      className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm min-w-[120px]"
                    />
                    <button type="button" onClick={handleEscalate} className="rounded bg-amber-100 px-3 py-2 text-sm hover:bg-amber-200">
                      Escalate
                    </button>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resolution (admin)</label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Resolution notes..."
                    rows={2}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleResolve}
                    className="mt-2 rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
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
