import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BuyerLayout from '../../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../../lib/auth';
import { ArrowLeft, Scale, Send } from 'lucide-react';
import { getDispute, addDisputeMessage, type Dispute } from '../../../lib/api/disputes';
import { showErrorToast, showSuccessToast } from '../../../lib/ui/toast';

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Open',
  UNDER_REVIEW: 'Under Review',
  WAITING_FOR_RESPONSE: 'Waiting for Response',
  RESOLVED: 'Resolved',
  ESCALATED: 'Escalated',
};

export default function BuyerDisputeDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [mounted, setMounted] = useState(false);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageBody, setMessageBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!tokenManager.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    const user = userManager.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (!mounted || typeof id !== 'string') return;
    const fetchOne = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDispute(id);
        setDispute(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Dispute not found');
      } finally {
        setLoading(false);
      }
    };
    fetchOne();
  }, [mounted, id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim() || typeof id !== 'string') return;
    setSending(true);
    try {
      await addDisputeMessage(id, { body: messageBody.trim() });
      showSuccessToast('Message sent');
      setMessageBody('');
      const updated = await getDispute(id);
      setDispute(updated);
    } catch (err: any) {
      showErrorToast(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading || !dispute) {
    return (
      <BuyerLayout>
        <div className="mx-auto max-w-3xl px-4 py-8">
          {loading ? <p className="text-gray-400">Loading…</p> : error ? <p className="text-red-400">{error}</p> : null}
        </div>
      </BuyerLayout>
    );
  }

  const canReply = dispute.status !== 'RESOLVED';

  return (
    <>
      <Head>
        <title>Dispute #{dispute.id.slice(0, 8)} | Carryofy</title>
      </Head>
      <BuyerLayout>
        <div className="mx-auto max-w-3xl px-4 py-8">
          <Link
            href="/buyer/disputes"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to disputes
          </Link>
          <div className="flex items-center gap-3 mb-6">
            <Scale className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold text-white">
                Dispute #{dispute.id.slice(0, 8)}
              </h1>
              <p className="text-sm text-gray-500">Order #{dispute.orderId.slice(0, 8)}</p>
            </div>
            <span className={`ml-auto inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
              dispute.status === 'RESOLVED' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
              dispute.status === 'OPEN' || dispute.status === 'ESCALATED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
              'bg-blue-500/10 text-blue-400 border-blue-500/30'
            }`}>
              {STATUS_LABEL[dispute.status] || dispute.status}
            </span>
          </div>

          <div className="rounded-xl border border-[#1f2432] bg-[#0e131d] p-6 mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Reason</p>
            <p className="text-white whitespace-pre-wrap mt-1">{dispute.reason}</p>
            <p className="text-xs text-gray-500 mt-3">
              Opened {new Date(dispute.createdAt).toLocaleString()}
              {dispute.slaDueAt && <> · SLA: {new Date(dispute.slaDueAt).toLocaleString()}</>}
            </p>
          </div>

          {dispute.evidence && dispute.evidence.length > 0 && (
            <div className="rounded-xl border border-[#1f2432] bg-[#0e131d] p-6 mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Evidence</p>
              <ul className="space-y-2">
                {dispute.evidence.map((e) => (
                  <li key={e.id}>
                    <a href={e.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                      {e.fileName || 'Attachment'}
                    </a>
                    {e.notes && <p className="text-xs text-gray-500">{e.notes}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {dispute.messages && dispute.messages.length > 0 && (
            <div className="rounded-xl border border-[#1f2432] bg-[#0e131d] p-6 mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Messages</p>
              <ul className="space-y-4">
                {dispute.messages.map((m) => (
                  <li key={m.id} className="border-l-2 border-[#1f2432] pl-4">
                    <p className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleString()}</p>
                    <p className="text-white whitespace-pre-wrap mt-1">{m.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {dispute.status === 'RESOLVED' && dispute.resolutionOutcome && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6 mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Resolution</p>
              <p className="text-white mt-1">{dispute.resolutionOutcome}</p>
              {dispute.resolutionNotes && <p className="text-gray-400 mt-2 text-sm">{dispute.resolutionNotes}</p>}
              {dispute.resolvedAt && <p className="text-xs text-gray-500 mt-2">Resolved {new Date(dispute.resolvedAt).toLocaleString()}</p>}
            </div>
          )}

          {canReply && (
            <form onSubmit={handleSendMessage} className="rounded-xl border border-[#1f2432] bg-[#0e131d] p-6">
              <label className="block text-sm text-gray-400 mb-2">Add a message</label>
              <textarea
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Type your message..."
                rows={3}
                className="w-full rounded-lg border border-[#1f2432] bg-[#090c11] px-4 py-2 text-white placeholder-gray-500 mb-3"
              />
              <button
                type="submit"
                disabled={sending || !messageBody.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending…' : 'Send'}
              </button>
            </form>
          )}
        </div>
      </BuyerLayout>
    </>
  );
}
