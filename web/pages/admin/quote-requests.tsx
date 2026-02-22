import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  AdminPageHeader,
  AdminCard,
  DataTable,
  DataTableContainer,
  DataTableHead,
  DataTableBody,
  DataTableCell,
  LoadingState,
  StatusBadge,
} from '../../components/admin/ui';
import { fetchAdminQuoteRequests, AdminQuoteRequest } from '../../lib/admin/api';
import { formatDateTime } from '../../lib/api/utils';
import { FileText, ChevronRight, Filter } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function AdminQuoteRequestsPage() {
  const [data, setData] = useState<{ items: AdminQuoteRequest[]; pagination: { page: number; total: number; totalPages: number } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchAdminQuoteRequests({
      page,
      limit: 20,
      status: status || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
      .then((res) => {
        setData({ items: res.items, pagination: res.pagination });
      })
      .catch(() => setData({ items: [], pagination: { page: 1, total: 0, totalPages: 0 } }))
      .finally(() => setLoading(false));
  }, [page, status, startDate, endDate]);

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
        <AdminPageHeader
          title="Quote Requests"
          tag="B2B"
          subtitle="All quote requests across sellers. View details or leave sellers to respond."
        />

        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-[#1f2534] bg-[#0e131d] p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
            <Filter className="h-4 w-4" />
            Filters
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-[#1f2534] bg-[#090c11] px-3 py-2 text-sm text-white"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-[#1f2534] bg-[#090c11] px-3 py-2 text-sm text-white"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-[#1f2534] bg-[#090c11] px-3 py-2 text-sm text-white"
          />
        </div>

        <AdminCard className="overflow-hidden p-0" contentClassName="p-0">
          {loading ? (
            <LoadingState label="Loading quote requests..." />
          ) : !data?.items.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FileText className="mb-4 h-12 w-12 text-gray-600" />
              <p className="font-medium">No quote requests found</p>
              <p className="text-sm">Try adjusting filters or check back later.</p>
            </div>
          ) : (
            <>
              <DataTableContainer>
                <DataTable>
                  <DataTableHead>
                    <tr>
                      <DataTableCell className="font-semibold">ID</DataTableCell>
                      <DataTableCell className="font-semibold">Buyer</DataTableCell>
                      <DataTableCell className="font-semibold">Seller</DataTableCell>
                      <DataTableCell className="font-semibold">Status</DataTableCell>
                      <DataTableCell className="font-semibold">Items</DataTableCell>
                      <DataTableCell className="font-semibold">Created</DataTableCell>
                      <DataTableCell className="font-semibold w-20"></DataTableCell>
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {data.items.map((quote) => (
                      <tr key={quote.id} className="border-t border-[#1f2534] hover:bg-[#0e131d]">
                        <DataTableCell className="font-mono text-xs text-gray-400">
                          {quote.id.slice(0, 8)}…
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-white">{quote.buyer?.name ?? '—'}</span>
                          {quote.buyer?.email && (
                            <span className="block text-xs text-gray-500">{quote.buyer.email}</span>
                          )}
                        </DataTableCell>
                        <DataTableCell className="text-white">
                          {quote.seller?.businessName ?? '—'}
                        </DataTableCell>
                        <DataTableCell>
                          <StatusBadge
                            label={quote.status}
                            tone={
                              quote.status === 'APPROVED'
                                ? 'success'
                                : quote.status === 'REJECTED'
                                  ? 'danger'
                                  : 'warning'
                            }
                          />
                        </DataTableCell>
                        <DataTableCell className="text-gray-300">
                          {quote.items?.length ?? 0} item(s)
                        </DataTableCell>
                        <DataTableCell className="text-gray-400 text-sm">
                          {formatDateTime(quote.createdAt)}
                        </DataTableCell>
                        <DataTableCell>
                          <Link
                            href={`/admin/quote-requests/${quote.id}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                          >
                            View
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </DataTableCell>
                      </tr>
                    ))}
                  </DataTableBody>
                </DataTable>
              </DataTableContainer>
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#1f2534] px-4 py-3">
                  <p className="text-sm text-gray-400">
                    Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={data.pagination.page <= 1}
                      className="rounded-lg border border-[#1f2534] px-3 py-1.5 text-sm text-white disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={data.pagination.page >= data.pagination.totalPages}
                      className="rounded-lg border border-[#1f2534] px-3 py-1.5 text-sm text-white disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </AdminCard>
      </div>
    </AdminLayout>
  );
}
