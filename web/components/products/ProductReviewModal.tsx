import React, { useState } from 'react';
import { X, Star, Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { apiClient } from '../../lib/api/client';
import { useAuth } from '../../lib/auth';
import { showErrorToast, showSuccessToast } from '../../lib/ui/toast';

type ProductReviewModalProps = {
  productId: string;
  productTitle: string;
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
};

export default function ProductReviewModal({
  productId,
  productTitle,
  open,
  onClose,
  onSubmitted,
}: ProductReviewModalProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = comment.trim();
    if (trimmed.length < 3) {
      showErrorToast('Please write a short review (at least a few words).');
      return;
    }

    if (!isAuthenticated || user?.role !== 'BUYER') {
      const dest = `/buyer/products/${productId}?writeReview=1`;
      router.push(`/auth/login?redirect=${encodeURIComponent(dest)}`);
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(`/products/${productId}/reviews`, {
        rating,
        comment: trimmed,
      });
      showSuccessToast('Thanks — your review was posted.');
      setComment('');
      setRating(5);
      onSubmitted();
      onClose();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      const msg =
        ax.response?.data?.message ||
        (err instanceof Error ? err.message : 'Could not submit review.');
      showErrorToast(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1A1A1A] shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <h2 id="review-modal-title" className="text-lg font-bold text-white">
              Write a review
            </h2>
            <p className="mt-1 text-sm text-[#ffcc99]/80 line-clamp-2">{productTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#ffcc99]/70 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {authLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
          </div>
        ) : !isAuthenticated || user?.role !== 'BUYER' ? (
          <div className="px-5 py-6 space-y-4">
            <p className="text-sm text-[#ffcc99]/90">
              Sign in with a buyer account to leave a review. You can review a product after your order has been
              delivered.
            </p>
            <button
              type="button"
              onClick={() => {
                const dest = `/buyer/products/${productId}?writeReview=1`;
                router.push(`/auth/login?redirect=${encodeURIComponent(dest)}`);
              }}
              className="w-full rounded-xl bg-[#FF6B00] py-3 text-center text-sm font-bold text-black hover:bg-[#E65F00]"
            >
              Log in to continue
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">
            <p className="text-xs text-[#ffcc99]/60">
              Reviews are available after you have received this product (delivered order). You can only submit one
              review per product.
            </p>

            <div>
              <p className="text-sm font-medium text-white mb-2">Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="p-1 rounded-lg hover:bg-white/5 transition"
                    aria-label={`${n} stars`}
                  >
                    <Star
                      className={`h-8 w-8 ${
                        n <= rating ? 'text-[#FF6B00] fill-[#FF6B00]' : 'text-white/25'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="review-comment" className="text-sm font-medium text-white block mb-2">
                Your review
              </label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="What did you think of this product?"
                className="w-full rounded-xl border border-white/15 bg-black px-4 py-3 text-sm text-white placeholder:text-[#ffcc99]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                maxLength={2000}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-white/20 py-3 text-sm font-semibold text-white hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-xl bg-[#FF6B00] py-3 text-sm font-bold text-black hover:bg-[#E65F00] disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Submit review
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
