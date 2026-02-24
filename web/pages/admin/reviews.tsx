import { Fragment, useMemo, useState } from 'react';
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
  Pagination,
  RatingDistributionBar,
  ratingDistributionFromReviews,
  AdminTableToolbar,
  useColumnVisibility,
  buildCSV,
  downloadBlob,
} from '../../components/admin/ui';
import { useTableKeyboardNav } from '../../lib/admin/hooks/useTableKeyboardNav';
import { getStatusTone } from '../../lib/admin/statusTones';
import {
  useAdminReviews,
  useAdminReviewDetail,
  useAdminReviewFlaggedCount,
  useFlagReviewMutation,
  useUnflagReviewMutation,
  useDeleteReviewMutation,
  AdminReview,
} from '../../lib/admin/hooks/useAdminReviews';
import { useAdminRiderRatings } from '../../lib/admin/hooks/useAdminRiderRatings';
import { useAdminSellers } from '../../lib/admin/hooks/useAdminSellers';
import { toast } from 'react-hot-toast';
import { MessageSquare, Star, X, Truck, Search, Check, Flag, EyeOff, Trash2 } from 'lucide-react';
import { useConfirmation } from '../../lib/hooks/useConfirmation';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import { getSentiment, SentimentLabel } from '../../lib/utils/sentiment';
import type { AdminRiderRating } from '../../lib/admin/hooks/useAdminRiderRatings';
import clsx from 'clsx';

const RATING_FILTERS = ['ALL', 5, 4, 3, 2, 1] as const;
const STATUS_OPTIONS = ['ALL', 'FLAGGED', 'CLEAN', 'HIDDEN'] as const;

const REVIEW_TABLE_COLUMNS = [
  { id: 'reviewer', label: 'Reviewer' },
  { id: 'product', label: 'Product' },
  { id: 'rating', label: 'Rating' },
  { id: 'review', label: 'Review' },
  { id: 'date', label: 'Date' },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions' },
];

const RIDER_REVIEW_TABLE_COLUMNS = [
  { id: 'reviewer', label: 'Reviewer' },
  { id: 'rider', label: 'Rider' },
  { id: 'rating', label: 'Rating' },
  { id: 'review', label: 'Review' },
  { id: 'date', label: 'Date' },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions' },
];

type TabType = 'products' | 'riders';

const EXCERPT_LEN = 60;

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
}

function excerpt(text: string | null | undefined, max = EXCERPT_LEN): string {
  if (!text) return '—';
  const t = text.trim();
  if (t.length <= max) return t;
  return t.slice(0, max).trim() + '…';
}

