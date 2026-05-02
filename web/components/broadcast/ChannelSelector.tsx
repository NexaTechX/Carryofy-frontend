import { Bell, Mail, MessageCircle } from 'lucide-react';
import type { ChannelKey } from '../../hooks/useBroadcast';

type Props = {
  channels: ChannelKey[];
  onToggle: (channel: ChannelKey) => void;
  error?: string;
};

const CHANNELS: Array<{ key: ChannelKey; label: string; Icon: typeof Mail }> = [
  { key: 'email', label: 'Email', Icon: Mail },
  { key: 'inapp', label: 'In-App Notification', Icon: Bell },
  { key: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle },
];

export function ChannelSelector({ channels, onToggle, error }: Props) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">Channels</h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {CHANNELS.map(({ key, label, Icon }) => {
          const enabled = channels.includes(key);
          return (
            <label
              key={key}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
            >
              <span className="flex items-center gap-2 text-xs text-gray-800">
                <Icon className={`h-4 w-4 ${enabled ? 'text-orange-600' : 'text-gray-400'}`} />
                {label}
              </span>
              <button
                type="button"
                onClick={() => onToggle(key)}
                className={`h-6 w-11 rounded-full p-0.5 transition-all duration-150 ease-in ${
                  enabled ? 'bg-orange-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white transition-transform duration-150 ease-in ${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>
          );
        })}
      </div>
      {channels.includes('whatsapp') ? (
        <div className="mt-3 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-800">
          WhatsApp sends via your connected Meta Cloud API
        </div>
      ) : null}
      {error ? (
        <div className="mt-2 inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-700">
          {error}
        </div>
      ) : null}
    </section>
  );
}
