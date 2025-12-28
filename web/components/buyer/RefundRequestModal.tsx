import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { createRefund, CreateRefundDto } from '../../lib/api/refunds';
import { showSuccessToast, showErrorToast } from '../../lib/ui/toast';

interface RefundRequestModalProps {
  open: boolean;
  orderId: string;
  orderAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

const REFUND_REASONS = [
  'Product not as described',
  'Product damaged or defective',
  'Wrong item received',
  'Order not delivered',
  'Changed my mind',
  'Other',
];

export default function RefundRequestModal({
  open,
  orderId,
  orderAmount,
  onClose,
  onSuccess,
}: RefundRequestModalProps) {
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // Set default refund amount to full order amount
      setRefundAmount((orderAmount / 100).toFixed(2));
      setSelectedReason('');
      setCustomReason('');
      setError(null);
    }
  }, [open, orderAmount]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid refund amount');
      return;
    }

    if (amount > orderAmount / 100) {
      setError(`Refund amount cannot exceed order amount (₦${(orderAmount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`);
      return;
    }

    if (!selectedReason) {
      setError('Please select a reason for the refund');
      return;
    }

    const reason = selectedReason === 'Other' ? customReason : selectedReason;
    if (!reason.trim()) {
      setError('Please provide a reason for the refund');
      return;
    }

    try {
      setSubmitting(true);
      const refundData: CreateRefundDto = {
        orderId,
        amount: Math.round(amount * 100), // Convert to kobo
        reason: reason.trim(),
      };

      await createRefund(refundData);
      showSuccessToast('Refund request submitted successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating refund:', err);
      const errorMessage = err.response?.data?.message || 'Failed to submit refund request';
      setError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (priceInKobo: number) => {
    return `₦${(priceInKobo / 100).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4">
      <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-2xl font-bold">Request Refund</h2>
          <button
            onClick={onClose}
            className="text-[#ffcc99] hover:text-white transition"
            disabled={submitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Order Amount Info */}
          <div className="bg-[#0d0d0d] border border-[#ff6600]/20 rounded-lg p-4">
            <p className="text-[#ffcc99]/70 text-sm mb-1">Order Amount</p>
            <p className="text-[#ff6600] text-2xl font-bold">{formatPrice(orderAmount)}</p>
          </div>

          {/* Refund Amount */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Refund Amount (₦)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={orderAmount / 100}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-lg text-white focus:outline-none focus:border-[#ff6600]"
              placeholder="Enter refund amount"
              required
              disabled={submitting}
            />
            <p className="text-[#ffcc99]/60 text-xs mt-1">
              Maximum: {formatPrice(orderAmount)}
            </p>
          </div>

          {/* Refund Reason */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Reason for Refund
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-lg text-white focus:outline-none focus:border-[#ff6600]"
              required
              disabled={submitting}
            >
              <option value="">Select a reason</option>
              {REFUND_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Reason */}
          {selectedReason === 'Other' && (
            <div>
              <label className="block text-white font-semibold mb-2">
                Please provide details
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 rounded-lg text-white focus:outline-none focus:border-[#ff6600] resize-none"
                placeholder="Explain why you're requesting a refund..."
                required={selectedReason === 'Other'}
                disabled={submitting}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-[#0d0d0d] border border-[#ff6600]/30 text-white rounded-lg font-bold hover:bg-[#ff6600]/10 hover:border-[#ff6600] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-[#ff6600] text-black rounded-lg font-bold hover:bg-[#cc5200] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

