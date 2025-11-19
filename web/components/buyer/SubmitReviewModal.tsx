import { useEffect, useState } from 'react';
import { X, Star } from 'lucide-react';

interface SubmitReviewModalProps {
  open: boolean;
  productTitle: string;
  productId: string;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
}

export default function SubmitReviewModal({
  open,
  productTitle,
  onClose,
  onSubmit,
}: SubmitReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setRating(5);
      setComment('');
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!comment.trim()) {
      setError('Please share a few words about your experience.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(rating, comment.trim());
      onClose();
    } catch (err: any) {
      console.error('Failed to submit review', err);
      setError(err?.message || 'Unable to submit review right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-[#ff6600]/30 bg-[#0d0d0d] shadow-xl shadow-black/40">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ff6600]/20">
          <div>
            <p className="text-white text-lg font-semibold">Share your experience</p>
            <p className="text-[#ffcc99]/70 text-sm">Help other buyers learn about {productTitle}.</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#ffcc99]/60 hover:text-white transition p-1"
            aria-label="Close review modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <p className="text-[#ffcc99]/80 text-sm font-medium mb-3">How would you rate it?</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`p-2 rounded-full transition ${
                    value <= rating ? 'text-[#ff6600]' : 'text-[#ffcc99]/40'
                  }`}
                  aria-label={`Rate ${value} star${value === 1 ? '' : 's'}`}
                >
                  <Star className={`w-7 h-7 ${value <= rating ? 'fill-[#ff6600]' : ''}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[#ffcc99]/80 text-sm font-medium mb-2" htmlFor="review-comment">
              Tell us more
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="What did you like? Any tips for other buyers?"
              rows={5}
              className="w-full rounded-2xl border border-[#ff6600]/30 bg-black px-4 py-3 text-white placeholder:text-[#ffcc99]/40 focus:border-[#ff6600] focus:outline-none focus:ring-1 focus:ring-[#ff6600]"
              maxLength={600}
            />
            <p className="text-[#ffcc99]/50 text-xs mt-1">Up to 600 characters.</p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <p className="text-[#ffcc99]/60 text-xs">
              By submitting, you agree to our community guidelines.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#ff6600] px-6 py-3 text-sm font-bold text-black hover:bg-[#cc5200] disabled:cursor-not-allowed disabled:opacity-50 transition"
            >
              {submitting ? 'Submitting...' : 'Submit review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
