import { useEffect, useState } from 'react';
import { X, Star, Truck } from 'lucide-react';

interface RiderRatingModalProps {
  open: boolean;
  riderName?: string;
  onClose: () => void;
  onSubmit: (rating: number, comment?: string) => Promise<void>;
}

export default function RiderRatingModal({
  open,
  riderName,
  onClose,
  onSubmit,
}: RiderRatingModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
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
    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(rating, comment.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Unable to submit rating.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-[#ff6600]/30 bg-[#0d0d0d] shadow-xl shadow-black/40">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ff6600]/20">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#ff6600]" />
            <div>
              <p className="text-white text-lg font-semibold">Rate your rider</p>
              <p className="text-[#ffcc99]/70 text-sm">
                {riderName ? `How was your delivery experience with ${riderName}?` : 'How was your delivery experience?'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#ffcc99]/60 hover:text-white transition p-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <p className="text-[#ffcc99]/80 text-sm font-medium mb-3">Rating</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`p-2 rounded-full transition ${
                    value <= rating ? 'text-[#ff6600]' : 'text-[#ffcc99]/40'
                  }`}
                  aria-label={`${value} star${value === 1 ? '' : 's'}`}
                >
                  <Star className={`w-7 h-7 ${value <= rating ? 'fill-[#ff6600]' : ''}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[#ffcc99]/80 text-sm font-medium mb-2" htmlFor="rider-comment">
              Comment (optional)
            </label>
            <textarea
              id="rider-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Fast delivery, careful with the package..."
              rows={3}
              className="w-full rounded-2xl border border-[#ff6600]/30 bg-black px-4 py-3 text-white placeholder:text-[#ffcc99]/40 focus:border-[#ff6600] focus:outline-none focus:ring-1 focus:ring-[#ff6600]"
              maxLength={500}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#ff6600]/30 text-[#ffcc99] hover:bg-[#ff6600]/10 transition"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#ff6600] px-6 py-3 text-sm font-bold text-black hover:bg-[#cc5200] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
