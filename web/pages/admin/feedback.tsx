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
import { Star, MessageSquare, Trash2, User, RefreshCw, CheckCircle2, Download, Flag, Link2 } from 'lucide-react';
import { useConfirmation } from '../../lib/hooks/useConfirmation';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import { formatDateTime } from '../../lib/api/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

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


const formatCategory = (category: string) => {
  return category
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/** Positive 4–5, Neutral 3, Negative 1–2 */
function getSentiment(rating: number): 'positive' | 'neutral' | 'negative' {
  if (rating >= 4) return 'positive';
  if (rating === 3) return 'neutral';
  return 'negative';
}

function getThisMonthAndLastMonth(feedbacks: Feedback[] | undefined) {
  if (!feedbacks?.length) {
    return { thisMonth: [], lastMonth: [] };
  }
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth: Feedback[] = [];
  const lastMonth: Feedback[] = [];
  feedbacks.forEach((f) => {
    const d = new Date(f.createdAt);
    if (d >= thisMonthStart) thisMonth.push(f);
    else if (d >= lastMonthStart && d < thisMonthStart) lastMonth.push(f);
  });
  return { thisMonth, lastMonth };
}

function trendPct(current: number, previous: number): { pct: number; up: boolean } {
  if (previous === 0) return { pct: current > 0 ? 100 : 0, up: current > 0 };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { pct: Math.abs(pct), up: current >= previous };
}

const SENTIMENT_COLORS = { positive: '#22c55e', neutral: '#eab308', negative: '#ef4444' };
const FEEDBACK_LINK_PLACEHOLDER = '/feedback'; // Replace with actual buyer feedback page path

export default function AdminFeedback() {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  const { data: feedbacks, isLoading: feedbacksLoading, isError: feedbacksError, error: feedbacksErrorObj, refetch: refetchFeedbacks } =
    useFeedbacks();
  const deleteFeedback = useDeleteFeedbackMutation();
  const confirmation = useConfirmation();

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

  const handleDeleteFeedback = async (feedbackId: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Delete Feedback',
      message: 'Are you sure you want to delete this feedback?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) return;

    deleteFeedback.mutate(feedbackId);
    if (selectedFeedbackId === feedbackId) {
      setSelectedFeedbackId(null);
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

  const { thisMonth, lastMonth } = useMemo(() => getThisMonthAndLastMonth(feedbacks), [feedbacks]);
  const totalTrend = useMemo(() => trendPct(thisMonth.length, lastMonth.length), [thisMonth.length, lastMonth.length]);
  const avgThisMonth = useMemo(() => {
    if (!thisMonth.length) return 0;
    return thisMonth.reduce((a, f) => a + f.rating, 0) / thisMonth.length;
  }, [thisMonth]);
  const avgLastMonth = useMemo(() => {
    if (!lastMonth.length) return 0;
    return lastMonth.reduce((a, f) => a + f.rating, 0) / lastMonth.length;
  }, [lastMonth]);
  const avgRatingTrend = useMemo(() => {
    const curr = Number(averageRating) || 0;
    const change = lastMonth.length ? curr - avgLastMonth : 0;
    const pct = avgLastMonth ? Math.round((change / avgLastMonth) * 100) : 0;
    return { pct: Math.abs(pct), up: change >= 0 };
  }, [averageRating, avgLastMonth, lastMonth.length]);
  const fiveStarThis = useMemo(() => thisMonth.filter((f) => f.rating === 5).length, [thisMonth]);
  const fiveStarLast = useMemo(() => lastMonth.filter((f) => f.rating === 5).length, [lastMonth]);
  const fiveStarTrend = useMemo(() => trendPct(fiveStarThis, fiveStarLast), [fiveStarThis, fiveStarLast]);

  const sentimentData = useMemo(() => {
    if (!feedbacks?.length) return [];
    const counts = { positive: 0, neutral: 0, negative: 0 };
    feedbacks.forEach((f) => {
      counts[getSentiment(f.rating)] += 1;
    });
    return [
      { name: 'Positive', value: counts.positive, color: SENTIMENT_COLORS.positive },
      { name: 'Neutral', value: counts.neutral, color: SENTIMENT_COLORS.neutral },
      { name: 'Negative', value: counts.negative, color: SENTIMENT_COLORS.negative },
    ].filter((d) => d.value > 0);
  }, [feedbacks]);

  const filterCounts = useMemo(() => {
    if (!feedbacks) return {} as Record<string, number>;
    const counts: Record<string, number> = { all: feedbacks.length };
    FEEDBACK_FILTERS.forEach((f) => {
      if (f.id === 'all') return;
      counts[f.id] = feedbacks.filter((fb) => fb.category === f.id).length;
    });
    return counts;
  }, [feedbacks]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAllFiltered = () => {
    if (filteredFeedbacks.length === 0) return;
    const allSelected = filteredFeedbacks.every((f) => selectedIds.has(f.id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredFeedbacks.forEach((f) => next.delete(f.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredFeedbacks.forEach((f) => next.add(f.id));
        return next;
      });
    }
  };
  const handleBulkMarkReviewed = () => {
    setReviewedIds((prev) => {
      const next = new Set(prev);
      selectedIds.forEach((id) => next.add(id));
      return next;
    });
    setSelectedIds(new Set());
  };
  const handleBulkFlag = () => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      selectedIds.forEach((id) => next.add(id));
      return next;
    });
    setSelectedIds(new Set());
  };
  const handleExport = () => {
    const list = selectedIds.size > 0 ? feedbacks?.filter((f) => selectedIds.has(f.id)) ?? [] : filteredFeedbacks;
    if (list.length === 0) return;
    const headers = ['Date', 'Rating', 'Category', 'Comment', 'User'];
    const rows = list.map((f) => [
      f.createdAt,
      f.rating,
      formatCategory(f.category),
      `"${(f.feedback || '').replace(/"/g, '""')}"`,
      f.user ? `${f.user.name ?? ''} (${f.user.email ?? ''})` : '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
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

          {/* Stats Cards with trend vs last month */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Total Feedback</p>
                  <p className="mt-1 flex items-center gap-2 text-2xl font-semibold text-white">
                    {feedbacks?.length ?? 0}
                    <span className="flex items-center text-xs font-medium text-gray-400">
                      {totalTrend.pct > 0 && (
                        <span className={totalTrend.up ? 'text-emerald-500' : 'text-red-400'}>
                          {totalTrend.up ? '↑' : '↓'} {totalTrend.pct}% vs last month
                        </span>
                      )}
                    </span>
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
            </AdminCard>
            <AdminCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Average Rating</p>
                  <p className="mt-1 flex items-center gap-2 text-2xl font-semibold text-white">
                    {averageRating}
                    <span className="flex shrink-0">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= Math.round(Number(averageRating) || 0)
                              ? 'fill-primary text-primary'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </span>
                    {avgRatingTrend.pct > 0 && lastMonth.length > 0 && (
                      <span className={`text-xs font-medium ${avgRatingTrend.up ? 'text-emerald-500' : 'text-red-400'}`}>
                        {avgRatingTrend.up ? '↑' : '↓'} {avgRatingTrend.pct}%
                      </span>
                    )}
                  </p>
                </div>
                <Star className="h-8 w-8 text-primary" />
              </div>
            </AdminCard>
            <AdminCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">5 Star Ratings</p>
                  <p className="mt-1 flex items-center gap-2 text-2xl font-semibold text-white">
                    {ratingDistribution[5] ?? 0}
                    {fiveStarTrend.pct > 0 && (
                      <span className={`text-xs font-medium ${fiveStarTrend.up ? 'text-emerald-500' : 'text-red-400'}`}>
                        {fiveStarTrend.up ? '↑' : '↓'} {fiveStarTrend.pct}% vs last month
                      </span>
                    )}
                  </p>
                </div>
                <Star className="h-8 w-8 fill-primary text-primary" />
              </div>
            </AdminCard>
            <AdminCard className="flex flex-col">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Sentiment</p>
              <div className="mt-2 flex flex-1 min-h-[140px] items-center">
                {sentimentData.length === 0 ? (
                  <p className="text-sm text-gray-500">No data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={52}
                        paddingAngle={2}
                        stroke="transparent"
                      >
                        {sentimentData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111',
                          border: '1px solid #2a2a2a',
                          borderRadius: 8,
                          color: '#fff',
                          fontSize: 12,
                        }}
                        formatter={(value: number, name: string) => [`${value}`, name]}
                      />
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        formatter={(value, entry: { payload?: { value?: number } }) => (
                          <span className="text-xs text-gray-400">
                            {value} {typeof entry?.payload?.value === 'number' ? `(${entry.payload.value})` : ''}
                          </span>
                        )}
                        iconSize={8}
                        iconType="circle"
                        wrapperStyle={{ fontSize: 11 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
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
                {FEEDBACK_FILTERS.map((filter) => {
                  const count = filterCounts[filter.id] ?? 0;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] ${
                        activeFilter === filter.id
                          ? 'bg-primary text-black'
                          : 'border border-[#2a2a2a] bg-[#151515] text-gray-300 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {filter.label}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                          activeFilter === filter.id ? 'bg-black/20 text-black' : 'bg-[#2a2a2a] text-gray-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Bulk actions */}
              {filteredFeedbacks.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-[#1f1f1f] pb-3">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-400">
                    <input
                      type="checkbox"
                      checked={filteredFeedbacks.length > 0 && filteredFeedbacks.every((f) => selectedIds.has(f.id))}
                      onChange={selectAllFiltered}
                      className="rounded border-[#2a2a2a] bg-[#151515] text-primary focus:ring-primary"
                    />
                    Select all
                  </label>
                  {selectedIds.size > 0 && (
                    <>
                      <span className="text-xs text-gray-500">|</span>
                      <button
                        type="button"
                        onClick={handleBulkMarkReviewed}
                        className="flex items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-[#151515] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-gray-300 hover:border-primary hover:text-primary"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark reviewed
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkFlag}
                        className="flex items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-[#151515] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-gray-300 hover:border-primary hover:text-primary"
                      >
                        <Flag className="h-3.5 w-3.5" />
                        Flag
                      </button>
                      <button
                        type="button"
                        onClick={handleExport}
                        className="flex items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-[#151515] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-gray-300 hover:border-primary hover:text-primary"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Export selected
                      </button>
                    </>
                  )}
                  {selectedIds.size === 0 && (
                    <button
                      type="button"
                      onClick={handleExport}
                      className="flex items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-[#151515] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-gray-300 hover:border-primary hover:text-primary"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export list
                    </button>
                  )}
                </div>
              )}

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
                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#2a2a2a] bg-[#101515]/60 px-6 py-16 text-center">
                  <div className="relative flex h-24 w-24 items-center justify-center">
                    <svg viewBox="0 0 120 120" className="h-full w-full text-[#2a2a2a]" aria-hidden>
                      <circle cx="60" cy="60" r="50" fill="currentColor" opacity="0.3" />
                      <path
                        d="M60 28v44M44 44l16 16 16-16"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        opacity="0.6"
                      />
                      <circle cx="60" cy="78" r="6" fill="var(--color-primary)" opacity="0.9" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white">No feedback matches</p>
                    <p className="mt-1 max-w-sm text-sm text-gray-400">
                      Adjust your filters or get more responses by sharing your feedback link with customers.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-[#151515] px-3 py-1.5 text-xs text-gray-400">
                        <Link2 className="h-3.5 w-3.5" />
                        Share feedback link with customers
                      </span>
                      <a
                        href={FEEDBACK_LINK_PLACEHOLDER}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-black"
                      >
                        Copy link
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[600px]">
                  {filteredFeedbacks.map((feedback) => (
                    <div
                      key={feedback.id}
                      className={`flex gap-3 rounded-2xl border px-4 py-3 transition ${
                        selectedFeedback?.id === feedback.id
                          ? 'border-primary/40 bg-[#151515]'
                          : 'border-[#1f1f1f] bg-[#111111] hover:border-primary/30'
                      }`}
                    >
                      <label className="flex shrink-0 cursor-pointer items-start pt-0.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(feedback.id)}
                          onChange={() => toggleSelection(feedback.id)}
                          className="rounded border-[#2a2a2a] bg-[#151515] text-primary focus:ring-primary"
                        />
                      </label>
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => setSelectedFeedbackId(feedback.id)}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= feedback.rating ? 'fill-primary text-primary' : 'text-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                RATING_TONE[feedback.rating] === 'success'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : RATING_TONE[feedback.rating] === 'danger'
                                    ? 'bg-red-500/20 text-red-400'
                                    : RATING_TONE[feedback.rating] === 'warning'
                                      ? 'bg-amber-500/20 text-amber-400'
                                      : 'bg-gray-500/20 text-gray-400'
                              }`}
                            >
                              {formatCategory(feedback.category)}
                            </span>
                            {reviewedIds.has(feedback.id) && (
                              <span title="Reviewed"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /></span>
                            )}
                            {flaggedIds.has(feedback.id) && (
                              <span title="Flagged"><Flag className="h-4 w-4 shrink-0 text-amber-500 fill-amber-500/30" /></span>
                            )}
                          </div>
                          <StatusBadge tone={RATING_TONE[feedback.rating]} label={RATING_LABELS[feedback.rating]} />
                        </div>
                        <p className="mt-2 line-clamp-1 text-xs text-gray-400">
                          {feedback.feedback?.trim() || 'No comment'}
                        </p>
                        <p className="mt-2 text-[10px] text-gray-500">{formatDateTime(feedback.createdAt)}</p>
                      </button>
                    </div>
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
    </div>
  );
}

