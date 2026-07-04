import { useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, Mail, MessageCircle, X } from 'lucide-react';
import type { ChannelKey, RecipientKey } from '../../hooks/useBroadcast';
import { applyBroadcastPlaceholderPreview } from '../../lib/broadcast-placeholders';

const RECIPIENT_LABELS: Record<RecipientKey, string> = {
  buyers: 'Buyers',
  sellers: 'Sellers',
  riders: 'Riders',
};

const CHANNEL_META: Record<
  ChannelKey,
  { label: string; Icon: typeof Mail }
> = {
  email: { label: 'Email', Icon: Mail },
  inapp: { label: 'In-App Notification', Icon: Bell },
  whatsapp: { label: 'WhatsApp', Icon: MessageCircle },
};

type Props = {
  broadcastType: string;
  recipients: RecipientKey[];
  recipientCounts: { buyers: number; sellers: number; riders: number };
  totalRecipients: number;
  channels: ChannelKey[];
  subject: string;
  message: string;
  isScheduled: boolean;
  scheduledAt: Date | null;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmBroadcastModal({
  broadcastType,
  recipients,
  recipientCounts,
  totalRecipients,
  channels,
  subject,
  message,
  isScheduled,
  scheduledAt,
  isSubmitting,
  onConfirm,
  onCancel,
}: Props) {
  const [confirmed, setConfirmed] = useState(false);

  const previewMessage = applyBroadcastPlaceholderPreview(message);
  const previewSubject = applyBroadcastPlaceholderPreview(subject);
  const deliverableChannels = channels.filter((c) => c === 'email' || c === 'inapp');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-broadcast-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#2a2a2a] bg-[#0e1117] p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden />
            </div>
            <div>
              <h3 id="confirm-broadcast-title" className="text-lg font-semibold text-white">
                Confirm broadcast to live users
              </h3>
              <p className="mt-1 text-sm text-[#9ca3af]">
                Live mode is on. Review every detail before this reaches real accounts.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-md p-1 text-[#9ca3af] transition hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50"
            aria-label="Close confirmation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          You are about to send to{' '}
          <span className="font-semibold text-white">{totalRecipients.toLocaleString()}</span>{' '}
          live {totalRecipients === 1 ? 'user' : 'users'}. This cannot be undone.
        </div>

        <div className="mb-5 space-y-4 rounded-xl border border-[#2a2a2a] bg-[#111111] p-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#6b7280]">Type</p>
              <p className="mt-1 font-medium text-white">{broadcastType}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[#6b7280]">Timing</p>
              <p className="mt-1 font-medium text-white">
                {isScheduled && scheduledAt
                  ? `Scheduled for ${scheduledAt.toLocaleString()}`
                  : 'Send immediately'}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-[#6b7280]">Recipient segments</p>
            <ul className="mt-2 space-y-1.5">
              {recipients.map((key) => (
                <li key={key} className="flex items-center justify-between text-[#d1d5db]">
                  <span>{RECIPIENT_LABELS[key]}</span>
                  <span className="font-medium text-white">
                    {recipientCounts[key].toLocaleString()}
                  </span>
                </li>
              ))}
              <li className="flex items-center justify-between border-t border-[#2a2a2a] pt-2 font-semibold text-white">
                <span>Total recipients</span>
                <span className="text-[#F97316]">{totalRecipients.toLocaleString()}</span>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-[#6b7280]">Channels</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {deliverableChannels.length === 0 ? (
                <span className="text-[#9ca3af]">None selected</span>
              ) : (
                deliverableChannels.map((channel) => {
                  const { label, Icon } = CHANNEL_META[channel];
                  return (
                    <span
                      key={channel}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1 text-[#d1d5db]"
                    >
                      <Icon className="h-3.5 w-3.5 text-[#F97316]" aria-hidden />
                      {label}
                    </span>
                  );
                })
              )}
            </div>
            {channels.includes('whatsapp') ? (
              <p className="mt-2 text-xs text-amber-300">
                WhatsApp is not enabled on the API yet — only Email and In-App will be delivered.
              </p>
            ) : null}
          </div>

          {channels.includes('email') ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-[#6b7280]">Email subject</p>
              <p className="mt-1 text-white">{previewSubject || '(No subject)'}</p>
            </div>
          ) : null}

          <div>
            <p className="text-xs uppercase tracking-wide text-[#6b7280]">Message preview</p>
            <p className="mt-1 whitespace-pre-wrap rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-3 text-[#d1d5db]">
              {previewMessage || '(Empty message)'}
            </p>
          </div>
        </div>

        <label className="mb-5 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[#2a2a2a] text-[#F97316] focus:ring-[#F97316]/40"
          />
          <span className="text-sm text-[#d1d5db]">
            I confirm this broadcast should go to{' '}
            <span className="font-semibold text-white">{totalRecipients.toLocaleString()}</span>{' '}
            live users via the selected channels.
          </span>
        </label>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 rounded-xl border border-[#2a2a2a] px-4 py-2.5 text-sm font-medium text-[#d1d5db] transition hover:bg-[#1a1a1a] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting || !confirmed}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Sending…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                {isScheduled ? 'Schedule Broadcast' : 'Send Broadcast'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
