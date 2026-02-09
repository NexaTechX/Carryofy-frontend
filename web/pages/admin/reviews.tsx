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
} from '../../components/admin/ui';
import {
  useAdminReviews,
  useAdminReviewDetail,
  useFlagReviewMutation,
  useUnflagReviewMutation,
  useDeleteReviewMutation,
  AdminReview,
} from '../../lib/admin/hooks/useAdminReviews';
import { useAdminRiderRatings } from '../../lib/admin/hooks/useAdminRiderRatings';
import { toast } from 'react-hot-toast';
import { MessageSquare, Star, X, Truck } from 'lucide-react';
import { useConfirmation } from '../../lib/hooks/useConfirmation';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';

const RATING_FILTERS = ['ALL', 5, 4, 3, 2, 1] as const;

type TabType = 'products' | 'riders';

export default function AdminReviews() {
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [page, setPage] = useState(1);
  const [riderPage, setRiderPage] = useState(1);
  const [flaggedFilter, setFlaggedFilter] = useState<'ALL' | 'FLAGGED' | 'UNFLAGGED'>('ALL');
  const [ratingFilter, setRatingFilter] = useState<typeof RATING_FILTERS[number]>('ALL');
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [showFlagModal, setShowFlagModal] = useState(false);

  const { data, isLoading, isError, error, refetch } = useAdminReviews({
    page,
    limit: 10,
    flaggedOnly:
      flaggedFilter === 'FLAGGED' ? true : flaggedFilter === 'UNFLAGGED' ? false : undefined,
    rating: ratingFilter === 'ALL' ? undefined : ratingFilter,
  });

  const { data: reviewDetail } = useAdminReviewDetail(selectedReview?.id || null);
  const flagReview = useFlagReviewMutation();
  const unflagReview = useUnflagReviewMutation();
  const deleteReview = useDeleteReviewMutation();
  const confirmation = useConfirmation();

  const { data: riderData, isLoading: riderLoading, isError: riderError, error: riderErr, refetch: riderRefetch } = useAdminRiderRatings({
    page: riderPage,
    limit: 10,
  });

  const reviews = data?.reviews || [];
  const pagination = data?.pagination;
  const riderRatings = riderData?.ratings || [];
  const riderPagination = riderData?.pagination;

  const stats = useMemo(() => {
    const flagged = reviews.filter((r) => r.flagged).length;
    const avgRating =
      reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

    return {
      total: pagination?.total || 0,
      flagged,
      avgRating: avgRating.toFixed(1),
      unflagged: reviews.length - flagged,
    };
  }, [reviews, pagination]);

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
    } catch (error) {
      // Error is handled by the mutation
    } finally {
      confirmation.setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
          />
        ))}
      </div>
    );
  };

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

          {/* Tabs */}
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

          {/* Product Reviews Tab */}
          {activeTab === 'products' && (
          <>
          {/* Stats Cards */}
          <section className="mb-10 grid gap-4 sm:grid-cols-4">
            <AdminCard title="Total Reviews" description="All product reviews">
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
            </AdminCard>
            <AdminCard title="Flagged Reviews" description="Reviews requiring attention">
              <p className="text-3xl font-bold text-yellow-400">{stats.flagged}</p>
            </AdminCard>
            <AdminCard title="Average Rating" description="Overall product rating">
              <p className="text-3xl font-bold text-green-400">{stats.avgRating}</p>
            </AdminCard>
            <AdminCard title="Clean Reviews" description="Unflagged reviews">
              <p className="text-3xl font-bold text-blue-400">{stats.unflagged}</p>
            </AdminCard>
          </section>

          {/* Filters */}
          <AdminToolbar className="mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Status:</span>
              {(['ALL', 'FLAGGED', 'UNFLAGGED'] as const).map((status) => (
                <AdminFilterChip
                  key={status}
                  active={flaggedFilter === status}
                  onClick={() => {
                    setFlaggedFilter(status);
                    setPage(1);
                  }}
                >
                  {status}
                </AdminFilterChip>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Rating:</span>
              {RATING_FILTERS.map((rating) => (
                <AdminFilterChip
                  key={rating}
                  active={ratingFilter === rating}
                  onClick={() => {
                    setRatingFilter(rating);
                    setPage(1);
                  }}
                >
                  {rating === 'ALL' ? 'ALL' : `${rating} ⭐`}
                </AdminFilterChip>
              ))}
            </div>
          </AdminToolbar>

          {/* Reviews Table */}
          {isLoading ? (
            <LoadingState label="Loading reviews..." />
          ) : isError ? (
            <AdminEmptyState
              icon={<MessageSquare className="h-5 w-5" />}
              title="Error loading reviews"
              description={error instanceof Error ? error.message : 'Failed to load reviews'}
              action={(
                <button
                  onClick={() => refetch()}
                  className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light"
                >
                  Retry
                </button>
              )}
            />
          ) : reviews.length === 0 ? (
            <AdminEmptyState
              icon={<MessageSquare className="h-5 w-5" />}
              title="No reviews found"
              description="No reviews match your current filters"
            />
          ) : (
            <>
              <DataTableContainer>
                <DataTable>
                  <DataTableHead columns={['Product', 'Customer', 'Rating', 'Review', 'Status', 'Date', 'Actions']} />
                  <DataTableBody>
                    {reviews.map((review) => (
                      <tr key={review.id}>
                        <DataTableCell>
                          <p className="max-w-[200px] truncate font-medium text-white">{review.productTitle}</p>
                        </DataTableCell>
                        <DataTableCell>
                          <div>
                            <p className="font-medium text-white">{review.userName}</p>
                            <p className="text-xs text-gray-400">{review.userEmail}</p>
                          </div>
                        </DataTableCell>
                        <DataTableCell>{renderStars(review.rating)}</DataTableCell>
                        <DataTableCell>
                          <p className="max-w-[300px] truncate text-gray-300">{review.comment}</p>
                        </DataTableCell>
                        <DataTableCell>
                          <StatusBadge
                            tone={review.flagged ? 'warning' : 'success'}
                            label={review.flagged ? 'Flagged' : 'Clean'}
                          />
                        </DataTableCell>
                        <DataTableCell>
                          <p className="text-gray-300">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </DataTableCell>
                        <DataTableCell>
                          <button
                            onClick={() => setSelectedReview(review)}
                            className="rounded-full border border-gray-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary"
                          >
                            View
                          </button>
                        </DataTableCell>
                      </tr>
                    ))}
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

          {/* Rider Reviews Tab */}
          {activeTab === 'riders' && (
            <>
              <section className="mb-6 grid gap-4 sm:grid-cols-2">
                <AdminCard title="Total Rider Ratings" description="All rider ratings">
                  <p className="text-3xl font-bold text-primary">{riderPagination?.total ?? 0}</p>
                </AdminCard>
                <AdminCard title="Average Rating" description="From current page">
                  <p className="text-3xl font-bold text-green-400">
                    {riderRatings.length > 0
                      ? (riderRatings.reduce((sum, r) => sum + r.rating, 0) / riderRatings.length).toFixed(1)
                      : '-'}
                  </p>
                </AdminCard>
              </section>

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
                  <DataTableContainer>
                    <DataTable>
                      <DataTableHead columns={['Rider', 'Customer', 'Rating', 'Comment', 'Order ID', 'Date']} />
                      <DataTableBody>
                        {riderRatings.map((rating) => (
                          <tr key={rating.id}>
                            <DataTableCell>
                              <div>
                                <p className="font-medium text-white">{rating.riderName || 'Unknown'}</p>
                                <p className="text-xs text-gray-400">{rating.riderEmail || '-'}</p>
                              </div>
                            </DataTableCell>
                            <DataTableCell>
                              <div>
                                <p className="font-medium text-white">{rating.userName || rating.user?.name || 'Unknown'}</p>
                                <p className="text-xs text-gray-400">{rating.userEmail || '-'}</p>
                              </div>
                            </DataTableCell>
                            <DataTableCell>{renderStars(rating.rating)}</DataTableCell>
                            <DataTableCell>
                              <p className="max-w-[250px] truncate text-gray-300">{rating.comment || '-'}</p>
                            </DataTableCell>
                            <DataTableCell>
                              <p className="font-mono text-xs text-gray-400">{rating.orderId?.slice(0, 8)}...</p>
                            </DataTableCell>
                            <DataTableCell>
                              <p className="text-gray-300">{new Date(rating.createdAt).toLocaleDateString()}</p>
                            </DataTableCell>
                          </tr>
                        ))}
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

      {/* Review Detail Drawer */}
      <AdminDrawer
        open={Boolean(selectedReview)}
        onClose={() => setSelectedReview(null)}
        title={`Review by ${reviewDetail?.userName || selectedReview?.userName || 'Customer'}`}
        description={reviewDetail?.productTitle || selectedReview?.productTitle || ''}
        footer={
          reviewDetail ? (
            <div className="flex justify-between gap-3">
              <button
                onClick={() => handleDelete(reviewDetail as AdminReview)}
                disabled={deleteReview.isPending}
                className="rounded-full border border-red-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-red-400 transition hover:bg-red-700 hover:text-white disabled:opacity-50"
              >
                {deleteReview.isPending ? 'Deleting...' : 'Delete Review'}
              </button>

              {reviewDetail.flagged ? (
                <button
                  onClick={() => handleUnflag(reviewDetail as AdminReview)}
                  disabled={unflagReview.isPending}
                  className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light disabled:opacity-50"
                >
                  {unflagReview.isPending ? 'Unflagging...' : 'Unflag Review'}
                </button>
              ) : (
                <button
                  onClick={handleFlag}
                  className="rounded-full border border-yellow-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-yellow-400 transition hover:bg-yellow-700 hover:text-black"
                >
                  Flag as Inappropriate
                </button>
              )}
            </div>
          ) : null
        }
      >
        {reviewDetail && (
          <div className="space-y-6">
            {reviewDetail.productImage && (
              <div className="rounded-lg overflow-hidden">
                <img src={reviewDetail.productImage} alt={reviewDetail.productTitle} className="w-full h-48 object-cover" />
              </div>
            )}

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Rating</h4>
              {renderStars(reviewDetail.rating)}
            </div>

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Review Comment</h4>
              <p className="text-gray-300">{reviewDetail.comment}</p>
            </div>

            {reviewDetail.flagged && reviewDetail.flagReason && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-yellow-400">Flag Reason</h4>
                <p className="text-gray-300">{reviewDetail.flagReason}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Customer</h4>
                <p className="text-white">{reviewDetail.userName}</p>
                <p className="text-xs text-gray-400">{reviewDetail.userEmail}</p>
              </div>

              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Review Date</h4>
                <p className="text-white">{new Date(reviewDetail.createdAt).toLocaleDateString()}</p>
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

