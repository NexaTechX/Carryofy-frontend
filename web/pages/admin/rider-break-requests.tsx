import useSWR from 'swr';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  AdminCard,
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
import { fetchAdminRiderBreakRequests, type AdminRiderBreakRequestRow } from '../../lib/admin/api';
import { formatDateTime } from '../../lib/api/utils';
import { RefreshCw } from 'lucide-react';

const fetcher = () => fetchAdminRiderBreakRequests({ limit: 200 });

export default function AdminRiderBreakRequestsPage() {
  const { data, isLoading, mutate } = useSWR('admin-rider-break-requests', fetcher, {
    refreshInterval: 30000,
  });
  const rows: AdminRiderBreakRequestRow[] = Array.isArray(data) ? data : [];

  return (
    <AdminLayout>
      <div className="admin-page-shell max-w-7xl space-y-6">
        <AdminPageHeader
          title="Rider break requests"
          subtitle="Submitted from the rider app (Profile → Request a break). Use this for coverage and dispatch planning."
        />

        <AdminToolbar className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => mutate()}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </AdminToolbar>

        <AdminCard>
          {isLoading ? (
            <LoadingState label="Loading break requests…" />
          ) : rows.length === 0 ? (
            <AdminEmptyState
              title="No break requests yet"
              description="When riders submit a break from the app, it will appear here with time window and optional reason."
            />
          ) : (
            <DataTableContainer>
              <DataTable>
                <DataTableHead>
                  <tr>
                    <DataTableCell>Requested</DataTableCell>
                    <DataTableCell>Rider</DataTableCell>
                    <DataTableCell>Fleet</DataTableCell>
                    <DataTableCell>Break window</DataTableCell>
                    <DataTableCell>Reason</DataTableCell>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-zinc-800/80">
                      <DataTableCell className="whitespace-nowrap text-zinc-300">
                        {formatDateTime(r.createdAt)}
                      </DataTableCell>
                      <DataTableCell>
                        <div className="font-medium text-white">{r.riderName}</div>
                        <div className="text-xs text-zinc-500">{r.riderEmail}</div>
                      </DataTableCell>
                      <DataTableCell className="text-zinc-300">
                        {r.fleetOperatorName ?? (
                          <span className="text-zinc-600">Independent</span>
                        )}
                      </DataTableCell>
                      <DataTableCell className="text-sm text-zinc-300">
                        <div className="whitespace-nowrap">{formatDateTime(r.startTime)}</div>
                        <div className="whitespace-nowrap text-zinc-500">→ {formatDateTime(r.endTime)}</div>
                      </DataTableCell>
                      <DataTableCell className="max-w-md text-zinc-400">
                        {r.reason?.trim() ? (
                          <span className="whitespace-pre-wrap">{r.reason}</span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </DataTableCell>
                    </tr>
                  ))}
                </DataTableBody>
              </DataTable>
            </DataTableContainer>
          )}
        </AdminCard>
      </div>
    </AdminLayout>
  );
}
