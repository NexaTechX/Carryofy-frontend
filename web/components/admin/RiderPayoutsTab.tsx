import { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CheckCircle2, Inbox, XCircle, FileCheck, Ban, Loader2 } from 'lucide-react';
import {
  AdminEmptyState,
  AdminToolbar,
  AdminFilterChip,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableContainer,
  DataTableHead,
  LoadingState,
  StatusBadge,
} from './ui';
import {
  useRiderPayouts,
  useApproveRiderPayoutMutation,
  useProcessRiderPayoutMutation,
  useRejectRiderPayoutMutation,
} from '../../lib/admin/hooks/useRiderPayouts';
import { AdminRiderPayout, PayoutStatus } from '../../lib/admin/types';
import { formatNgnFromKobo } from '../../lib/api/utils';

const payoutStatusTone: Record<PayoutStatus, 'warning' | 'success' | 'danger' | 'neutral'> = {
  REQUESTED: 'warning',
  APPROVED: 'success',
  PROCESSING: 'warning',
  PAID: 'success',
  CANCELLED: 'neutral',
  REJECTED: 'danger',
};

const payoutStatusLabel: Record<PayoutStatus, string> = {
  REQUESTED: 'Requested',
  APPROVED: 'Approved',
  PROCESSING: 'Processing',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
};

const RIDER_FILTERS: PayoutStatus[] = [
  'REQUESTED',
  'APPROVED',
  'PROCESSING',
  'PAID',
  'REJECTED',
  'CANCELLED',
];

function getEmptyStateForFilter(filter: PayoutStatus): {
  title: string;
  description: string;
  icon: React.ReactNode;
} {
  switch (filter) {
    case 'REQUESTED':
      return {
        title: 'No pending requests',
        description: 'All riders are settled. New payout requests will appear here.',
        icon: <CheckCircle2 className="h-6 w-6 text-emerald-500" />,
      };
    case 'APPROVED':
      return {
        title: 'No approved payouts',
        description: 'No rider payouts are currently approved and awaiting processing.',
        icon: <FileCheck className="h-6 w-6 text-gray-500" />,
      };
    case 'PROCESSING':
      return {
        title: 'None in processing',
        description: 'No rider payouts are currently being processed.',
        icon: <Loader2 className="h-6 w-6 text-gray-500" />,
      };
    case 'PAID':
      return {
        title: 'No paid payouts yet',
        description: 'Completed rider payouts will appear here.',
        icon: <CheckCircle2 className="h-6 w-6 text-gray-500" />,
      };
    case 'REJECTED':
      return {
        title: 'No rejected payouts',
        description: 'Rejected rider requests will appear here.',
        icon: <XCircle className="h-6 w-6 text-gray-500" />,
      };
    case 'CANCELLED':
    default:
      return {
        title: 'No cancelled payouts',
        description: 'Cancelled rider requests will appear here.',
        icon: <Ban className="h-6 w-6 text-gray-500" />,
      };
  }
}

