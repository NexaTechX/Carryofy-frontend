import { useState } from 'react';
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
  fetchAdminRiderKycQueue,
  approveAdminRiderKyc,
  rejectAdminRiderKyc,
  type AdminRiderKycRow,
} from '../../lib/admin/api';
import { formatDate } from '../../lib/api/utils';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, ExternalLink, RefreshCw } from 'lucide-react';

type StatusFilter = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';

const FILTERS: StatusFilter[] = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'];

const statusTone: Record<string, 'neutral' | 'success' | 'warning' | 'danger'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

const fetcher = (status: StatusFilter) => () => fetchAdminRiderKycQueue(status);

function DocThumb({ label, url }: { label: string; url: string | null | undefined }) {
  if (!url) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2 text-sm text-amber-500 hover:text-amber-400"
      >
        <img
          src={url}
          alt={label}
          className="h-28 max-w-full rounded-lg border border-zinc-700 object-contain bg-zinc-900"
        />
        <ExternalLink className="h-4 w-4 shrink-0 opacity-70 group-hover:opacity-100" />
      </a>
    </div>
  );
}

export default function AdminRidersKycPage() {
  const [filter, setFilter] = useState<StatusFilter>('PENDING');
  const [selected, setSelected] = useState<AdminRiderKycRow | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState(false);

  const { data, isLoading, mutate } = useSWR(['rider-kyc-queue', filter], fetcher(filter), {
    refreshInterval: 30000,
  });
  const rows = Array.isArray(data) ? data : [];

  const handleApprove = async (r: AdminRiderKycRow) => {
    setActing(true);
    try {
      await approveAdminRiderKyc(r.riderId);
      toast.success('Rider KYC approved');
      setSelected(null);
      mutate();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Approve failed';
      toast.error(msg);
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error('Enter a rejection reason');
      return;
    }
    setActing(true);
    try {
      await rejectAdminRiderKyc(selected.riderId, reason);
      toast.success('Rider KYC rejected');
      setRejectOpen(false);
      setRejectReason('');
      setSelected(null);
      mutate();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Reject failed';
      toast.error(msg);
    } finally {
      setActing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-12">
        <AdminPageHeader
          title="Rider KYC"
          tag="Fleet"
          subtitle="Review rider identity documents and approve or reject applications so riders can go online and accept deliveries."
        />

        <AdminCard>
          <AdminToolbar className="mb-4 flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <AdminFilterChip
                key={f}
                active={filter === f}
                onClick={() => setFilter(f)}
                count={f === filter ? rows.length : undefined}
              >
                {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              </AdminFilterChip>
            ))}
            <button
              type="button"
              onClick={() => mutate()}
              className="ml-auto inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </AdminToolbar>

          {isLoading ? (
            <LoadingState label="Loading rider KYC…" />
          ) : rows.length === 0 ? (
            <AdminEmptyState
              title="No applications"
              description={
                filter === 'PENDING'
                  ? 'No riders are waiting for KYC review.'
                  : `No ${filter === 'ALL' ? '' : filter.toLowerCase() + ' '}records in this view.`
              }
            />
          ) : (
            <DataTableContainer>
              <DataTable>
                <DataTableHead>
                  <tr>
                    <DataTableCell>Rider</DataTableCell>
                    <DataTableCell>Email</DataTableCell>
                    <DataTableCell>Status</DataTableCell>
                    <DataTableCell>Submitted</DataTableCell>
                    <DataTableCell className="text-right">Actions</DataTableCell>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {rows.map((r) => (
                    <tr key={r.riderId} className="border-t border-zinc-800">
                      <DataTableCell>
                        <div className="font-medium text-white">{r.name ?? '—'}</div>
                        {r.phone && (
                          <div className="text-xs text-zinc-500">{r.phone}</div>
                        )}
                      </DataTableCell>
                      <DataTableCell className="text-zinc-300">{r.email}</DataTableCell>
                      <DataTableCell>
                        <StatusBadge tone={statusTone[r.status] ?? 'neutral'}>
                          {r.status}
                        </StatusBadge>
                      </DataTableCell>
                      <DataTableCell className="text-zinc-400">
                        {formatDate(r.submittedAt)}
                      </DataTableCell>
                      <DataTableCell className="text-right">
                        <button
                          type="button"
                          onClick={() => setSelected(r)}
                          className="text-sm font-medium text-amber-500 hover:text-amber-400"
                        >
                          Review
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
        open={!!selected}
        onClose={() => {
          setSelected(null);
          setRejectOpen(false);
          setRejectReason('');
        }}
        title={selected ? `KYC — ${selected.name ?? selected.email}` : 'Rider KYC'}
        className="max-w-2xl"
      >
        {selected && (
          <div className="space-y-6 p-1">
            <div className="grid gap-2 text-sm">
              <div>
                <span className="text-zinc-500">Email</span>
                <p className="text-white">{selected.email}</p>
              </div>
              <div>
                <span className="text-zinc-500">ID type / number</span>
                <p className="text-white">
                  {selected.idType} · {selected.idNumber}
                </p>
              </div>
              {selected.licenseNumber && (
                <div>
                  <span className="text-zinc-500">License</span>
                  <p className="text-white">{selected.licenseNumber}</p>
                </div>
              )}
              {selected.vehicleInsurance && (
                <div>
                  <span className="text-zinc-500">Insurance</span>
                  <p className="text-white">{selected.vehicleInsurance}</p>
                </div>
              )}
              {selected.rejectionReason && (
                <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-3">
                  <span className="text-xs text-red-300">Last rejection</span>
                  <p className="text-sm text-red-100">{selected.rejectionReason}</p>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DocThumb label="ID image" url={selected.idImage} />
              <DocThumb label="License" url={selected.licenseImage} />
              <DocThumb label="Vehicle registration" url={selected.vehicleRegImage} />
            </div>

            {selected.status === 'PENDING' && !rejectOpen && (
              <div className="flex flex-wrap gap-3 border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => handleApprove(selected)}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve KYC
                </button>
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => setRejectOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/40 px-4 py-2.5 text-sm font-semibold text-red-200 hover:bg-red-950/70 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              </div>
            )}

            {selected.status === 'PENDING' && rejectOpen && (
              <div className="space-y-3 border-t border-zinc-800 pt-4">
                <label className="block text-sm text-zinc-400">Reason for rejection</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
                  placeholder="Explain what the rider should fix…"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={acting}
                    onClick={handleReject}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                  >
                    Confirm reject
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectOpen(false);
                      setRejectReason('');
                    }}
                    className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {selected.status !== 'PENDING' && (
              <p className="text-sm text-zinc-500">
                This application is already <strong>{selected.status}</strong>. No further action
                required here.
              </p>
            )}
          </div>
        )}
      </AdminDrawer>
    </AdminLayout>
  );
}
