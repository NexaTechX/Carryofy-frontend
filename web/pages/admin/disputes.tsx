import { useState } from 'react';
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
  useAdminDisputeQueue,
  useDisputeDetail,
  useAdminUpdateDispute,
  useAddDisputeMessage,
} from '../../lib/admin/hooks/useDisputes';
import type { DisputeStatus as DisputeStatusType } from '../../lib/api/disputes';
import { getStatusTone } from '../../lib/admin/statusTones';

const STATUS_FILTERS: Array<'ALL' | DisputeStatusType> = [
  'ALL',
  'OPEN',
  'UNDER_REVIEW',
  'WAITING_FOR_RESPONSE',
  'RESOLVED',
  'ESCALATED',
];

const STATUS_LABEL: Record<DisputeStatusType, string> = {
  OPEN: 'Open',
  UNDER_REVIEW: 'Under Review',
  WAITING_FOR_RESPONSE: 'Waiting for Response',
  RESOLVED: 'Resolved',
  ESCALATED: 'Escalated',
};

export default function AdminDisputes() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | DisputeStatusType>('OPEN');
  const [slaBreachRisk, setSlaBreachRisk] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resolutionOutcome, setResolutionOutcome] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [messageInternal, setMessageInternal] = useState(false);

  const params = {
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    slaBreachRisk: slaBreachRisk || undefined,
  };
  const { data: disputes = [], isLoading, isError, error, refetch } = useAdminDisputeQueue(params);
  const { data: detail, refetch: refetchDetail } = useDisputeDetail(selectedId);
  const updateDispute = useAdminUpdateDispute();
  const addMessage = useAddDisputeMessage(selectedId);

  const openDrawer = (id: string) => {
    setSelectedId(id);
    setResolutionOutcome('');
    setResolutionNotes('');
    setMessageBody('');
    setMessageInternal(false);
  };

  const handleResolve = () => {
    if (!selectedId) return;
    updateDispute.mutate(
      {
        disputeId: selectedId,
        payload: {
          status: 'RESOLVED',
          resolutionOutcome: resolutionOutcome || undefined,
          resolutionNotes: resolutionNotes || undefined,
        },
      },
      {
        onSuccess: () => {
          setSelectedId(null);
        },
      }
    );
  };

  const handleStatusChange = (status: DisputeStatusType) => {
    if (!selectedId) return;
    updateDispute.mutate(
      { disputeId: selectedId, payload: { status } },
      { onSuccess: () => refetchDetail() }
    );
  };

  const handleSendMessage = () => {
    if (!selectedId || !messageBody.trim()) return;
    addMessage.mutate(
      { body: messageBody.trim(), isInternal: messageInternal },
      {
        onSuccess: () => {
          setMessageBody('');
          refetchDetail();
        },
      }
    );
  };

  const slaBreachedCount = disputes.filter(
    (d) => d.slaDueAt && new Date(d.slaDueAt) < new Date() && d.status !== 'RESOLVED'
  ).length;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Dispute Management"
            tag="Trust & Safety"
            subtitle="Mediate order disputes, review evidence, and resolve cases with SLA visibility."
          />

          <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminCard title="Open Disputes" description="Needs attention">
              <p className="text-3xl font-semibold text-white">
                {disputes.filter((d) => d.status === 'OPEN').length}
              </p>
            </AdminCard>
            <AdminCard title="Under Review" description="In progress">
              <p className="text-3xl font-semibold text-white">
                {disputes.filter((d) => d.status === 'UNDER_REVIEW').length}
              </p>
            </AdminCard>
            <AdminCard title="Resolved" description="Closed">
              <p className="text-3xl font-semibold text-green-500">
                {disputes.filter((d) => d.status === 'RESOLVED').length}
              </p>
            </AdminCard>
            <AdminCard title="SLA at risk" description="Past due">
              <p className="text-3xl font-semibold text-amber-400">{slaBreachedCount}</p>
            </AdminCard>
          </section>

          <AdminToolbar className="mb-4 flex-wrap gap-4 justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Status:
              </span>
              {STATUS_FILTERS.map((status) => (
                <AdminFilterChip
                  key={status}
                  active={statusFilter === status}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'ALL' ? 'All' : STATUS_LABEL[status]}
                </AdminFilterChip>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={slaBreachRisk}
                onChange={(e) => setSlaBreachRisk(e.target.checked)}
                className="rounded border-[#1f2432] bg-[#0e131d] text-amber-500 focus:ring-amber-500"
              />
              SLA breach risk only
            </label>
          </AdminToolbar>

          {isLoading ? (
            <LoadingState fullscreen />
          ) : isError ? (
            <AdminEmptyState
              title="Unable to load disputes"
              description={error instanceof Error ? error.message : 'Please try again.'}
              action={
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="rounded-full border border-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:bg-primary hover:text-black"
                >
                  Retry
                </button>
              }
            />
          ) : disputes.length === 0 ? (
            <AdminEmptyState
              title="No disputes found"
              description={
                slaBreachRisk
                  ? 'No disputes currently past SLA.'
                  : 'Change filters or wait for new disputes.'
              }
            />
          ) : (
            <DataTableContainer>
              <DataTable>
                <DataTableHead>
                  <DataTableCell>Dispute ID</DataTableCell>
                  <DataTableCell>Order ID</DataTableCell>
                  <DataTableCell>Initiator</DataTableCell>
                  <DataTableCell>Priority</DataTableCell>
                  <DataTableCell>Status</DataTableCell>
                  <DataTableCell>SLA due</DataTableCell>
                  <DataTableCell>Created</DataTableCell>
                  <DataTableCell>Actions</DataTableCell>
                </DataTableHead>
                <DataTableBody>
                  {disputes.map((d) => {
                    const slaPast = d.slaDueAt && new Date(d.slaDueAt) < new Date();
                    return (
                      <tr
                        key={d.id}
                        className="border-b border-[#1f2432] hover:bg-[#0e131d]/50 cursor-pointer"
                        onClick={() => openDrawer(d.id)}
                      >
                        <DataTableCell className="font-mono text-xs text-gray-400">
                          {d.id.slice(0, 8)}
                        </DataTableCell>
                        <DataTableCell className="font-mono text-xs">
                          {d.orderId.slice(0, 8)}
                        </DataTableCell>
                        <DataTableCell>{d.initiatorRole}</DataTableCell>
                        <DataTableCell>{d.priority}</DataTableCell>
                        <DataTableCell>
                          <StatusBadge tone={getStatusTone(d.status)} label={STATUS_LABEL[d.status]} />
                        </DataTableCell>
                        <DataTableCell>
                          {d.slaDueAt ? (
                            <span className={slaPast && d.status !== 'RESOLVED' ? 'text-amber-400' : ''}>
                              {new Date(d.slaDueAt).toLocaleString()}
                              {slaPast && d.status !== 'RESOLVED' ? ' (overdue)' : ''}
                            </span>
                          ) : (
                            '—'
                          )}
                        </DataTableCell>
                        <DataTableCell className="text-gray-400">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </DataTableCell>
                        <DataTableCell>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDrawer(d.id);
                            }}
                            className="text-primary hover:underline text-sm"
                          >
                            View
                          </button>
                        </DataTableCell>
                      </tr>
                    );
                  })}
                </DataTableBody>
              </DataTable>
            </DataTableContainer>
          )}
        </div>
      </div>

      <AdminDrawer
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        title={detail ? `Dispute ${detail.id.slice(0, 8)}` : 'Dispute'}
      >
        {selectedId && detail && (
          <div className="space-y-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Order</p>
              <p className="font-mono text-sm text-white">{detail.orderId}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Initiator</p>
              <p className="text-sm text-white">{detail.initiatorRole} ({detail.openedByUserId.slice(0, 8)})</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Reason</p>
              <p className="text-sm text-white whitespace-pre-wrap">{detail.reason}</p>
            </div>
            <div className="flex gap-2 items-center">
              <StatusBadge tone={getStatusTone(detail.status)} label={STATUS_LABEL[detail.status]} />
              <span className="text-gray-500">Priority: {detail.priority}</span>
              {detail.slaDueAt && (
                <span className={new Date(detail.slaDueAt) < new Date() ? 'text-amber-400' : 'text-gray-400'}>
                  SLA: {new Date(detail.slaDueAt).toLocaleString()}
                </span>
              )}
            </div>

            {detail.status !== 'RESOLVED' && (
              <>
                <div className="border-t border-[#1f2432] pt-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Update status</p>
                  <div className="flex flex-wrap gap-2">
                    {(['OPEN', 'UNDER_REVIEW', 'WAITING_FOR_RESPONSE', 'ESCALATED'] as const).map(
                      (s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleStatusChange(s)}
                          disabled={updateDispute.isPending || detail.status === s}
                          className="rounded border border-[#1f2432] bg-[#0e131d] px-3 py-1.5 text-xs text-white hover:bg-[#1f2432] disabled:opacity-50"
                        >
                          {STATUS_LABEL[s]}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="border-t border-[#1f2432] pt-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Resolve</p>
                  <input
                    type="text"
                    placeholder="Resolution outcome (e.g. REFUND_ISSUED)"
                    value={resolutionOutcome}
                    onChange={(e) => setResolutionOutcome(e.target.value)}
                    className="mb-2 w-full rounded border border-[#1f2432] bg-[#0e131d] px-3 py-2 text-sm text-white placeholder-gray-500"
                  />
                  <textarea
                    placeholder="Resolution notes"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={2}
                    className="mb-2 w-full rounded border border-[#1f2432] bg-[#0e131d] px-3 py-2 text-sm text-white placeholder-gray-500"
                  />
                  <button
                    type="button"
                    onClick={handleResolve}
                    disabled={updateDispute.isPending}
                    className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {updateDispute.isPending ? 'Resolving…' : 'Mark Resolved'}
                  </button>
                </div>

                <div className="border-t border-[#1f2432] pt-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Add message</p>
                  <textarea
                    placeholder="Message to parties (or internal note)"
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    rows={2}
                    className="mb-2 w-full rounded border border-[#1f2432] bg-[#0e131d] px-3 py-2 text-sm text-white placeholder-gray-500"
                  />
                  <label className="mb-2 flex items-center gap-2 text-sm text-gray-400">
                    <input
                      type="checkbox"
                      checked={messageInternal}
                      onChange={(e) => setMessageInternal(e.target.checked)}
                      className="rounded border-[#1f2432] bg-[#0e131d] text-primary"
                    />
                    Internal note (not visible to buyer/seller)
                  </label>
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={addMessage.isPending || !messageBody.trim()}
                    className="rounded border border-primary px-4 py-2 text-sm text-primary hover:bg-primary/10 disabled:opacity-50"
                  >
                    {addMessage.isPending ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </>
            )}

            {detail.resolutionOutcome && (
              <div className="border-t border-[#1f2432] pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Resolution</p>
                <p className="text-sm text-white">{detail.resolutionOutcome}</p>
                {detail.resolutionNotes && (
                  <p className="text-sm text-gray-400 mt-1">{detail.resolutionNotes}</p>
                )}
                {detail.resolvedAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    Resolved {new Date(detail.resolvedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {detail.evidence && detail.evidence.length > 0 && (
              <div className="border-t border-[#1f2432] pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Evidence</p>
                <ul className="space-y-2">
                  {detail.evidence.map((e) => (
                    <li key={e.id}>
                      <a
                        href={e.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        {e.fileName || 'Attachment'}
                      </a>
                      {e.notes && <p className="text-xs text-gray-500">{e.notes}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detail.messages && detail.messages.length > 0 && (
              <div className="border-t border-[#1f2432] pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Messages</p>
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {detail.messages.map((m) => (
                    <li key={m.id} className={m.isInternal ? 'text-amber-400/80' : ''}>
                      <span className="text-xs text-gray-500">
                        {new Date(m.createdAt).toLocaleString()}
                        {m.isInternal ? ' (internal)' : ''}
                      </span>
                      <p className="text-sm text-white whitespace-pre-wrap">{m.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detail.auditLogs && detail.auditLogs.length > 0 && (
              <div className="border-t border-[#1f2432] pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Audit log</p>
                <ul className="space-y-1 max-h-32 overflow-y-auto text-xs text-gray-400">
                  {detail.auditLogs.slice(-15).reverse().map((a) => (
                    <li key={a.id}>
                      {a.action} by {a.performedBy.slice(0, 8)} at{' '}
                      {new Date(a.createdAt).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </AdminDrawer>
    </AdminLayout>
  );
}