export default function RiderPayoutsTab() {
  const [filter, setFilter] = useState<PayoutStatus>('REQUESTED');
  const { data: payouts, isLoading, isError, error, refetch } = useRiderPayouts(filter);

  const approve = useApproveRiderPayoutMutation();
  const reject = useRejectRiderPayoutMutation();
  const process = useProcessRiderPayoutMutation();

  const rows = useMemo(() => payouts ?? [], [payouts]);

  const handleApprove = (payout: AdminRiderPayout) => {
    approve.mutate(payout.id);
  };

  const handleReject = (payout: AdminRiderPayout) => {
    // window.prompt returns null when the admin cancels — abort in that case.
    const reason = typeof window !== 'undefined'
      ? window.prompt('Reason for rejecting this rider payout (optional):')
      : '';
    if (reason === null) return;
    reject.mutate({ id: payout.id, reason: reason.trim() || undefined });
  };

  const handleProcess = (payout: AdminRiderPayout) => {
    if (!payout.rider.riderBankAccount) {
      toast.error('Rider has not added bank details');
      return;
    }
    process.mutate(payout.id);
  };

  return (
    <section className="mb-8 rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Rider Payout Requests</h2>
          <p className="mt-1 text-sm text-gray-400">
            Independent (non-fleet) rider withdrawals. Approve, then process to pay out.
          </p>
        </div>
      </div>

      <AdminToolbar className="mb-4 gap-2">
        {RIDER_FILTERS.map((status) => (
          <AdminFilterChip key={status} active={filter === status} onClick={() => setFilter(status)}>
            {payoutStatusLabel[status]}
          </AdminFilterChip>
        ))}
      </AdminToolbar>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <AdminEmptyState
          title="Unable to load rider payouts"
          description={error instanceof Error ? error.message : 'Please try again later.'}
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
      ) : rows.length === 0 ? (
        (() => {
          const empty = getEmptyStateForFilter(filter);
          return <AdminEmptyState title={empty.title} description={empty.description} icon={empty.icon} />;
        })()
      ) : (
        <DataTableContainer>
          <DataTable>
            <DataTableHead>
              <tr>
                <th className="px-6 py-4 text-white">Rider</th>
                <th className="px-6 py-4 text-white">Amount</th>
                <th className="px-6 py-4 text-white">Bank Account</th>
                <th className="px-6 py-4 text-white">Earnings</th>
                <th className="px-6 py-4 text-white">Requested</th>
                <th className="px-6 py-4 text-white">Status</th>
                <th className="px-6 py-4 text-right text-gray-500">Actions</th>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {rows.map((payout) => {
                const bank = payout.rider.riderBankAccount;
                const isProcessing = process.isPending && process.variables === payout.id;
                return (
                  <tr key={payout.id} className="transition hover:bg-[#10151d]">
                    <DataTableCell>
                      <span className="block text-sm font-semibold text-white">
                        {payout.rider.name || `Rider #${payout.riderId.slice(0, 8)}`}
                      </span>
                      <span className="block text-xs text-gray-400">{payout.rider.phone ?? '—'}</span>
                    </DataTableCell>
                    <DataTableCell>
                      <span className="text-sm font-semibold text-primary">{formatNgnFromKobo(payout.amount)}</span>
                    </DataTableCell>
                    <DataTableCell>
                      {bank ? (
                        <div className="text-xs text-gray-300">
                          <span className="block font-semibold text-white">{bank.accountName}</span>
                          <span className="block font-mono text-gray-400">{bank.accountNumber}</span>
                          <span className="block text-gray-400">{bank.bankName}</span>
                        </div>
                      ) : (
                        <StatusBadge tone="danger" label="No bank details" />
                      )}
                    </DataTableCell>
                    <DataTableCell>
                      <span className="text-xs text-gray-400">{payout._count?.earnings ?? 0}</span>
                    </DataTableCell>
                    <DataTableCell>
                      <span className="text-xs text-gray-400">
                        {new Date(payout.requestedAt).toLocaleDateString()}
                      </span>
                    </DataTableCell>
                    <DataTableCell>
                      <StatusBadge
                        tone={payoutStatusTone[payout.status] ?? 'neutral'}
                        label={payoutStatusLabel[payout.status] ?? payout.status}
                      />
                    </DataTableCell>
                    <DataTableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex justify-end gap-2">
                          {payout.status === 'REQUESTED' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(payout)}
                                disabled={approve.isPending}
                                className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light disabled:opacity-60"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(payout)}
                                disabled={reject.isPending}
                                className="rounded-full border border-[#3a1f1f] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#ff9aa8] transition hover:border-[#ff9aa8] hover:text-[#ffb8c6] disabled:opacity-60"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {payout.status === 'APPROVED' && (
                            <button
                              type="button"
                              onClick={() => handleProcess(payout)}
                              disabled={!bank || isProcessing}
                              title={!bank ? 'Rider has not added bank details' : undefined}
                              className="rounded-full border border-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:bg-primary hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isProcessing ? 'Processing…' : 'Process payout'}
                            </button>
                          )}
                          {payout.status === 'PROCESSING' && (
                            <button
                              type="button"
                              onClick={() => handleProcess(payout)}
                              disabled={!bank || isProcessing}
                              title={!bank ? 'Rider has not added bank details' : undefined}
                              className="rounded-full border border-amber-500/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-amber-300 transition hover:border-amber-400 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isProcessing ? 'Processing…' : 'Retry process'}
                            </button>
                          )}
                        </div>
                        {payout.status === 'APPROVED' && !bank && (
                          <span className="text-[11px] text-[#ff9aa8]">Rider has not added bank details</span>
                        )}
                        {payout.status === 'REJECTED' && payout.rejectionReason && (
                          <span className="max-w-[220px] text-right text-[11px] text-gray-500">
                            {payout.rejectionReason}
                          </span>
                        )}
                      </div>
                    </DataTableCell>
                  </tr>
                );
              })}
            </DataTableBody>
          </DataTable>
        </DataTableContainer>
      )}
    </section>
  );
}
