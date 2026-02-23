import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import SellerLayout from '../../../components/seller/SellerLayout';
import { useAuth, tokenManager } from '../../../lib/auth';
import { formatDate, formatDateTime, getApiUrl } from '../../../lib/api/utils';
import { Star, Search, TrendingUp, Send, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const STAR_FILLED = '#FF6B00';
const STAR_EMPTY = '#2A2A2A';

interface ReviewReply {
  id: string;
  reviewId: string;
  sellerId: string;
  sellerBusinessName: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

interface Review {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  createdAt: string;
  orderId?: string;
  helpfulCount?: number;
  replies?: ReviewReply[];
}

interface ReviewAnalytics {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  productStats: Array<{
    productId: string;
    productTitle: string;
    reviewCount: number;
    averageRating: number;
  }>;
}

export default function ReviewsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [analytics, setAnalytics] = useState<ReviewAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<{ [reviewId: string]: string }>({});
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    if (user.role && user.role !== 'SELLER' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchReviews();
    fetchAnalytics();
  }, [router, authLoading, isAuthenticated, user, ratingFilter, productFilter, startDate, endDate]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = tokenManager.getAccessToken();
      const params = new URLSearchParams();
      if (ratingFilter !== 'all') {
        params.append('rating', ratingFilter);
      }
      if (productFilter !== 'all') {
        params.append('productId', productFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }

      const response = await fetch(getApiUrl(`/products/reviews?${params.toString()}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const reviewsData = result.data || result;
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const token = tokenManager.getAccessToken();
      const response = await fetch(getApiUrl('/products/reviews/analytics'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const analyticsData = result.data || result;
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'md') => {
    const sizeClass = size === 'sm' ? 'text-sm' : 'text-base';
    return (
      <span className={`inline-flex gap-0.5 ${sizeClass}`} aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} style={{ color: star <= rating ? STAR_FILLED : STAR_EMPTY }}>
            {star <= rating ? '★' : '☆'}
          </span>
        ))}
      </span>
    );
  };

  const handleCreateReply = async (reviewId: string) => {
    const comment = replyText[reviewId]?.trim();
    if (!comment) {
      toast.error('Please enter a reply');
      return;
    }

    try {
      setSubmittingReply(reviewId);
      const token = tokenManager.getAccessToken();
      const response = await fetch(getApiUrl(`/products/reviews/${reviewId}/reply`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comment }),
      });

      if (response.ok) {
        const result = await response.json();
        const newReply = result.data || result;
        toast.success('Reply posted successfully');
        
        // Update the review with the new reply
        setReviews((prevReviews) =>
          prevReviews.map((review) =>
            review.id === reviewId
              ? {
                  ...review,
                  replies: [...(review.replies || []), newReply],
                }
              : review
          )
        );
        
        // Clear reply text and close reply form
        setReplyText((prev) => {
          const updated = { ...prev };
          delete updated[reviewId];
          return updated;
        });
        setReplyingTo(null);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to post reply');
      }
    } catch (error) {
      console.error('Error creating reply:', error);
      toast.error('Failed to post reply');
    } finally {
      setSubmittingReply(null);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        review.productTitle.toLowerCase().includes(query) ||
        review.userName.toLowerCase().includes(query) ||
        review.comment.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Get unique products for filter
  const uniqueProducts = Array.from(
    new Set(reviews.map((r) => ({ id: r.productId, title: r.productTitle })))
  ).map((p) => ({ id: p.id, title: p.title }));

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#ffcc99]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Reviews - Seller Portal | Carryofy</title>
        <meta name="description" content="View and manage product reviews on Carryofy." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SellerLayout>
        <div>
          {/* Title Section */}
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <p className="text-white tracking-light text-[32px] font-bold leading-tight min-w-72">
              Product Reviews
            </p>
          </div>

          {/* Stat Cards */}
          <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Reviews */}
            <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-4">
              <p className="text-white text-3xl font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>
                {analytics?.totalReviews ?? 0}
              </p>
              <p className="text-[#A0A0A0] text-sm mt-1">reviews</p>
            </div>
            {/* Average Rating */}
            <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-4">
              <p className="text-white text-3xl font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>
                {analytics?.averageRating != null ? analytics.averageRating.toFixed(1) : '0.0'}
              </p>
              <div className="flex items-center gap-0.5 mt-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= (analytics?.averageRating ?? 0);
                  return (
                    <span key={star} style={{ color: filled ? STAR_FILLED : STAR_EMPTY }}>
                      {filled ? '★' : '☆'}
                    </span>
                  );
                })}
              </div>
              <p className="text-[#A0A0A0] text-sm mt-1">out of 5</p>
            </div>
            {/* 5 Star Reviews */}
            <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-4">
              <p className="text-white text-3xl font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>
                {analytics?.ratingDistribution?.[5] ?? 0}
              </p>
              <p className="text-[#A0A0A0] text-sm mt-1">5★ reviews</p>
            </div>
            {/* Rating Distribution */}
            <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-4">
              <p className="text-[#A0A0A0] text-sm mb-3">Rating Distribution</p>
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = analytics?.ratingDistribution?.[rating as keyof typeof analytics.ratingDistribution] ?? 0;
                const total = analytics?.totalReviews ?? 1;
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-2 mb-2 last:mb-0">
                    <span className="text-[#A0A0A0] text-xs w-8">{rating}★</span>
                    <div className="flex-1 h-2 rounded-full bg-[#2A2A2A] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: STAR_FILLED }}
                      />
                    </div>
                    <span className="text-white text-xs w-6 text-right" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filter Row: Rating pills + Date range */}
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[#A0A0A0] text-sm font-medium">Rating:</span>
              {[
                { value: 'all', label: 'All Ratings' },
                { value: '5', label: '5★' },
                { value: '4', label: '4★' },
                { value: '3', label: '3★' },
                { value: '2', label: '2★' },
                { value: '1', label: '1★' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setRatingFilter(filter.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    ratingFilter === filter.value
                      ? 'bg-[#FF6B00] text-black'
                      : 'bg-[#1a1a1a] border border-[#ff6600]/30 text-[#A0A0A0] hover:bg-[#ff6600]/10'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[#A0A0A0] text-sm">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-sm bg-[#1a1a1a] border border-[#ff6600]/30 text-white focus:outline-none focus:border-[#FF6B00]"
              />
              <span className="text-[#A0A0A0] text-sm">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-sm bg-[#1a1a1a] border border-[#ff6600]/30 text-white focus:outline-none focus:border-[#FF6B00]"
              />
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-4 py-2">
            <div className="flex w-full items-center rounded-xl bg-[#1a1a1a] border border-[#ff6600]/30">
              <Search className="w-5 h-5 text-[#A0A0A0] ml-4 shrink-0" />
              <input
                type="text"
                placeholder="Search by product, customer or comment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-3 bg-transparent text-white placeholder:text-[#A0A0A0] focus:outline-none focus:ring-0 border-none"
              />
            </div>
          </div>

          {/* Reviews List */}
          <div className="px-4 py-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[#ffcc99]">Loading reviews...</p>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-12 text-center">
                <span className="text-[40px] leading-none block mb-4" style={{ color: STAR_FILLED }}>★</span>
                <h3 className="text-white text-[18px] font-bold mb-2">No reviews yet</h3>
                <p className="text-[#A0A0A0] text-sm max-w-md mx-auto">
                  Reviews from buyers will appear here once your first order is delivered
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReviews.map((review) => {
                  const isExpanded = expandedReviewId === review.id;
                  const isLongComment = review.comment.length > 150;

                  return (
                    <div
                      key={review.id}
                      className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6"
                    >
                      {/* Top row: avatar + buyer name + product link */}
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center text-white text-sm font-medium shrink-0"
                          aria-hidden
                        >
                          {getInitials(review.userName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-white font-medium">{review.userName}</span>
                          <span className="text-[#A0A0A0] mx-2">·</span>
                          <Link
                            href={`/seller/products/${review.productId}`}
                            className="text-[#FF6B00] hover:underline truncate inline-block max-w-[200px] align-baseline"
                          >
                            {review.productTitle}
                          </Link>
                        </div>
                      </div>

                      {/* Star rating */}
                      <div className="mb-3">{renderStars(review.rating)}</div>

                      {/* Review text: 14px #CCCCCC, max 3 lines + Read more */}
                      <div className="mb-4">
                        <p
                          className={`text-[#CCCCCC] text-[14px] leading-relaxed whitespace-pre-wrap ${!isExpanded ? 'line-clamp-3' : ''}`}
                        >
                          {review.comment}
                        </p>
                        {isLongComment && !isExpanded && (
                          <button
                            type="button"
                            onClick={() => setExpandedReviewId(review.id)}
                            className="text-[#FF6B00] text-sm font-medium mt-1 hover:underline"
                          >
                            Read more
                          </button>
                        )}
                        {isLongComment && isExpanded && (
                          <button
                            type="button"
                            onClick={() => setExpandedReviewId(null)}
                            className="text-[#FF6B00] text-sm font-medium mt-1 hover:underline"
                          >
                            Show less
                          </button>
                        )}
                      </div>

                      {/* Bottom row: date right, Helpful left, reply button right */}
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <span className="text-[#A0A0A0] text-sm">
                          Helpful? 👍 {review.helpfulCount ?? 0}
                        </span>
                        <div className="flex items-center gap-3 ml-auto">
                          <span className="text-[#A0A0A0] text-sm">{formatDate(review.createdAt)}</span>
                          <button
                            type="button"
                            onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                            className="px-4 py-2 rounded-lg text-sm font-medium border border-[#ff6600]/50 text-[#FF6B00] hover:bg-[#FF6B00]/10 transition"
                          >
                            {review.replies && review.replies.length > 0 ? 'Add Reply' : 'Reply to review'}
                          </button>
                        </div>
                      </div>

                      {/* Seller reply bubble */}
                      {review.replies && review.replies.length > 0 && (
                        <div className="mt-4 pl-4 border-l-2 border-[#FF6B00]">
                          <p className="text-[#FF6B00] font-semibold text-sm mb-1">Your response</p>
                          {review.replies.map((reply) => (
                            <p key={reply.id} className="text-[#CCCCCC] text-[14px] leading-relaxed">
                              {reply.comment}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Reply section (expandable) */}
                      {replyingTo === review.id && (
                        <div className="mt-4 pt-4 border-t border-[#2A2A2A]">
                          <div className="relative group">
                            <textarea
                              value={replyText[review.id] || ''}
                              onChange={(e) =>
                                setReplyText((prev) => ({
                                  ...prev,
                                  [review.id]: e.target.value.slice(0, 500),
                                }))
                              }
                              placeholder="Thank the customer or address their feedback publicly..."
                              rows={3}
                              className="w-full px-4 py-3 rounded-xl text-sm bg-[#0d0d0d] border border-[#ff6600]/30 text-white focus:outline-none focus:border-[#FF6B00] resize-none mb-3"
                              maxLength={500}
                            />
                            <span
                              className="absolute top-2 right-2 text-[#A0A0A0] text-xs"
                              title="Public replies build trust with future buyers"
                            >
                              {(replyText[review.id] || '').length}/500
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <span
                              className="flex items-center gap-1.5 text-[#A0A0A0] text-xs"
                              title="Public replies build trust with future buyers"
                            >
                              <HelpCircle className="w-4 h-4" />
                              Public replies build trust with future buyers
                            </span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyText((prev) => {
                                    const updated = { ...prev };
                                    delete updated[review.id];
                                    return updated;
                                  });
                                }}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-transparent border border-[#2A2A2A] text-[#A0A0A0] hover:border-[#ff6600]/30 transition"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCreateReply(review.id)}
                                disabled={submittingReply === review.id || !replyText[review.id]?.trim()}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-[#FF6B00] text-black hover:bg-[#e55f00] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                              >
                                {submittingReply === review.id ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    Posting...
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-4 h-4" />
                                    Submit
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Products by Reviews */}
          {analytics && analytics.productStats && analytics.productStats.length > 0 && (
            <div className="px-4 py-3">
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#ff6600]" />
                  Top Products by Reviews
                </h3>
                <div className="space-y-3">
                  {analytics.productStats.slice(0, 5).map((product) => (
                    <div
                      key={product.productId}
                      className="flex items-center justify-between p-3 bg-[#0d0d0d] rounded-xl"
                    >
                      <Link
                        href={`/seller/products/${product.productId}`}
                        className="text-[#ffcc99] hover:text-[#ff6600] font-medium flex-1"
                      >
                        {product.productTitle}
                      </Link>
                      <div className="flex items-center gap-3">
                        <span className="text-white text-sm">{product.reviewCount} reviews</span>
                        <div className="flex items-center gap-1">
                          <span className="text-white text-sm font-medium">
                            {product.averageRating.toFixed(1)}
                          </span>
                          {renderStars(Math.round(product.averageRating))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </SellerLayout>
    </>
  );
}

