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
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">Live Preview</h2>
      <div className="mb-3 flex rounded-md border border-gray-200 bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('email')}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs transition-all duration-150 ease-in ${
            activeTab === 'email' ? 'bg-orange-500 text-white' : 'text-gray-500'
          }`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('inapp')}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs transition-all duration-150 ease-in ${
            activeTab === 'inapp' ? 'bg-orange-500 text-white' : 'text-gray-500'
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
          <button type="button" className="mt-4 rounded-md bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600">
            View on Carryofy
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-start gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-orange-500 text-xs font-bold text-white">
              CF
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">Carryofy</p>
                <span className="text-xs text-gray-400">now</span>
              </div>
              <p className="mt-1 text-xs font-medium text-gray-800">{broadcastType}</p>
              <p className="mt-1 text-xs text-gray-500">{inAppSnippet}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
