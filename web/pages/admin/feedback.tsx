import { useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  AdminCard,
  AdminEmptyState,
  AdminPageHeader,
  AdminToolbar,
  LoadingState,
  StatusBadge,
} from '../../components/admin/ui';
import { useFeedbacks, useDeleteFeedbackMutation } from '../../lib/admin/hooks/useFeedback';
import { Feedback } from '../../lib/admin/types';
import { Star, MessageSquare, Trash2, User, RefreshCw } from 'lucide-react';

const FEEDBACK_FILTERS: Array<{ id: 'all' | string; label: string }> = [
  { id: 'all', label: 'All Feedback' },
  { id: 'general', label: 'General' },
  { id: 'products', label: 'Products' },
  { id: 'website', label: 'Website' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'customer-service', label: 'Customer Service' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'suggestion', label: 'Suggestion' },
];

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

const RATING_TONE: Record<number, 'danger' | 'warning' | 'info' | 'success'> = {
  1: 'danger',
  2: 'warning',
  3: 'info',
  4: 'success',
  5: 'success',
};

const formatDateTime = (iso: string) => new Date(iso).toLocaleString();

const formatCategory = (category: string) => {
  return category
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function AdminFeedback() {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);

  const { data: feedbacks, isLoading: feedbacksLoading, isError: feedbacksError, error: feedbacksErrorObj, refetch: refetchFeedbacks } =
    useFeedbacks();
  const deleteFeedback = useDeleteFeedbackMutation();

  const selectedFeedback = useMemo<Feedback | undefined>(() => {
    if (!feedbacks || feedbacks.length === 0) return undefined;
    const initial = selectedFeedbackId ?? feedbacks[0]?.id;
    return feedbacks.find((feedback) => feedback.id === initial);
  }, [feedbacks, selectedFeedbackId]);

  const filteredFeedbacks = useMemo(() => {
    if (!feedbacks) return [];
    return feedbacks.filter((feedback) => {
      const matchesSearch = search
        ? feedback.feedback.toLowerCase().includes(search.toLowerCase()) ||
          feedback.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
          feedback.user?.email?.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesFilter = activeFilter === 'all' ? true : feedback.category === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [feedbacks, search, activeFilter]);

  const handleDeleteFeedback = (feedbackId: string) => {
    if (confirm('Are you sure you want to delete this feedback?')) {
      deleteFeedback.mutate(feedbackId);
      if (selectedFeedbackId === feedbackId) {
        setSelectedFeedbackId(null);
      }
    }
  };

  const averageRating = useMemo(() => {
    if (!feedbacks || feedbacks.length === 0) return 0;
    const sum = feedbacks.reduce((acc, feedback) => acc + feedback.rating, 0);
    return (sum / feedbacks.length).toFixed(1);
  }, [feedbacks]);

  const ratingDistribution = useMemo(() => {
    if (!feedbacks) return {};
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbacks.forEach((feedback) => {
      distribution[feedback.rating] = (distribution[feedback.rating] || 0) + 1;
    });
    return distribution;
  }, [feedbacks]);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Buyer Feedback"
            tag="Customer Insights"
            subtitle="View and manage buyer feedback about their shopping experience."
          />

          {/* Refresh Button */}
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => refetchFeedbacks()}
              disabled={feedbacksLoading}
              className="flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#151515] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RefreshCw className={`h-4 w-4 ${feedbacksLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <AdminCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Total Feedback</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{feedbacks?.length ?? 0}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
            </AdminCard>
            <AdminCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Average Rating</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{averageRating} ⭐</p>
                </div>
                <Star className="h-8 w-8 text-primary" />
              </div>
            </AdminCard>
            <AdminCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">5 Star Ratings</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{ratingDistribution[5] ?? 0}</p>
                </div>
                <Star className="h-8 w-8 fill-primary text-primary" />
              </div>
            </AdminCard>
          </div>

          <section className="mb-10 grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-4">
              <AdminToolbar className="mb-4">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search feedback"
                  className="w-full rounded-full border border-[#2a2a2a] bg-[#151515] px-4 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
              </AdminToolbar>
              <div className="flex flex-wrap gap-2 pb-4">
                {FEEDBACK_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                      activeFilter === filter.id
                        ? 'bg-primary text-black'
                        : 'border border-[#2a2a2a] bg-[#151515] text-gray-300 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {feedbacksLoading ? (
                <LoadingState />
              ) : feedbacksError ? (
                <AdminEmptyState
                  title="Unable to load feedback"
                  description={feedbacksErrorObj instanceof Error ? feedbacksErrorObj.message : 'Please try again later.'}
                  action={
                    <button
                      type="button"
                      onClick={() => refetchFeedbacks()}
                      className="rounded-full border border-primary px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:bg-primary hover:text-black"
                    >
                      Retry
                    </button>
                  }
                />
              ) : filteredFeedbacks.length === 0 ? (
                <AdminEmptyState
                  title="No feedback matches"
                  description="Adjust your filters or wait for new submissions."
                />
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[600px]">
                  {filteredFeedbacks.map((feedback) => (
                    <button
                      key={feedback.id}
                      onClick={() => setSelectedFeedbackId(feedback.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        selectedFeedback?.id === feedback.id
                          ? 'border-primary/40 bg-[#151515]'
                          : 'border-[#1f1f1f] bg-[#111111] hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= feedback.rating
                                    ? 'fill-[#ff6600] text-[#ff6600]'
                                    : 'text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <StatusBadge
                          tone={RATING_TONE[feedback.rating]}
                          label={RATING_LABELS[feedback.rating]}
                        />
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-gray-400">{feedback.feedback}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                        <span className="capitalize">{formatCategory(feedback.category)}</span>
                        <span>{formatDateTime(feedback.createdAt)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6">
              {feedbacksLoading ? (
                <LoadingState />
              ) : !selectedFeedback ? (
                <AdminEmptyState title="No feedback selected" description="Pick a feedback to view details." />
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Feedback</p>
                      <h2 className="text-2xl font-semibold text-white">Rating: {selectedFeedback.rating} Stars</h2>
                      <p className="mt-1 text-xs text-gray-500">ID {selectedFeedback.id}</p>
                    </div>
                    <div className="space-y-2 text-xs text-gray-400">
                      <p>Submitted {formatDateTime(selectedFeedback.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <StatusBadge
                      tone={RATING_TONE[selectedFeedback.rating]}
                      label={`${selectedFeedback.rating} Stars - ${RATING_LABELS[selectedFeedback.rating]}`}
                    />
                    <StatusBadge tone="neutral" label={formatCategory(selectedFeedback.category).toUpperCase()} />
                  </div>

                  <div className="rounded-2xl border border-[#1f1f1f] bg-[#151515] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Rating</p>
                    <div className="mt-3 flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-6 w-6 ${
                            star <= selectedFeedback.rating
                              ? 'fill-[#ff6600] text-[#ff6600]'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-300">({RATING_LABELS[selectedFeedback.rating]})</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#1f1f1f] bg-[#151515] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Customer Feedback</p>
                    <p className="mt-2 text-sm text-gray-200">{selectedFeedback.feedback}</p>
                  </div>

                  {selectedFeedback.user && (
                    <div className="rounded-2xl border border-[#1f1f1f] bg-[#151515] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Customer</p>
                      <div className="mt-2 flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-white">{selectedFeedback.user.name}</p>
                          <p className="text-xs text-gray-400">{selectedFeedback.user.email}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteFeedback(selectedFeedback.id)}
                    className="flex items-center gap-2 rounded-full border border-[#3a1f1f] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#ff9aa8] transition hover:border-[#ff9aa8] hover:text-[#ffb8c6]"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Feedback
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}

