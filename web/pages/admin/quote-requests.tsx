import { useState, useEffect, useCallback } from 'react';
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
  AdminDrawer,
  AdminTableToolbar,
  useColumnVisibility,
  buildCSV,
  downloadBlob,
} from '../../components/admin/ui';
import {
  fetchAdminQuoteRequests,
  fetchQuoteRequestFilterOptions,
  fetchQuoteRequestById,
  AdminQuoteRequest,
  AdminQuoteRequestsStats,
  QuoteRequestFilterOptions,
} from '../../lib/admin/api';
import { useTableKeyboardNav } from '../../lib/admin/hooks/useTableKeyboardNav';
import { getStatusTone } from '../../lib/admin/statusTones';
import { formatDateTime, formatNgnFromKobo } from '../../lib/api/utils';
import clsx from 'clsx';
import {
  FileText,
  Filter,
  ChevronRight,
  AlertTriangle,
  MessageSquare,
  Send,
  XCircle,
  DollarSign,
  User,
  Building2,
} from 'lucide-react';

const SLA_DAYS = 3; // Response deadline SLA (configurable in Settings later)

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'RESPONDED', label: 'Responded' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Declined' },
  { value: 'EXPIRED', label: 'Expired' },
] as const;

function getResponseDeadline(createdAt: string): Date {
  const d = new Date(createdAt);
  d.setDate(d.getDate() + SLA_DAYS);
  return d;
}

function isOverdue(quote: AdminQuoteRequest): boolean {
  if (quote.status !== 'PENDING') return false;
  return getResponseDeadline(quote.createdAt) < new Date();
}

function proposedBudgetKobo(quote: AdminQuoteRequest): number {
  return (quote.items ?? []).reduce(
    (sum, i) => sum + (i.requestedPriceKobo ?? 0) * i.requestedQuantity,
    0
  );
}

const QUOTE_TABLE_COLUMNS = [
  { id: 'requestId', label: 'Request ID' },
  { id: 'buyer', label: 'Buyer' },
  { id: 'seller', label: 'Seller' },
  { id: 'products', label: 'Product(s)' },
  { id: 'qty', label: 'Qty' },
  { id: 'proposedBudget', label: 'Proposed Budget (₦)' },
  { id: 'dateSubmitted', label: 'Date Submitted' },
  { id: 'responseDeadline', label: 'Response Deadline' },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions' },
];

function statusLabel(status: string, converted?: boolean): string {
  if (converted) return 'Converted';
  switch (status) {
    case 'PENDING': return 'Pending';
    case 'APPROVED': return 'Quotes sent';
    case 'REJECTED': return 'Declined';
    case 'EXPIRED': return 'Expired';
    case 'RESPONDED': return 'Responded';
    case 'ACCEPTED': return 'Accepted';
    default: return status;
  }
}