function renderStars(rating: number, size: 'sm' | 'md' = 'md') {
  const cls = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  return (
    <div className="flex gap-0.5">
      {([1, 2, 3, 4, 5] as const).map((star) => (
        <Star
          key={star}
          className={`${cls} ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
        />
      ))}
    </div>
  );
}

function SentimentTag({ label }: { label: SentimentLabel }) {
  const tone = label === 'Positive' ? 'success' : label === 'Negative' ? 'danger' : 'neutral';
  return (
    <StatusBadge tone={tone} label={label} />
  );
}

export default function AdminReviews() {
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [page, setPage] = useState(1);
  const [riderPage, setRiderPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_OPTIONS[number]>('ALL');
  const [ratingFilter, setRatingFilter] = useState<typeof RATING_FILTERS[number]>('ALL');
  const [sellerFilter, setSellerFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [selectedRiderRating, setSelectedRiderRating] = useState<AdminRiderRating | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [detailReply, setDetailReply] = useState('');

  const flaggedOnly =
    statusFilter === 'FLAGGED' ? true : statusFilter === 'CLEAN' || statusFilter === 'HIDDEN' ? false : undefined;

  const { data, isLoading, isError, error, refetch, dataUpdatedAt } = useAdminReviews({
    page,
    limit: 10,
    flaggedOnly,
    rating: ratingFilter === 'ALL' ? undefined : ratingFilter,
    sellerId: sellerFilter || undefined,
    search: searchQuery.trim() || undefined,
  });

  const [tableColumns, setTableColumns] = useColumnVisibility(REVIEW_TABLE_COLUMNS);
  const [riderTableColumns, setRiderTableColumns] = useColumnVisibility(RIDER_REVIEW_TABLE_COLUMNS);
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [selectedRiderRowIndex, setSelectedRiderRowIndex] = useState(0);

  const { data: flaggedCountData } = useAdminReviewFlaggedCount();
  const { data: sellersData } = useAdminSellers();
  const sellers = sellersData ?? [];

  const { data: reviewDetail } = useAdminReviewDetail(selectedReview?.id || null);
  const flagReview = useFlagReviewMutation();
  const unflagReview = useUnflagReviewMutation();
  const deleteReview = useDeleteReviewMutation();
  const confirmation = useConfirmation();

  const { data: riderData, isLoading: riderLoading, isError: riderError, error: riderErr, refetch: riderRefetch, dataUpdatedAt: riderDataUpdatedAt } = useAdminRiderRatings({
    page: riderPage,
    limit: 10,
  });

  const rawReviews = data?.reviews ?? [];
  const pagination = data?.pagination;

  // Client-side: search by reviewer name or product title (when API doesn't support search)
  const reviewsFilteredBySearch = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rawReviews;
    return rawReviews.filter(
      (r) =>
        r.userName.toLowerCase().includes(q) ||
        r.productTitle.toLowerCase().includes(q)
    );
  }, [rawReviews, searchQuery]);

  // Flagged first, then by date desc
  const sortedReviews = useMemo(() => {
    return [...reviewsFilteredBySearch].sort((a, b) => {
      if (a.flagged !== b.flagged) return a.flagged ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [reviewsFilteredBySearch]);

  const riderRatings = riderData?.ratings ?? [];
  const riderPagination = riderData?.pagination;

  const openDetail = (review: AdminReview) => {
    setSelectedRiderRating(null);
    setSelectedReview(review);
  };
  const openRiderDetail = (rating: AdminRiderRating) => {
    setSelectedReview(null);
    setSelectedRiderRating(rating);
  };

  const visibleCols = tableColumns.filter((c) => c.visible);
  const riderVisibleCols = riderTableColumns.filter((c) => c.visible);
  const { getRowProps } = useTableKeyboardNav({
    rowCount: sortedReviews.length,
    selectedIndex: selectedRowIndex,
    onSelectIndex: setSelectedRowIndex,
    onOpenRow: (index) => openDetail(sortedReviews[index]!),
    enabled: sortedReviews.length > 0 && activeTab === 'products',
  });
  const { getRowProps: getRiderRowProps } = useTableKeyboardNav({
    rowCount: riderRatings.length,
    selectedIndex: selectedRiderRowIndex,
    onSelectIndex: setSelectedRiderRowIndex,
    onOpenRow: (index) => openRiderDetail(riderRatings[index]!),
    enabled: riderRatings.length > 0 && activeTab === 'riders',
  });

  const handleExportReviewsCSV = () => {
    const cols = visibleCols.filter((c) => c.id !== 'actions').map((c) => ({ id: c.id, label: c.label }));
    const rows = sortedReviews.map((r) => ({
      reviewer: r.userName,
      product: r.productTitle,
      rating: r.rating,
      review: (r.comment || '').slice(0, 200),
      date: new Date(r.createdAt).toLocaleDateString(),
      status: r.flagged ? 'Flagged' : 'Clean',
    }));
    const csv = buildCSV(cols, rows);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `reviews-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportRiderRatingsCSV = () => {
    const cols = riderVisibleCols.filter((c) => c.id !== 'actions').map((c) => ({ id: c.id, label: c.label }));
    const rows = riderRatings.map((r) => ({
      reviewer: r.userName || r.user?.name || '—',
      rider: r.riderName || '—',
      rating: r.rating,
      review: (r.comment || '').slice(0, 200),
      date: new Date(r.createdAt).toLocaleDateString(),
      status: 'Clean',
    }));
    const csv = buildCSV(cols, rows);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `rider-ratings-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // Product tab stats (independent)
  const productStats = useMemo(() => {
    const total = pagination?.total ?? 0;
    const flagged = flaggedCountData?.total ?? 0;
    const clean = total - flagged;
    const avgRating =
      rawReviews.length > 0
        ? rawReviews.reduce((sum, r) => sum + r.rating, 0) / rawReviews.length
        : 0;
    const distribution = ratingDistributionFromReviews(rawReviews);
    return {
      total,
      flagged,
      avgRating: rawReviews.length > 0 ? avgRating.toFixed(1) : '—',
      clean,
      distribution,
    };
  }, [pagination?.total, flaggedCountData?.total, rawReviews]);

  // Rider tab stats (independent)
  const riderStats = useMemo(() => {
    const total = riderPagination?.total ?? 0;
    const flagged = 0; // API can add later
    const disputes = 0; // API can add later
    const avgRating =
      riderRatings.length > 0
        ? riderRatings.reduce((sum, r) => sum + r.rating, 0) / riderRatings.length
        : 0;
    const distribution = ratingDistributionFromReviews(riderRatings);
    return {
      total,
      flagged,
      avgRating: riderRatings.length > 0 ? avgRating.toFixed(1) : '—',
      disputes,
      distribution,
    };
  }, [riderPagination?.total, riderRatings]);

  const handleFlag = () => {
    if (!selectedReview) return;
    setFlagReason('');
    setShowFlagModal(true);
  };

  const handleFlagSubmit = async () => {
    if (!selectedReview || !flagReason.trim()) {
      toast.error('Please provide a reason for flagging');
      return;
    }
    await flagReview.mutateAsync({ reviewId: selectedReview.id, flagReason });
    setShowFlagModal(false);
    setSelectedReview(null);
    refetch();
  };

  const handleUnflag = async (review: AdminReview) => {
    await unflagReview.mutateAsync(review.id);
    setSelectedReview(null);
    refetch();
  };

  const handleDelete = async (review: AdminReview) => {
    const confirmed = await confirmation.confirm({
      title: 'Delete Review',
      message: `Are you sure you want to delete this review from ${review.userName}?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;
    confirmation.setLoading(true);
    try {
      await deleteReview.mutateAsync(review.id);
      setSelectedReview(null);
      refetch();
    } catch {
      // Error handled by mutation
    } finally {
      confirmation.setLoading(false);
    }
  };

  const detailItem = selectedReview && (reviewDetail || selectedReview);
  const isRiderDetail = Boolean(selectedRiderRating);

  return (
    <Fragment>
      <AdminLayout>
        <div className="min-h-screen bg-[#090c11]">
          <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
            <AdminPageHeader
              title="Reviews"
              tag="Review Moderation"
              subtitle="Monitor product reviews and rider ratings"
            />

            <div className="mb-6 flex gap-2 border-b border-[#1f2432]">
              <button
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  activeTab === 'products'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Product Reviews
              </button>
              <button
                onClick={() => setActiveTab('riders')}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  activeTab === 'riders'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Truck className="h-4 w-4" />
                Rider Reviews
              </button>
            </div>

            {/* ---------- Product Reviews Tab ---------- */}
            {activeTab === 'products' && (
              <>
                <section className="mb-10 grid gap-4 sm:grid-cols-4">
                  <AdminCard title="Total" description="All product reviews">
                    <p className="text-3xl font-bold text-primary">{productStats.total}</p>
                  </AdminCard>
                  <AdminCard title="Flagged" description="Reviews requiring attention">
                    <p className="text-3xl font-bold text-yellow-400">{productStats.flagged}</p>
                  </AdminCard>
                  <AdminCard title="Average Rating" description="Overall product rating">
                    <p className="text-3xl font-bold text-green-400">{productStats.avgRating}</p>
                    <RatingDistributionBar distribution={productStats.distribution} className="mt-3" />
                  </AdminCard>
                  <AdminCard title="Clean" description="Unflagged reviews">
                    <p className="text-3xl font-bold text-blue-400">{productStats.clean}</p>
                  </AdminCard>
                </section>

                <AdminToolbar className="mb-6 flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Status</span>
                    {STATUS_OPTIONS.map((status) => (
                      <AdminFilterChip
                        key={status}
                        active={statusFilter === status}
                        onClick={() => {
                          setStatusFilter(status);
                          setPage(1);
                        }}
                      >
                        {status}
                      </AdminFilterChip>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Rating</span>
                    {RATING_FILTERS.map((rating) => (
                      <AdminFilterChip
                        key={rating}
                        active={ratingFilter === rating}
                        onClick={() => {
                          setRatingFilter(rating);
                          setPage(1);
                        }}
                      >
                        {rating === 'ALL' ? 'ALL' : `${rating} ★`}
                      </AdminFilterChip>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Seller</span>
                    <select
                      value={sellerFilter}
                      onChange={(e) => {
                        setSellerFilter(e.target.value);
                        setPage(1);
                      }}
                      className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-1.5 text-sm text-white focus:border-primary focus:outline-none"
                    >
                      <option value="">All sellers</option>
                      {sellers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.businessName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="ml-auto flex flex-1 min-w-[200px] max-w-sm items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-1.5">
                    <Search className="h-4 w-4 shrink-0 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by reviewer or product..."
                      className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                    />
                  </div>
                </AdminToolbar>

                {isLoading ? (
                  <LoadingState label="Loading reviews..." />
                ) : isError ? (
                  <AdminEmptyState
                    icon={<MessageSquare className="h-5 w-5" />}
                    title="Error loading reviews"
                    description={error instanceof Error ? error.message : 'Failed to load reviews'}
                    action={
                      <button
                        onClick={() => refetch()}
                        className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light"
                      >
                        Retry
                      </button>
                    }
                  />
                ) : sortedReviews.length === 0 ? (
                  <AdminEmptyState
                    icon={<MessageSquare className="h-5 w-5" />}
                    title="No reviews found"
                    description="No reviews match your current filters"
                  />
                ) : (
                  <>
                    <AdminTableToolbar
                      columns={tableColumns}
                      onColumnsChange={setTableColumns}
                      onExportCSV={handleExportReviewsCSV}
                      lastUpdatedAt={dataUpdatedAt}
                      onRefresh={() => refetch()}
                      isRefreshing={isLoading}
                      className="mb-4"
                    />
                    <DataTableContainer>
                      <DataTable>
                        <DataTableHead>
                          <tr>
                            {visibleCols.map((c) => (
                              <th
                                key={c.id}
                                className={c.id === 'actions' ? 'px-6 py-4 text-right text-gray-500' : 'px-6 py-4 text-left text-white'}
                              >
                                {c.label}
                              </th>
                            ))}
                          </tr>
                        </DataTableHead>
                        <DataTableBody>
                          {sortedReviews.map((review, index) => {
                            const rowProps = getRowProps(index);
                            const isSelected = rowProps['data-selected'];
                            return (
                              <tr
                                key={review.id}
                                {...rowProps}
                                onClick={() => {
                                  setSelectedRowIndex(index);
                                  openDetail(review);
                                }}
                                className={clsx(
                                  'cursor-pointer transition hover:bg-[#1a1a1a]',
                                  isSelected && 'bg-[#10151d] ring-1 ring-inset ring-primary/50'
                                )}
                              >
                                {visibleCols.some((c) => c.id === 'reviewer') && (
                                  <DataTableCell onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-xs font-semibold text-gray-300">
                                        {getInitials(review.userName)}
                                      </div>
                                      <div>
                                        <p className="font-medium text-white">{review.userName}</p>
                                        <p className="text-xs text-gray-400">{review.userEmail}</p>
                                      </div>
                                    </div>
                                  </DataTableCell>
                                )}
                                {visibleCols.some((c) => c.id === 'product') && (
                                  <DataTableCell>
                                    <p className="max-w-[200px] truncate font-medium text-white">
                                      {review.productTitle}
                                    </p>
                                  </DataTableCell>
                                )}
                                {visibleCols.some((c) => c.id === 'rating') && (
                                  <DataTableCell>{renderStars(review.rating)}</DataTableCell>
                                )}
                                {visibleCols.some((c) => c.id === 'review') && (
                                  <DataTableCell>
                                    <p className="max-w-[280px] truncate text-gray-300">
                                      {excerpt(review.comment)}
                                    </p>
                                  </DataTableCell>
                                )}
                                {visibleCols.some((c) => c.id === 'date') && (
                                  <DataTableCell>
                                    <p className="text-gray-300">
                                      {new Date(review.createdAt).toLocaleDateString()}
                                    </p>
                                  </DataTableCell>
                                )}
                                {visibleCols.some((c) => c.id === 'status') && (
                                  <DataTableCell>
                                    <StatusBadge
                                      tone={getStatusTone(review.flagged ? 'FLAGGED' : 'CLEAN')}
                                      label={review.flagged ? 'Flagged' : 'Clean'}
                                    />
                                  </DataTableCell>
                                )}
                                {visibleCols.some((c) => c.id === 'actions') && (
                                  <DataTableCell onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-1">
                                  {review.flagged && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUnflag(review);
                                      }}
                                      className="rounded border border-[#2a2a2a] p-1.5 text-gray-400 hover:border-primary hover:text-primary"
                                      title="Approve / Unflag"
                                    >
                                      <Check className="h-4 w-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedReview(review);
                                      handleFlag();
                                    }}
                                    className="rounded border border-[#2a2a2a] p-1.5 text-gray-400 hover:border-yellow-500 hover:text-yellow-500"
                                    title="Flag"
                                  >
                                    <Flag className="h-4 w-4" />
                                  </button>
                                  <button
                                    className="rounded border border-[#2a2a2a] p-1.5 text-gray-400 hover:border-gray-500 hover:text-white"
                                    title="Hide"
                                  >
                                    <EyeOff className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(review);
                                    }}
                                    className="rounded border border-[#2a2a2a] p-1.5 text-gray-400 hover:border-red-500 hover:text-red-400"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
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
                    {pagination && pagination.totalPages > 1 && (
                      <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        onPageChange={setPage}
                      />
                    )}
                  </>
                )}
              </>
            )}

            {/* ---------- Rider Reviews Tab ---------- */}
            {activeTab === 'riders' && (
              <>
                <section className="mb-10 grid gap-4 sm:grid-cols-4">
                  <AdminCard title="Total Rides Rated" description="All rider ratings">
                    <p className="text-3xl font-bold text-primary">{riderStats.total}</p>
                  </AdminCard>
                  <AdminCard title="Flagged" description="Rider reviews flagged">
                    <p className="text-3xl font-bold text-yellow-400">{riderStats.flagged}</p>
                  </AdminCard>
                  <AdminCard title="Average Rider Rating" description="Overall rider rating">
                    <p className="text-3xl font-bold text-green-400">{riderStats.avgRating}</p>
                    <RatingDistributionBar distribution={riderStats.distribution} className="mt-3" />
                  </AdminCard>
                  <AdminCard title="Disputes" description="Open disputes">
                    <p className="text-3xl font-bold text-amber-400">{riderStats.disputes}</p>
                  </AdminCard>
                </section>

                <AdminToolbar className="mb-6 flex-wrap gap-3">
                  <div className="flex flex-1 min-w-[200px] max-w-sm items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-1.5">
                    <Search className="h-4 w-4 shrink-0 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search by rider or reviewer..."
                      className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                    />
                  </div>
                </AdminToolbar>

                {riderLoading ? (
                  <LoadingState label="Loading rider ratings..." />
                ) : riderError ? (
                  <AdminEmptyState
                    icon={<Truck className="h-5 w-5" />}
                    title="Error loading rider ratings"
                    description={riderErr instanceof Error ? riderErr.message : 'Failed to load rider ratings'}
                    action={
                      <button
                        onClick={() => riderRefetch()}
                        className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light"
                      >
                        Retry
                      </button>
                    }
                  />
                ) : riderRatings.length === 0 ? (
                  <AdminEmptyState
                    icon={<Truck className="h-5 w-5" />}
                    title="No rider ratings found"
                    description="Riders have not received any ratings yet"
                  />
                ) : (
                  <>
                    <AdminTableToolbar
                      columns={riderTableColumns}
                      onColumnsChange={setRiderTableColumns}
                      onExportCSV={handleExportRiderRatingsCSV}
                      lastUpdatedAt={riderDataUpdatedAt}
                      onRefresh={() => riderRefetch()}
                      isRefreshing={riderLoading}
                      className="mb-4"
                    />
                    <DataTableContainer>
                      <DataTable>
                        <DataTableHead>
                          <tr>
                            {riderVisibleCols.map((c) => (
                              <th
                                key={c.id}
                                className={c.id === 'actions' ? 'px-6 py-4 text-right text-gray-500' : 'px-6 py-4 text-left text-white'}
                              >
                                {c.label}
                              </th>
                            ))}
                          </tr>
                        </DataTableHead>
                        <DataTableBody>
                          {riderRatings.map((rating, index) => {
                            const rowProps = getRiderRowProps(index);
                            const isSelected = rowProps['data-selected'];
                            return (
                              <tr
                                key={rating.id}
                                {...rowProps}
                                onClick={() => {
                                  setSelectedRiderRowIndex(index);
                                  openRiderDetail(rating);
                                }}
                                className={clsx(
                                  'cursor-pointer transition hover:bg-[#1a1a1a]',
                                  isSelected && 'bg-[#10151d] ring-1 ring-inset ring-primary/50'
                                )}
                              >
                                {riderVisibleCols.some((c) => c.id === 'reviewer') && (
                                  <DataTableCell onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-xs font-semibold text-gray-300">
                                        {getInitials(rating.userName || rating.user?.name || '?')}
                                      </div>
                                      <div>
                                        <p className="font-medium text-white">
                                          {rating.userName || rating.user?.name || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-gray-400">{rating.userEmail || '—'}</p>
                                      </div>
                                    </div>
                                  </DataTableCell>
                                )}
                                {riderVisibleCols.some((c) => c.id === 'rider') && (
                                  <DataTableCell>
                                    <div>
                                      <p className="font-medium text-white">{rating.riderName || 'Unknown'}</p>
                                      <p className="text-xs text-gray-400">{rating.riderEmail || '—'}</p>
                                    </div>
                                  </DataTableCell>
                                )}
                                {riderVisibleCols.some((c) => c.id === 'rating') && (
                                  <DataTableCell>{renderStars(rating.rating)}</DataTableCell>
                                )}
                                {riderVisibleCols.some((c) => c.id === 'review') && (
                                  <DataTableCell>
                                    <p className="max-w-[280px] truncate text-gray-300">
                                      {excerpt(rating.comment)}
                                    </p>
                                  </DataTableCell>
                                )}
                                {riderVisibleCols.some((c) => c.id === 'date') && (
                                  <DataTableCell>
                                    <p className="text-gray-300">
                                      {new Date(rating.createdAt).toLocaleDateString()}
                                    </p>
                                  </DataTableCell>
                                )}
                                {riderVisibleCols.some((c) => c.id === 'status') && (
                                  <DataTableCell>
                                    <StatusBadge tone={getStatusTone('CLEAN')} label="Clean" />
                                  </DataTableCell>
                                )}
                                {riderVisibleCols.some((c) => c.id === 'actions') && (
                                  <DataTableCell onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-1">
                                  <button
                                    className="rounded border border-[#2a2a2a] p-1.5 text-gray-400 hover:border-primary hover:text-primary"
                                    title="Approve"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    className="rounded border border-[#2a2a2a] p-1.5 text-gray-400 hover:border-yellow-500 hover:text-yellow-500"
                                    title="Flag"
                                  >
                                    <Flag className="h-4 w-4" />
                                  </button>
                                  <button
                                    className="rounded border border-[#2a2a2a] p-1.5 text-gray-400 hover:border-gray-500 hover:text-white"
                                    title="Hide"
                                  >
                                    <EyeOff className="h-4 w-4" />
                                  </button>
                                  <button
                                    className="rounded border border-[#2a2a2a] p-1.5 text-gray-400 hover:border-red-500 hover:text-red-400"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
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
                    {riderPagination && riderPagination.totalPages > 1 && (
                      <Pagination
                        currentPage={riderPagination.page}
                        totalPages={riderPagination.totalPages}
                        onPageChange={setRiderPage}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Product Review Detail Drawer */}
        <AdminDrawer
          open={Boolean(detailItem && !isRiderDetail)}
          onClose={() => {
            setSelectedReview(null);
            setDetailReply('');
          }}
          title={detailItem ? `Review by ${detailItem.userName}` : ''}
          description={detailItem ? detailItem.productTitle : ''}
          footer={
            detailItem ? (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between gap-3">
                  <button
                    onClick={() => handleDelete(detailItem as AdminReview)}
                    disabled={deleteReview.isPending}
                    className="rounded-full border border-red-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-red-400 transition hover:bg-red-700 hover:text-white disabled:opacity-50"
                  >
                    {deleteReview.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                  {detailItem.flagged ? (
                    <button
                      onClick={() => handleUnflag(detailItem as AdminReview)}
                      disabled={unflagReview.isPending}
                      className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light disabled:opacity-50"
                    >
                      {unflagReview.isPending ? 'Unflagging...' : 'Approve / Unflag'}
                    </button>
                  ) : (
                    <button
                      onClick={handleFlag}
                      className="rounded-full border border-yellow-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-yellow-400 transition hover:bg-yellow-700 hover:text-black"
                    >
                      Flag
                    </button>
                  )}
                </div>
                <div className="border-t border-[#1f1f1f] pt-3">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Reply as Admin
                  </label>
                  <textarea
                    value={detailReply}
                    onChange={(e) => setDetailReply(e.target.value)}
                    placeholder="Write a public reply..."
                    className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                    rows={2}
                  />
                  <button
                    type="button"
                    className="mt-2 rounded-full bg-[#2a2a2a] px-4 py-1.5 text-xs font-semibold text-gray-300 hover:bg-primary hover:text-black"
                  >
                    Post Reply
                  </button>
                </div>
              </div>
            ) : null
          }
        >
          {detailItem && !isRiderDetail && (
            <div className="space-y-6">
              {reviewDetail?.productImage && (
                <div className="overflow-hidden rounded-lg">
                  <img
                    src={reviewDetail.productImage}
                    alt={detailItem.productTitle}
                    className="h-48 w-full object-cover"
                  />
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Sentiment
                </span>
                <SentimentTag label={getSentiment(detailItem.comment)} />
              </div>
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Rating</h4>
                {renderStars(detailItem.rating)}
              </div>
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Full review
                </h4>
                <p className="text-gray-300 whitespace-pre-wrap">{detailItem.comment}</p>
              </div>
              {detailItem.flagged && detailItem.flagReason && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-yellow-400">
                    Reported reason
                  </h4>
                  <p className="text-gray-300">{detailItem.flagReason}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Customer
                  </h4>
                  <p className="text-white">{detailItem.userName}</p>
                  <p className="text-xs text-gray-400">{detailItem.userEmail}</p>
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Product
                  </h4>
                  <p className="text-white">{detailItem.productTitle}</p>
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Date
                  </h4>
                  <p className="text-white">
                    {new Date(detailItem.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </AdminDrawer>

        {/* Rider Review Detail Drawer */}
        <AdminDrawer
          open={isRiderDetail}
          onClose={() => setSelectedRiderRating(null)}
          title={selectedRiderRating ? `Rating by ${selectedRiderRating.userName || selectedRiderRating.user?.name || 'Customer'}` : ''}
          description={selectedRiderRating ? `Rider: ${selectedRiderRating.riderName || 'Unknown'}` : ''}
        >
          {selectedRiderRating && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Sentiment</span>
                <SentimentTag label={getSentiment(selectedRiderRating.comment)} />
              </div>
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Rating</h4>
                {renderStars(selectedRiderRating.rating)}
              </div>
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Comment</h4>
                <p className="text-gray-300 whitespace-pre-wrap">{selectedRiderRating.comment || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Reviewer</h4>
                  <p className="text-white">{selectedRiderRating.userName || selectedRiderRating.user?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-400">{selectedRiderRating.userEmail || '—'}</p>
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Rider</h4>
                  <p className="text-white">{selectedRiderRating.riderName || 'Unknown'}</p>
                  <p className="text-xs text-gray-400">Order: {selectedRiderRating.orderId?.slice(0, 12)}…</p>
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Date</h4>
                  <p className="text-white">
                    {new Date(selectedRiderRating.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </AdminDrawer>

        {/* Flag Modal */}
        {showFlagModal && selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-lg rounded-lg bg-[#0f1729] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Flag Review</h3>
                <button
                  onClick={() => {
                    setShowFlagModal(false);
                    setFlagReason('');
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">
                    Reason for flagging this review
                  </label>
                  <textarea
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2 text-white focus:border-primary focus:outline-none"
                    rows={4}
                    placeholder="e.g., Contains inappropriate language, spam, or violates guidelines..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowFlagModal(false);
                      setFlagReason('');
                    }}
                    className="rounded-full border border-gray-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFlagSubmit}
                    disabled={flagReview.isPending || !flagReason.trim()}
                    className="rounded-full bg-yellow-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-yellow-500 disabled:opacity-50"
                  >
                    {flagReview.isPending ? 'Flagging...' : 'Flag Review'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
      <ConfirmationDialog
        open={confirmation.open}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        variant={confirmation.variant}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
        loading={confirmation.loading}
      />
    </Fragment>
  );
}
