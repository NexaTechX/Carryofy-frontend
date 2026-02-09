import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AdminPageHeader, LoadingState } from '../../components/admin/ui';
import { sendBroadcastRequest, fetchBroadcastProducts } from '../../lib/admin/api';
import type {
  BroadcastAudience,
  CreateBroadcastPayload,
  BroadcastResult,
  BroadcastProductOption,
} from '../../lib/admin/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Mail, Bell, Users, Package, Send, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';

const inputClass =
  'w-full rounded-xl border border-[#1f1f1f] bg-[#131313] px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:border-primary focus:outline-none disabled:opacity-50';
const labelClass = 'mb-1 block text-sm font-medium text-gray-300';

const AUDIENCE_OPTIONS: { value: BroadcastAudience; label: string }[] = [
  { value: 'BUYER', label: 'Buyers' },
  { value: 'SELLER', label: 'Sellers' },
  { value: 'RIDER', label: 'Riders' },
];

export default function AdminBroadcastPage() {
  const [audience, setAudience] = useState<BroadcastAudience[]>([]);
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelInApp, setChannelInApp] = useState(true);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaLink, setCtaLink] = useState('');
  const [productIds, setProductIds] = useState<string[]>([]);

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['admin', 'broadcast', 'products'],
    queryFn: () => fetchBroadcastProducts(50),
  });

  const sendBroadcast = useMutation({
    mutationFn: (payload: CreateBroadcastPayload) => sendBroadcastRequest(payload),
    onSuccess: (result: BroadcastResult) => {
      toast.success(
        `Broadcast sent: ${result.sentInApp} in-app, ${result.sentEmail} emails${result.failed ? ` (${result.failed} failed)` : ''}`
      );
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to send broadcast';
      toast.error(message);
    },
  });

  const toggleAudience = (value: BroadcastAudience) => {
    setAudience((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    );
  };

  const toggleProduct = (id: string) => {
    setProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (audience.length === 0) {
      toast.error('Select at least one audience (Buyers, Sellers, or Riders).');
      return;
    }
    if (!channelEmail && !channelInApp) {
      toast.error('Select at least one channel (Email or In-app notification).');
      return;
    }
    if (channelEmail && !subject.trim()) {
      toast.error('Subject is required when Email is selected.');
      return;
    }
    if (!body.trim()) {
      toast.error('Message body is required.');
      return;
    }
    const payload: CreateBroadcastPayload = {
      audience,
      channels: { email: channelEmail, inApp: channelInApp },
      subject: subject.trim(),
      body: body.trim(),
      ...(ctaLabel.trim() && ctaLink.trim() && { ctaLabel: ctaLabel.trim(), ctaLink: ctaLink.trim() }),
      ...(productIds.length > 0 && { productIds }),
    };
    sendBroadcast.mutate(payload);
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Broadcast Center"
            subtitle="Send notifications and emails to buyers, sellers, or riders. Manual send only."
          />

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Audience */}
            <section className="rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d] p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                <Users className="h-5 w-5 text-primary" />
                Audience
              </h2>
              <p className="mb-3 text-sm text-gray-400">Select at least one group.</p>
              <div className="flex flex-wrap gap-4">
                {AUDIENCE_OPTIONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2 text-sm text-gray-300"
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={audience.includes(value)}
                      onClick={() => toggleAudience(value)}
                      className="flex items-center justify-center rounded border border-[#333] bg-[#131313] p-1.5 text-primary hover:border-primary/50"
                    >
                      {audience.includes(value) ? (
                        <CheckSquare className="h-5 w-5" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                    {label}
                  </label>
                ))}
              </div>
            </section>

            {/* Channels */}
            <section className="rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d] p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                <Mail className="h-5 w-5 text-primary" />
                Channels
              </h2>
              <p className="mb-3 text-sm text-gray-400">Select at least one.</p>
              <div className="flex flex-wrap gap-6">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={channelEmail}
                    onChange={(e) => setChannelEmail(e.target.checked)}
                    className="h-4 w-4 rounded border-[#333] text-primary focus:ring-primary"
                  />
                  Email
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={channelInApp}
                    onChange={(e) => setChannelInApp(e.target.checked)}
                    className="h-4 w-4 rounded border-[#333] text-primary focus:ring-primary"
                  />
                  <Bell className="h-4 w-4" />
                  In-app notification
                </label>
              </div>
            </section>

            {/* Message */}
            <section className="rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d] p-6">
              <h2 className="mb-4 text-base font-semibold text-white">Message</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="subject" className={labelClass}>
                    Subject {channelEmail && <span className="text-primary">*</span>}
                  </label>
                  <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. New products just dropped"
                    className={inputClass}
                    required={channelEmail}
                  />
                </div>
                <div>
                  <label htmlFor="body" className={labelClass}>
                    Message body <span className="text-primary">*</span>
                  </label>
                  <textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your message. You can use basic HTML (e.g. <p>, <strong>, <a>)."
                    rows={6}
                    className={inputClass}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="ctaLabel" className={labelClass}>
                      CTA button label (optional)
                    </label>
                    <input
                      id="ctaLabel"
                      type="text"
                      value={ctaLabel}
                      onChange={(e) => setCtaLabel(e.target.value)}
                      placeholder="e.g. View new products"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="ctaLink" className={labelClass}>
                      CTA link (optional)
                    </label>
                    <input
                      id="ctaLink"
                      type="text"
                      value={ctaLink}
                      onChange={(e) => setCtaLink(e.target.value)}
                      placeholder="https://carryofy.com/buyer/products"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Product promotion */}
            <section className="rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d] p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                <Package className="h-5 w-5 text-primary" />
                Attach products (optional)
              </h2>
              <p className="mb-3 text-sm text-gray-400">
                Include recently approved products in the email. Select products to feature.
              </p>
              {productsLoading ? (
                <LoadingState label="Loading products…" />
              ) : products.length === 0 ? (
                <p className="text-sm text-gray-500">No recently approved products.</p>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-[#1f1f1f] bg-[#131313] p-3">
                  {products.map((p: BroadcastProductOption) => (
                    <label
                      key={p.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2 hover:bg-[#1a1a1a]"
                    >
                      <input
                        type="checkbox"
                        checked={productIds.includes(p.id)}
                        onChange={() => toggleProduct(p.id)}
                        className="h-4 w-4 rounded border-[#333] text-primary focus:ring-primary"
                      />
                      {p.images?.[0] && (
                        <img
                          src={p.images[0]}
                          alt=""
                          className="h-10 w-10 rounded object-cover"
                        />
                      )}
                      <span className="text-sm text-gray-200">{p.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </section>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sendBroadcast.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
              >
                {sendBroadcast.isPending ? (
                  'Sending…'
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send broadcast
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
