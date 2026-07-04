import { useEffect, useMemo, useState } from 'react';
import { Bell, Mail, MessageCircle } from 'lucide-react';
import type { ChannelKey } from '../../hooks/useBroadcast';
import { applyBroadcastPlaceholderPreview } from '../../lib/broadcast-placeholders';

type Props = {
  subject: string;
  message: string;
  broadcastType: string;
  channels: ChannelKey[];
};

type PreviewTab = 'email' | 'inapp' | 'whatsapp';

const TAB_META: Record<
  PreviewTab,
  { label: string; channel: ChannelKey }
> = {
  email: { label: 'Email', channel: 'email' },
  inapp: { label: 'In-App', channel: 'inapp' },
  whatsapp: { label: 'WhatsApp', channel: 'whatsapp' },
};

export function BroadcastPreview({ subject, message, broadcastType, channels }: Props) {
  const enabledTabs = useMemo(() => {
    const tabs: PreviewTab[] = [];
    if (channels.includes('email')) tabs.push('email');
    if (channels.includes('inapp')) tabs.push('inapp');
    if (channels.includes('whatsapp')) tabs.push('whatsapp');
    return tabs;
  }, [channels]);

  const [activeTab, setActiveTab] = useState<PreviewTab>('email');

  useEffect(() => {
    if (enabledTabs.length === 0) {
      setActiveTab('email');
      return;
    }
    if (!enabledTabs.includes(activeTab)) {
      setActiveTab(enabledTabs[0]);
    }
  }, [activeTab, enabledTabs]);

  const previewSubject = useMemo(
    () => applyBroadcastPlaceholderPreview(subject),
    [subject],
  );
  const previewMessage = useMemo(
    () => applyBroadcastPlaceholderPreview(message),
    [message],
  );

  const inAppSnippet = useMemo(() => {
    if (!previewMessage.trim()) return 'Your notification preview appears here...';
    const text = previewMessage.slice(0, 80);
    return previewMessage.length > 80 ? `${text}...` : text;
  }, [previewMessage]);

  const whatsappSnippet = useMemo(() => {
    if (!previewMessage.trim()) return 'WhatsApp message preview appears here...';
    return previewMessage.length > 160 ? `${previewMessage.slice(0, 160)}...` : previewMessage;
  }, [previewMessage]);

  return (
    <section className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-4">
      <h2 className="mb-3 text-sm font-semibold text-white">Live Preview</h2>

      {enabledTabs.length === 0 ? (
        <p className="rounded-md border border-[#2a2a2a] bg-[#1a1a1a] p-3 text-xs text-[#9ca3af]">
          Enable at least one channel to preview how this broadcast will look.
        </p>
      ) : (
        <>
          <div className="mb-3 flex rounded-md border border-[#2a2a2a] bg-[#0a0a0a] p-1">
            {enabledTabs.map((tab) => {
              const { label } = TAB_META[tab];
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs transition-all duration-150 ease-in ${
                    activeTab === tab ? 'bg-[#F97316] text-white' : 'text-[#9ca3af]'
                  }`}
                >
                  {tab === 'email' ? (
                    <Mail className="h-3 w-3" aria-hidden />
                  ) : tab === 'inapp' ? (
                    <Bell className="h-3 w-3" aria-hidden />
                  ) : (
                    <MessageCircle className="h-3 w-3" aria-hidden />
                  )}
                  {label}
                </button>
              );
            })}
          </div>

          {activeTab === 'email' ? (
            <div className="rounded-lg bg-white p-4 text-black shadow-sm">
              <p className="text-xs text-gray-500">From: Carryofy &lt;noreply@carryofy.com&gt;</p>
              <p className="mt-2 text-sm font-semibold">{previewSubject || 'No subject yet'}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                {previewMessage || 'Write your broadcast message to preview it here.'}
              </p>
              <button
                type="button"
                className="mt-4 rounded-md bg-[#F97316] px-3 py-2 text-xs font-semibold text-white"
              >
                View on Carryofy
              </button>
            </div>
          ) : null}

          {activeTab === 'inapp' ? (
            <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-3">
              <div className="flex items-start gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-[#F97316] text-xs font-bold text-white">
                  CF
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">Carryofy</p>
                    <span className="text-xs text-[#9ca3af]">now</span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-white">{broadcastType}</p>
                  <p className="mt-1 text-xs text-[#9ca3af]">{inAppSnippet}</p>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'whatsapp' ? (
            <div className="rounded-lg border border-[#2a2a2a] bg-[#0b141a] p-3">
              <div className="max-w-[85%] rounded-lg rounded-tl-none bg-[#005c4b] px-3 py-2 text-sm text-white">
                <p className="whitespace-pre-wrap">{whatsappSnippet}</p>
                <p className="mt-1 text-right text-[10px] text-white/70">12:00</p>
              </div>
              <p className="mt-2 text-[10px] text-[#6b7280]">
                Preview only — WhatsApp delivery is not enabled on the API yet.
              </p>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
