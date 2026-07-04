import { Bell, Mail, MessageCircle } from 'lucide-react';
import type { ChannelKey } from '../../hooks/useBroadcast';

type Props = {
  channels: ChannelKey[];
  onToggle: (channel: ChannelKey) => void;
  error?: string;
};

const CHANNELS: Array<{
  key: ChannelKey;
  label: string;
  description: string;
  Icon: typeof Mail;
  disabled?: boolean;
}> = [
  { key: 'email', label: 'Email', description: 'HTML email to inbox', Icon: Mail },
  {
    key: 'inapp',
    label: 'In-App Notification',
    description: 'Bell alert in dashboard',
    Icon: Bell,
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    description: 'Preview only — API delivery coming soon',
    Icon: MessageCircle,
  },
];

export function ChannelSelector({ channels, onToggle, error }: Props) {
  return (
    <section className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-4">
      <h2 className="mb-1 text-sm font-semibold text-white">Channels</h2>
      <p className="mb-3 text-xs text-[#6b7280]">
        Choose how this broadcast is delivered. At least Email or In-App is required.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {CHANNELS.map(({ key, label, description, Icon }) => {
          const enabled = channels.includes(key);
          return (
            <div
              key={key}
              className={`rounded-lg border p-3 ${
                enabled
                  ? 'border-[#F97316] bg-[#F97316]/10'
                  : 'border-[#2a2a2a] bg-[#1a1a1a]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        enabled ? 'text-[#F97316]' : 'text-[#9ca3af]'
                      }`}
                      aria-hidden
                    />
                    <span className="text-sm font-medium text-white">{label}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#6b7280]">{description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={`${label} channel`}
                  onClick={() => onToggle(key)}
                  className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition-all duration-150 ease-in ${
                    enabled ? 'bg-[#F97316]' : 'bg-[#2a2a2a]'
                  }`}
                >
                  <span
                    className={`block h-5 w-5 rounded-full bg-white transition-transform duration-150 ease-in ${
                      enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {channels.includes('whatsapp') ? (
        <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          WhatsApp is preview-only today. Only Email and In-App are delivered by the broadcast API.
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 inline-flex rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-300">
          {error}
        </div>
      ) : null}
    </section>
  );
}
