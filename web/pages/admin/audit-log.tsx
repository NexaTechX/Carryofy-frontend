import { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminToolbar,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableContainer,
  DataTableHead,
  LoadingState,
} from '../../components/admin/ui';
import { fetchAdminAuditLogs, type AdminAuditLogRow } from '../../lib/admin/api';

const ACTION_OPTIONS = [
  '',
  'PRODUCT_APPROVED',
  'PRODUCT_REJECTED',
  'PRODUCT_DELETED',
  'PRODUCT_STATUS_CHANGED',
  'SELLER_APPROVED',
  'SELLER_REJECTED',
  'ORDER_STATUS_CHANGED',
  'PAYOUT_APPROVED',
  'PAYOUT_REJECTED',
  'PAYOUT_PROCESSED',
  'SETTINGS_UPDATED',
  'USER_ROLE_CHANGED',
  'USER_SUSPENDED',
  'USER_ACTIVATED',
  'CATEGORY_CREATED',
  'CATEGORY_UPDATED',
  'CATEGORY_DELETED',
  'DELIVERY_ASSIGNED',
  'DELIVERY_STATUS_CHANGED',
  'REFUND_APPROVED',
  'REFUND_REJECTED',
  'BULK_OPERATION',
  'BROADCAST_SEND',
];

const PAGE_SIZE = 20;

export default function AdminAuditLogPage() {
  const [rows, setRows] = useState<AdminAuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const [action, setAction] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminAuditLogs({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        performedBy: performedBy || undefined,
        action: action || undefined,
      });
      setRows(data);
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e !== null && 'response' in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message)
          : null;
      setError(msg || 'Failed to load audit logs');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate, performedBy, action]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Head>
        <title>Audit Log | Admin | Carryofy</title>
      </Head>
      <AdminLayout>
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Audit Log"
            subtitle="Admin actions and targets (from server audit trail)."
          />

          <AdminToolbar className="mb-6 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col gap-1 text-sm text-gray-400">
                Start date
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(0);
                  }}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-white"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-gray-400">
                End date
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(0);
                  }}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-white"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-gray-400">
                Admin user ID
                <input
                  type="text"
                  value={performedBy}
                  onChange={(e) => {
                    setPerformedBy(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Filter by performer UUID"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-white placeholder:text-gray-500"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-gray-400">
                Action
                <select
                  value={action}
                  onChange={(e) => {
                    setAction(e.target.value);
                    setPage(0);
                  }}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-white"
                >
                  {ACTION_OPTIONS.map((a) => (
                    <option key={a || 'all'} value={a}>
                      {a || 'All actions'}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              onClick={() => load()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-black hover:bg-primary/90"
            >
              Apply filters
            </button>
          </AdminToolbar>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <LoadingState label="Loading audit log…" />
          ) : rows.length === 0 ? (
            <AdminEmptyState title="No entries" description="Try adjusting filters or date range." />
          ) : (
            <>
              <DataTableContainer>
                <DataTable>
                  <DataTableHead>
                    <tr>
                      <th className="px-6 py-4 text-left text-white">Admin user</th>
                      <th className="px-6 py-4 text-left text-white">Action</th>
                      <th className="px-6 py-4 text-left text-white">Target</th>
                      <th className="px-6 py-4 text-left text-white">Timestamp</th>
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <DataTableCell>
                          <div className="text-white">{r.performedByName || '—'}</div>
                          <div className="font-mono text-xs text-gray-500">{r.performedBy}</div>
                        </DataTableCell>
                        <DataTableCell className="text-gray-200">{r.action}</DataTableCell>
                        <DataTableCell>
                          <span className="text-gray-300">{r.targetType}</span>
                          <span className="mx-1 text-gray-600">·</span>
                          <span className="font-mono text-xs text-gray-400">{r.targetId}</span>
                          {r.targetName ? (
                            <div className="text-xs text-gray-500">{r.targetName}</div>
                          ) : null}
                        </DataTableCell>
                        <DataTableCell className="whitespace-nowrap text-gray-300">
                          {new Date(r.timestamp).toLocaleString()}
                        </DataTableCell>
                      </tr>
                    ))}
                  </DataTableBody>
                </DataTable>
              </DataTableContainer>

              <div className="mt-6 flex items-center justify-between gap-4">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-white disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400">Page {page + 1}</span>
                <button
                  type="button"
                  disabled={rows.length < PAGE_SIZE}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </AdminLayout>
    </>
  );
}
