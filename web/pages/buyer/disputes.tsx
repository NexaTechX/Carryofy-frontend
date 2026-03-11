import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import { Scale, ArrowLeft, Clock, CheckCircle2, MessageSquare, Plus } from 'lucide-react';
import { getDisputes, createDispute, type Dispute, type CreateDisputePayload } from '../../lib/api/disputes';
import { showErrorToast, showSuccessToast } from '../../lib/ui/toast';

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Open',
  UNDER_REVIEW: 'Under Review',
  WAITING_FOR_RESPONSE: 'Waiting for Response',
  RESOLVED: 'Resolved',
  ESCALATED: 'Escalated',
};

export default function BuyerDisputesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formOrderId, setFormOrderId] = useState('');
  const [formReason, setFormReason] = useState('');
  const [formPriority, setFormPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [submitting, setSubmitting] = useState(false);

  const orderIdFromQuery = typeof router.query.orderId === 'string' ? router.query.orderId : undefined;

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
    if (mounted) fetchDisputes();
  }, [mounted]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDisputes();
      setDisputes(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const orderId = (formOrderId || orderIdFromQuery || '').trim();
    const reason = formReason.trim();
    if (!orderId || !reason) {
      showErrorToast('Please enter order ID and reason.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: CreateDisputePayload = {
        orderId,
        initiatorRole: 'BUYER',
        reason,
        priority: formPriority,
      };
      await createDispute(payload);
      showSuccessToast('Dispute opened. We will review it shortly.');
      setFormOrderId('');
      setFormReason('');
      setShowForm(false);
      fetchDisputes();
    } catch (err: any) {
      showErrorToast(err.response?.data?.message || 'Failed to open dispute');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      OPEN: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      UNDER_REVIEW: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      WAITING_FOR_RESPONSE: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      RESOLVED: 'bg-green-500/10 text-green-400 border-green-500/30',
      ESCALATED: 'bg-red-500/10 text-red-400 border-red-500/30',
    };
    return map[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/30';
  };

  return (
    <>
      <Head>
        <title>My Disputes | Carryofy</title>
      </Head>
      <BuyerLayout>
        <div className="mx-auto max-w-3xl px-4 py-8">
          <Link
            href="/buyer/orders"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to orders
          </Link>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
              <Scale className="w-6 h-6" />
              My Disputes
            </h1>
            <button
              type="button"
              onClick={() => {
                setShowForm(!showForm);
                if (orderIdFromQuery) setFormOrderId(orderIdFromQuery);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Open dispute
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleCreate} className="mb-8 rounded-xl border border-[#1f2432] bg-[#0e131d] p-6">
              <h2 className="text-lg font-medium text-white mb-4">Open a dispute</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Order ID</label>
                  <input
                    type="text"
                    value={formOrderId || orderIdFromQuery || ''}
                    onChange={(e) => setFormOrderId(e.target.value)}
                    placeholder="Paste order ID"
                    className="w-full rounded-lg border border-[#1f2432] bg-[#090c11] px-4 py-2 text-white placeholder-gray-500"
                    readOnly={!!orderIdFromQuery}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Reason</label>
                  <textarea
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    placeholder="Describe the issue with this order..."
                    rows={4}
                    className="w-full rounded-lg border border-[#1f2432] bg-[#090c11] px-4 py-2 text-white placeholder-gray-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                    className="w-full rounded-lg border border-[#1f2432] bg-[#090c11] px-4 py-2 text-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
                  >
                    {submitting ? 'Submitting…' : 'Submit dispute'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-lg border border-[#1f2432] px-4 py-2 text-sm text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {loading ? (
            <p className="text-gray-400">Loading disputes…</p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : disputes.length === 0 ? (
            <div className="rounded-xl border border-[#1f2432] bg-[#0e131d] p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">You have no disputes yet.</p>
              <p className="text-sm text-gray-500">If you have an issue with an order, open a dispute so we can help.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {disputes.map((d) => (
                <li
                  key={d.id}
                  className="rounded-xl border border-[#1f2432] bg-[#0e131d] p-4 hover:border-[#2a3142]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-xs text-gray-500">Dispute #{d.id.slice(0, 8)} · Order #{d.orderId.slice(0, 8)}</p>
                      <p className="text-white mt-1 line-clamp-2">{d.reason}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Opened {new Date(d.createdAt).toLocaleString()}
                        {d.slaDueAt && (
                          <> · SLA: {new Date(d.slaDueAt).toLocaleString()}</>
                        )}
                      </p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(d.status)}`}>
                      {STATUS_LABEL[d.status] || d.status}
                    </span>
                  </div>
                  {d.status !== 'RESOLVED' && (
                    <Link
                      href={`/buyer/disputes/${d.id}`}
                      className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      View details & messages
                    </Link>
                  )}
                  {d.status === 'RESOLVED' && d.resolutionOutcome && (
                    <p className="mt-3 text-sm text-gray-400">
                      Outcome: {d.resolutionOutcome}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </BuyerLayout>
    </>
  );
}