function StatCard({
  label,
  count,
  sub,
  icon: Icon,
}: {
  label: string;
  count: number;
  sub?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-[#1f2534] bg-[#0e131d] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-white">{count}</p>
          {sub != null && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
        </div>
        <div className="rounded-lg bg-[#1a1f2e] p-2">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

export default function AdminQuoteRequestsPage() {
  const [data, setData] = useState<{
    items: AdminQuoteRequest[];
    pagination: { page: number; total: number; totalPages: number };
    stats?: AdminQuoteRequestsStats;
  } | null>(null);
  const [filterOptions, setFilterOptions] = useState<QuoteRequestFilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [buyerId, setBuyerId] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [drawerQuote, setDrawerQuote] = useState<AdminQuoteRequest | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | undefined>(undefined);
  const [tableColumns, setTableColumns] = useColumnVisibility(QUOTE_TABLE_COLUMNS);
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);

  const loadFilters = useCallback(async () => {
    try {
      const opts = await fetchQuoteRequestFilterOptions();
      setFilterOptions(opts);
    } catch {
      setFilterOptions({ sellers: [], buyers: [] });
    }
  }, []);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    setLoading(true);
    fetchAdminQuoteRequests({
      page,
      limit: 20,
      status: statusTab || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      sellerId: sellerId || undefined,
      buyerId: buyerId || undefined,
      minBudget: minBudget !== '' ? parseFloat(minBudget) : undefined,
      maxBudget: maxBudget !== '' ? parseFloat(maxBudget) : undefined,
    })
      .then((res) => {
        setData({
          items: res.items,
          pagination: res.pagination,
          stats: res.stats,
        });
        setLastUpdatedAt(Date.now());
      })
      .catch(() =>
        setData({
          items: [],
          pagination: { page: 1, total: 0, totalPages: 0 },
          stats: undefined,
        })
      )
      .finally(() => setLoading(false));
  }, [page, statusTab, sellerId, buyerId, minBudget, maxBudget, startDate, endDate]);

  const items = data?.items ?? [];
  const openDrawer = useCallback((quote: AdminQuoteRequest) => {
    setDrawerQuote(quote);
    setDrawerLoading(true);
    fetchQuoteRequestById(quote.id)
      .then(setDrawerQuote)
      .finally(() => setDrawerLoading(false));
  }, []);
  const visibleCols = tableColumns.filter((c) => c.visible);
  const { getRowProps } = useTableKeyboardNav({
    rowCount: items.length,
    selectedIndex: selectedRowIndex,
    onSelectIndex: setSelectedRowIndex,
    onOpenRow: (index) => openDrawer(items[index]!),
    enabled: items.length > 0,
  });

  const refetchQuotes = useCallback(() => {
    setLoading(true);
    fetchAdminQuoteRequests({
      page,
      limit: 20,
      status: statusTab || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      sellerId: sellerId || undefined,
      buyerId: buyerId || undefined,
      minBudget: minBudget !== '' ? parseFloat(minBudget) : undefined,
      maxBudget: maxBudget !== '' ? parseFloat(maxBudget) : undefined,
    })
      .then((res) => {
        setData({
          items: res.items,
          pagination: res.pagination,
          stats: res.stats,
        });
        setLastUpdatedAt(Date.now());
      })
      .catch(() =>
        setData({
          items: [],
          pagination: { page: 1, total: 0, totalPages: 0 },
          stats: undefined,
        })
      )
      .finally(() => setLoading(false));
  }, [page, statusTab, sellerId, buyerId, minBudget, maxBudget, startDate, endDate]);

  const handleExportQuotesCSV = () => {
    const cols = visibleCols.filter((c) => c.id !== 'actions').map((c) => ({ id: c.id, label: c.label }));
    const rows = items.map((quote) => {
      const deadline = quote.status === 'PENDING' ? getResponseDeadline(quote.createdAt) : null;
      const budget = proposedBudgetKobo(quote);
      const productNames = (quote.items ?? [])
        .map((i) => i.product?.title ?? `Product ${i.productId?.slice(0, 8)}`)
        .filter(Boolean);
      const totalQty = (quote.items ?? []).reduce((s, i) => s + i.requestedQuantity, 0);
      return {
        requestId: quote.id,
        buyer: quote.buyer?.name ?? '—',
        seller: quote.seller?.businessName ?? '—',
        products: productNames.join('; '),
        qty: totalQty,
        proposedBudget: budget > 0 ? formatNgnFromKobo(budget) : '—',
        dateSubmitted: formatDateTime(quote.createdAt),
        responseDeadline: deadline ? formatDateTime(deadline.toISOString()) : '—',
        status: statusLabel(quote.status, quote.converted),
      };
    });
    const csv = buildCSV(cols, rows);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `quote-requests-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const stats = data?.stats;
  const total = stats?.total ?? 0;
  const conversionPct = total > 0 && stats ? ((stats.converted / total) * 100).toFixed(1) : '0';
  const pendingPct = total > 0 && stats ? ((stats.pending / total) * 100).toFixed(1) : '0';
  const quotesSentPct = total > 0 && stats ? ((stats.quotesSent / total) * 100).toFixed(1) : '0';

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
        <AdminPageHeader
          title="Quote Requests"
          tag="B2B"
          subtitle="Bulk purchase negotiations between business buyers and sellers. Monitor responses and conversions."
        />

        {/* Summary stat strip */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Requests"
            count={stats?.total ?? 0}
            icon={FileText}
          />
          <StatCard
            label="Pending Seller Response"
            count={stats?.pending ?? 0}
            sub={`${pendingPct}% of total`}
            icon={MessageSquare}
          />
          <StatCard
            label="Quotes Sent (awaiting buyer)"
            count={stats?.quotesSent ?? 0}
            sub={`${quotesSentPct}% of total`}
            icon={Send}
          />
          <StatCard
            label="Converted to Orders"
            count={stats?.converted ?? 0}
            sub={`${conversionPct}% conversion`}
            icon={DollarSign}
          />
        </div>

        {/* Overdue responses alert */}
        {stats && (stats.overdue ?? 0) > 0 && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
            <div>
              <p className="font-medium text-red-200">
                Overdue Responses: {stats.overdue} quote request(s) past the {SLA_DAYS}-day response window.
              </p>
              <p className="text-sm text-red-200/80">
                Sellers have not responded within the SLA. Configure the window in Settings.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStatusTab('PENDING')}
              className="ml-auto rounded-lg border border-red-400/50 bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-200 hover:bg-red-500/30"
            >
              View pending
            </button>
          </div>
        )}

        {/* Filter bar */}
        <div className="mb-6 rounded-2xl border border-[#1f2534] bg-[#0e131d] p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-400">
            <Filter className="h-4 w-4" />
            Filters
          </div>
          {/* Status tabs */}
          <div className="mb-4 flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value || 'all'}
                type="button"
                onClick={() => {
                  setStatusTab(tab.value);
                  setPage(1);
                }}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  statusTab === tab.value
                    ? 'border-primary bg-primary/20 text-primary'
                    : 'border-[#1f2534] bg-[#090c11] text-gray-300 hover:border-[#2a3142]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Seller</label>
              <select
                value={sellerId}
                onChange={(e) => {
                  setSellerId(e.target.value);
                  setPage(1);
                }}
                className="min-w-[180px] rounded-lg border border-[#1f2534] bg-[#090c11] px-3 py-2 text-sm text-white"
              >
                <option value="">All sellers</option>
                {filterOptions?.sellers?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.businessName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Buyer</label>
              <select
                value={buyerId}
                onChange={(e) => {
                  setBuyerId(e.target.value);
                  setPage(1);
                }}
                className="min-w-[180px] rounded-lg border border-[#1f2534] bg-[#090c11] px-3 py-2 text-sm text-white"
              >
                <option value="">All buyers</option>
                {filterOptions?.buyers?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Min ₦</label>
              <input
                type="number"
                min={0}
                step={1000}
                placeholder="0"
                value={minBudget}
                onChange={(e) => {
                  setMinBudget(e.target.value);
                  setPage(1);
                }}
                className="w-28 rounded-lg border border-[#1f2534] bg-[#090c11] px-3 py-2 text-sm text-white placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Max ₦</label>
              <input
                type="number"
                min={0}
                step={1000}
                placeholder="Any"
                value={maxBudget}
                onChange={(e) => {
                  setMaxBudget(e.target.value);
                  setPage(1);
                }}
                className="w-28 rounded-lg border border-[#1f2534] bg-[#090c11] px-3 py-2 text-sm text-white placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">From date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-[#1f2534] bg-[#090c11] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">To date</label>
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
          </div>
        </div>

        <AdminCard className="overflow-hidden p-0" contentClassName="p-0">
          {loading ? (
            <LoadingState label="Loading quote requests..." />
          ) : !items.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FileText className="mb-4 h-12 w-12 text-gray-600" />
              <p className="font-medium">No quote requests found</p>
              <p className="text-sm">Try adjusting filters or check back later.</p>
            </div>
          ) : (
            <>
              <AdminTableToolbar
                columns={tableColumns}
                onColumnsChange={setTableColumns}
                onExportCSV={handleExportQuotesCSV}
                lastUpdatedAt={lastUpdatedAt}
                onRefresh={refetchQuotes}
                isRefreshing={loading}
                className="mb-4"
              />
              <DataTableContainer>
                <DataTable>
                  <DataTableHead>
                    <tr>
                      {visibleCols.map((c) => (
                        <th
                          key={c.id}
                          className={c.id === 'actions' ? 'w-32 px-6 py-4 text-right font-semibold text-gray-500' : 'px-6 py-4 text-left font-semibold text-white'}
                        >
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {items.map((quote, index) => {
                      const overdue = isOverdue(quote);
                      const deadline = quote.status === 'PENDING' ? getResponseDeadline(quote.createdAt) : null;
                      const budget = proposedBudgetKobo(quote);
                      const productNames = (quote.items ?? [])
                        .map((i) => i.product?.title ?? `Product ${i.productId?.slice(0, 8)}`)
                        .filter(Boolean);
                      const totalQty = (quote.items ?? []).reduce((s, i) => s + i.requestedQuantity, 0);
                      const rowProps = getRowProps(index);
                      const isSelected = rowProps['data-selected'];
                      const statusTone = quote.converted ? getStatusTone('COMPLETED') : getStatusTone(quote.status);
                      return (
                        <tr
                          key={quote.id}
                          {...rowProps}
                          onClick={() => {
                            setSelectedRowIndex(index);
                            openDrawer(quote);
                          }}
                          className={clsx(
                            'cursor-pointer border-t border-[#1f2534] hover:bg-[#0e131d]',
                            isSelected && 'bg-[#0e131d] ring-1 ring-inset ring-primary/50'
                          )}
                        >
                          {visibleCols.some((c) => c.id === 'requestId') && (
                            <DataTableCell className="font-mono text-xs text-gray-400">
                              {quote.id.slice(0, 8)}…
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'buyer') && (
                            <DataTableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-white">{quote.buyer?.name ?? '—'}</span>
                                <span className="rounded bg-[#1f2534] px-1.5 py-0.5 text-xs text-gray-400">
                                  B2B
                                </span>
                              </div>
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'seller') && (
                            <DataTableCell className="text-white">
                              {quote.seller?.businessName ?? '—'}
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'products') && (
                            <DataTableCell className="max-w-[160px] truncate text-gray-300" title={productNames.join(', ')}>
                              {productNames.length ? productNames.join(', ') : '—'}
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'qty') && (
                            <DataTableCell className="text-gray-300">{totalQty}</DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'proposedBudget') && (
                            <DataTableCell className="text-gray-300">
                              {budget > 0 ? formatNgnFromKobo(budget) : '—'}
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'dateSubmitted') && (
                            <DataTableCell className="text-sm text-gray-400">
                              {formatDateTime(quote.createdAt)}
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'responseDeadline') && (
                            <DataTableCell>
                              {deadline ? (
                                <span className={overdue ? 'text-red-400 font-medium' : 'text-gray-400'}>
                                  {formatDateTime(deadline.toISOString())}
                                  {overdue && ' (Overdue)'}
                                </span>
                              ) : (
                                '—'
                              )}
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'status') && (
                            <DataTableCell>
                              <StatusBadge label={statusLabel(quote.status, quote.converted)} tone={statusTone} />
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'actions') && (
                            <DataTableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openDrawer(quote)}
                                className="rounded p-1.5 text-gray-400 hover:bg-[#1f2534] hover:text-primary"
                                title="View"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="rounded p-1.5 text-gray-400 hover:bg-[#1f2534] hover:text-white"
                                title="Nudge seller"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="rounded p-1.5 text-gray-400 hover:bg-[#1f2534] hover:text-red-400"
                                title="Close"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                            </DataTableCell>
                          )}
                        </tr>
                      );
                    })}
                  </DataTableBody>
                </DataTable>
              </DataTableContainer>
              {data?.pagination?.totalPages && data.pagination.totalPages > 1 && (
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

      {/* Detail drawer */}
      <AdminDrawer
        open={!!drawerQuote}
        onClose={() => setDrawerQuote(null)}
        title={drawerQuote ? `Quote ${drawerQuote.id.slice(0, 8)}…` : ''}
        description={drawerQuote ? `${drawerQuote.buyer?.name ?? 'Buyer'} · ${drawerQuote.seller?.businessName ?? 'Seller'}` : ''}
        className="max-w-lg"
        footer={
          drawerQuote ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-[#1f2534] bg-[#0e131d] px-3 py-2 text-sm font-medium text-white hover:bg-[#1f2534]"
              >
                <DollarSign className="h-4 w-4" />
                Override Price
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-500/20"
              >
                <XCircle className="h-4 w-4" />
                Force Close
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-300 hover:bg-amber-500/20"
              >
                <AlertTriangle className="h-4 w-4" />
                Escalate
              </button>
            </div>
          ) : null
        }
      >
        {drawerLoading ? (
          <LoadingState label="Loading details..." />
        ) : drawerQuote ? (
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                <User className="h-4 w-4" />
                Buyer request
              </h3>
              <div className="rounded-lg border border-[#1f2534] bg-[#0e131d] p-4">
                <p className="text-sm text-gray-300">{drawerQuote.message || 'No message.'}</p>
                <p className="mt-2 text-xs text-gray-500">
                  {formatDateTime(drawerQuote.createdAt)} · {drawerQuote.buyer?.name} ({drawerQuote.buyer?.email})
                </p>
              </div>
            </div>
            {drawerQuote.sellerResponse && (
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  <Building2 className="h-4 w-4" />
                  Seller response
                </h3>
                <div className="rounded-lg border border-[#1f2534] bg-[#0e131d] p-4">
                  <p className="text-sm text-gray-300">{drawerQuote.sellerResponse}</p>
                </div>
              </div>
            )}
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Items</h3>
              <div className="space-y-2">
                {drawerQuote.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-[#1f2534] p-3"
                  >
                    <div>
                      <p className="font-medium text-white">{item.product?.title ?? `Product ${item.productId?.slice(0, 8)}`}</p>
                      <p className="text-xs text-gray-500">Qty: {item.requestedQuantity}</p>
                    </div>
                    <div className="text-right text-sm">
                      {item.requestedPriceKobo != null && (
                        <p className="text-gray-400">Proposed: {formatNgnFromKobo(item.requestedPriceKobo)}/unit</p>
                      )}
                      {item.sellerQuotedPriceKobo != null && (
                        <p className="text-primary font-medium">{formatNgnFromKobo(item.sellerQuotedPriceKobo)}/unit</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Negotiation history and admin interventions can be logged here when Override Price / Force Close / Escalate are implemented.
            </p>
          </div>
        ) : null}
      </AdminDrawer>
    </AdminLayout>
  );
}
