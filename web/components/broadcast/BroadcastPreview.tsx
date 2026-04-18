import { useMemo, useState } from 'react';
import { applyBroadcastPlaceholderPreview } from '../../lib/broadcast-placeholders';

type Props = {
  subject: string;
  message: string;
  broadcastType: string;
};

export function BroadcastPreview({ subject, message, broadcastType }: Props) {
  const [activeTab, setActiveTab] = useState<'email' | 'inapp'>('email');

  const previewSubject = useMemo(
    () => applyBroadcastPlaceholderPreview(subject),
    [subject]
  );
  const previewMessage = useMemo(
    () => applyBroadcastPlaceholderPreview(message),
    [message]
  );

  const inAppSnippet = useMemo(() => {
    if (!previewMessage.trim()) return 'Your notification preview appears here...';
    const text = previewMessage.slice(0, 80);
    return previewMessage.length > 80 ? `${text}...` : text;
  }, [previewMessage]);

  return (
    <section className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-4">
      <h2 className="mb-3 text-sm font-semibold text-white">Live Preview</h2>
      <div className="mb-3 flex rounded-md border border-[#2a2a2a] bg-[#0a0a0a] p-1">
        <button
          type="button"
          onClick={() => setActiveTab('email')}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs transition-all duration-150 ease-in ${
            activeTab === 'email' ? 'bg-[#F97316] text-white' : 'text-[#9ca3af]'
          }`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('inapp')}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs transition-all duration-150 ease-in ${
            activeTab === 'inapp' ? 'bg-[#F97316] text-white' : 'text-[#9ca3af]'
          }`}
        >
          In-App
        </button>
      </div>

      {activeTab === 'email' ? (
        <div className="rounded-lg bg-white p-4 text-black shadow-sm">
          <p className="text-xs text-gray-500">From: Carryofy &lt;noreply@carryofy.com&gt;</p>
          <p className="mt-2 text-sm font-semibold">{previewSubject || 'No subject yet'}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
            {previewMessage || 'Write your broadcast message to preview it here.'}
          </p>
          <button type="button" className="mt-4 rounded-md bg-[#F97316] px-3 py-2 text-xs font-semibold text-white">
            View on Carryofy
          </button>
        </div>
      ) : (
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
      )}
    </section>
  );
}
