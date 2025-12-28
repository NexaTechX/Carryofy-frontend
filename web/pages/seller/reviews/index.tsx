import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import SellerLayout from '../../../components/seller/SellerLayout';
import { useAuth, tokenManager } from '../../../lib/auth';
import { Star, MessageSquare, Filter, Search, TrendingUp, Send, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

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
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

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

      const response = await fetch(`${apiUrl}/products/reviews?${params.toString()}`, {
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
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/products/reviews/analytics`, {
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

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-[#ff6600] fill-[#ff6600]' : 'text-[#ffcc99]/30'}`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/products/reviews/${reviewId}/reply`, {
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

          {/* Analytics Cards */}
          {analytics && (
            <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-4">
                <p className="text-[#ffcc99] text-sm mb-2">Total Reviews</p>
                <p className="text-white text-2xl font-bold">{analytics.totalReviews}</p>
              </div>
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-4">
                <p className="text-[#ffcc99] text-sm mb-2">Average Rating</p>
                <div className="flex items-center gap-2">
                  <p className="text-white text-2xl font-bold">{analytics.averageRating.toFixed(1)}</p>
                  {renderStars(Math.round(analytics.averageRating))}
                </div>
              </div>
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-4">
                <p className="text-[#ffcc99] text-sm mb-2">5 Star Reviews</p>
                <p className="text-white text-2xl font-bold">{analytics.ratingDistribution[5]}</p>
              </div>
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-4">
                <p className="text-[#ffcc99] text-sm mb-2">Rating Distribution</p>
                <div className="flex items-center gap-1 mt-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex flex-col items-center">
                      <span className="text-white text-xs font-medium">{analytics.ratingDistribution[rating as keyof typeof analytics.ratingDistribution]}</span>
                      <Star className={`w-3 h-3 ${rating <= 3 ? 'text-[#ff6600] fill-[#ff6600]' : 'text-[#ffcc99]/30'}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="px-4 py-3 space-y-3">
            {/* Rating Filter */}
            <div className="flex gap-2 flex-wrap">
              <span className="text-[#ffcc99] text-sm font-medium self-center">Rating:</span>
              {[
                { value: 'all', label: 'All Ratings' },
                { value: '5', label: '5 Stars' },
                { value: '4', label: '4 Stars' },
                { value: '3', label: '3 Stars' },
                { value: '2', label: '2 Stars' },
                { value: '1', label: '1 Star' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setRatingFilter(filter.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    ratingFilter === filter.value
                      ? 'bg-[#ff6600] text-black'
                      : 'bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] hover:bg-[#ff6600]/10'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Product Filter */}
            {uniqueProducts.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <span className="text-[#ffcc99] text-sm font-medium self-center">Product:</span>
                <select
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] focus:outline-none focus:border-[#ff6600]"
                >
                  <option value="all">All Products</option>
                  {uniqueProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Range */}
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-[#ffcc99] text-sm font-medium">Date Range:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 rounded-xl text-sm bg-[#1a1a1a] border border-[#ff6600]/30 text-white focus:outline-none focus:border-[#ff6600]"
              />
              <span className="text-[#ffcc99]">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 rounded-xl text-sm bg-[#1a1a1a] border border-[#ff6600]/30 text-white focus:outline-none focus:border-[#ff6600]"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] hover:bg-[#ff6600]/10"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-4 py-3">
            <label className="flex flex-col min-w-40 h-12 w-full">
              <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
                <div className="text-[#ffcc99] flex border-none bg-[#1a1a1a] items-center justify-center pl-4 rounded-l-xl border-r-0">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Search reviews by product, customer, or comment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border-none bg-[#1a1a1a] focus:border-none h-full placeholder:text-[#ffcc99] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                />
              </div>
            </label>
          </div>

          {/* Reviews List */}
          <div className="px-4 py-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[#ffcc99]">Loading reviews...</p>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-8 text-center">
                <MessageSquare className="w-12 h-12 text-[#ff6600]/30 mx-auto mb-4" />
                <p className="text-white text-lg font-medium mb-2">No reviews found</p>
                <p className="text-[#ffcc99]">
                  {searchQuery || ratingFilter !== 'all' || productFilter !== 'all' || startDate || endDate
                    ? 'No reviews match your current filters'
                    : 'You have no reviews yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6"
                  >
                    <div className="flex gap-4">
                      {/* Product Image */}
                      {review.productImage && (
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#0d0d0d] shrink-0">
                          <Image
                            src={review.productImage}
                            alt={review.productTitle}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1">
                        {/* Product Title */}
                        <Link
                          href={`/seller/products/${review.productId}`}
                          className="text-[#ff6600] hover:text-[#cc5200] font-semibold text-lg mb-2 block"
                        >
                          {review.productTitle}
                        </Link>

                        {/* Rating and Date */}
                        <div className="flex items-center gap-4 mb-3">
                          {renderStars(review.rating)}
                          <span className="text-[#ffcc99] text-sm">{formatDate(review.createdAt)}</span>
                        </div>

                        {/* Customer Info */}
                        <div className="mb-3">
                          <p className="text-white font-medium text-sm">{review.userName}</p>
                          <p className="text-[#ffcc99]/60 text-xs">{review.userEmail}</p>
                        </div>

                        {/* Review Comment */}
                        <p className="text-[#ffcc99] text-sm leading-relaxed mb-4">{review.comment}</p>

                        {/* Existing Replies */}
                        {review.replies && review.replies.length > 0 && (
                          <div className="mt-4 space-y-3 pl-4 border-l-2 border-[#ff6600]/30">
                            {review.replies.map((reply) => (
                              <div key={reply.id} className="bg-[#0d0d0d] rounded-xl p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <p className="text-[#ff6600] font-semibold text-sm">
                                      {reply.sellerBusinessName}
                                    </p>
                                    <p className="text-[#ffcc99]/60 text-xs">
                                      {formatDateTime(reply.createdAt)}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-[#ffcc99] text-sm leading-relaxed">
                                  {reply.comment}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply Section */}
                        {replyingTo === review.id ? (
                          <div className="mt-4 bg-[#0d0d0d] rounded-xl p-4">
                            <textarea
                              value={replyText[review.id] || ''}
                              onChange={(e) =>
                                setReplyText((prev) => ({
                                  ...prev,
                                  [review.id]: e.target.value,
                                }))
                              }
                              placeholder="Write your reply..."
                              rows={3}
                              className="w-full px-4 py-2 rounded-xl text-sm bg-[#1a1a1a] border border-[#ff6600]/30 text-white focus:outline-none focus:border-[#ff6600] resize-none mb-3"
                              maxLength={2000}
                            />
                            <div className="flex items-center justify-between">
                              <span className="text-[#ffcc99]/60 text-xs">
                                {(replyText[review.id] || '').length}/2000 characters
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText((prev) => {
                                      const updated = { ...prev };
                                      delete updated[review.id];
                                      return updated;
                                    });
                                  }}
                                  className="px-4 py-2 rounded-xl text-sm font-medium bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] hover:bg-[#ff6600]/10 transition"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleCreateReply(review.id)}
                                  disabled={submittingReply === review.id || !replyText[review.id]?.trim()}
                                  className="px-4 py-2 rounded-xl text-sm font-medium bg-[#ff6600] text-white hover:bg-[#cc5200] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                                >
                                  {submittingReply === review.id ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                      Posting...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-4 h-4" />
                                      Post Reply
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4">
                            <button
                              onClick={() => setReplyingTo(review.id)}
                              className="px-4 py-2 rounded-xl text-sm font-medium bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] hover:bg-[#ff6600]/10 transition flex items-center gap-2"
                            >
                              <MessageSquare className="w-4 h-4" />
                              {review.replies && review.replies.length > 0
                                ? 'Add Reply'
                                : 'Reply'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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

