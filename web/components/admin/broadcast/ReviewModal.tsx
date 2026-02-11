import { useState } from 'react';
import { X, AlertTriangle, CheckCircle2, Users, Mail, Bell, DollarSign } from 'lucide-react';
import type { CreateBroadcastPayload, AudienceCount } from '../../../lib/admin/types';

interface ReviewModalProps {
  payload: CreateBroadcastPayload;
  audienceCounts?: AudienceCount;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  PRODUCT_LAUNCH: 'Product Launch',
  PROMOTION: 'Promotion / Campaign',
  SYSTEM_UPDATE: 'System Update',
  OPERATIONAL_NOTICE: 'Operational Notice',
  URGENT_ALERT: 'Urgent Alert',
};

export default function ReviewModal({
  payload,
  audienceCounts,
  onConfirm,
  onCancel,
  isLoading = false,
}: ReviewModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [internalNote, setInternalNote] = useState(payload.internalNote || '');

  const totalRecipients = audienceCounts?.total || 0;
  const emailCount = payload.channels.email ? totalRecipients : 0;
  const inAppCount = payload.channels.inApp ? totalRecipients : 0;

  // Rough email cost estimate (assuming $0.001 per email)
  const estimatedEmailCost = emailCount * 0.001;

  const validate = (): string | null => {
    if (!confirmed) {
      return 'Please confirm that you want to send this broadcast';
    }
    return null;
  };

  const handleConfirm = () => {
    const error = validate();
    if (error) {
      alert(error);
      return;
    }
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#0e1117] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Review & Send Broadcast</h3>
              <p className="text-sm text-gray-400">Please review all details before sending</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Summary */}
        <div className="mb-6 space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Type</span>
              <p className="font-medium text-white mt-0.5">
                {TYPE_LABELS[payload.type] || payload.type}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Status</span>
              <p className="font-medium text-white mt-0.5">
                {payload.scheduling?.sendNow !== false ? 'Send Now' : 'Scheduled'}
              </p>
            </div>
          </div>

          {/* Audience breakdown */}
          <div>
            <span className="text-gray-500 text-sm">Recipients</span>
            <div className="mt-2 space-y-2">
              {payload.audience.map((role) => {
                const count = audienceCounts?.[role] || 0;
                return (
                  <div key={role} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 capitalize">{role.toLowerCase()}</span>
                    <span className="font-medium text-white">{count.toLocaleString()}</span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between border-t border-white/[0.06] pt-2 text-sm font-medium">
                <span className="text-white">Total</span>
                <span className="text-primary">{totalRecipients.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Channels */}
          <div>
            <span className="text-gray-500 text-sm">Channels</span>
            <div className="mt-2 flex gap-4 text-sm">
              {payload.channels.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">Email ({emailCount.toLocaleString()})</span>
                </div>
              )}
              {payload.channels.inApp && (
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">In-App ({inAppCount.toLocaleString()})</span>
                </div>
              )}
            </div>
          </div>

          {/* Cost estimate */}
          {emailCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500">Estimated email cost:</span>
              <span className="font-medium text-white">${estimatedEmailCost.toFixed(2)}</span>
            </div>
          )}

          {/* Subject */}
          {payload.subject && (
            <div>
              <span className="text-gray-500 text-sm">Subject</span>
              <p className="text-white mt-0.5 text-sm">{payload.subject}</p>
            </div>
          )}

          {/* Products */}
          {payload.productIds && payload.productIds.length > 0 && (
            <div>
              <span className="text-gray-500 text-sm">Products attached</span>
              <p className="text-white mt-0.5 text-sm">{payload.productIds.length} product(s)</p>
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-400 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p className="font-medium text-red-300 mb-1">This action cannot be undone</p>
            <p>Once sent, this broadcast cannot be modified or cancelled. Please ensure all details are correct.</p>
          </div>
        </div>

        {/* Internal note */}
        <div className="mb-6">
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Internal note (optional)
          </label>
          <textarea
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            placeholder="Add a note for audit trail..."
            rows={3}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-gray-100 placeholder-gray-500 transition-colors focus:border-primary/60 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* Confirmation checkbox */}
        <label className="mb-6 flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-white/[0.08] text-primary focus:ring-primary/30"
          />
          <span className="text-sm text-gray-300">
            I confirm that I have reviewed all details and want to send this broadcast to{' '}
            <span className="font-medium text-white">{totalRecipients.toLocaleString()}</span> recipients.
          </span>
        </label>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/[0.05] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || !confirmed}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Sending…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Send Broadcast
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
