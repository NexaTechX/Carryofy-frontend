import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import SellerLayout from '../../../components/seller/SellerLayout';
import { useAuth, tokenManager } from '../../../lib/auth';
import { apiClient } from '../../../lib/api/client';
import { FileText, ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface QuoteItem {
  id: string;
  productId: string;
  requestedQuantity: number;
  requestedPriceKobo?: number;
  sellerQuotedPriceKobo?: number;
  sellerNotes?: string;
  product?: { id: string; title: string; images: string[] };
}

interface QuoteRequest {
  id: string;
  buyerId: string;
  sellerId: string;
  status: string;
  message?: string;
  sellerResponse?: string;
  createdAt: string;
  items: QuoteItem[];
  buyer?: { id: string; name: string; email: string };
}

export default function SellerQuoteDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [quote, setQuote] = useState<QuoteRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sellerResponse, setSellerResponse] = useState('');
  const [itemPrices, setItemPrices] = useState<Record<string, { sellerQuotedPriceKobo?: number; sellerNotes?: string }>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    if (user.role !== 'SELLER' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    if (id && typeof id === 'string') fetchQuote(id);
  }, [router, id, authLoading, isAuthenticated, user]);

  const fetchQuote = async (quoteId: string) => {
    try {
      const res = await apiClient.get(`/quote-requests/${quoteId}`);
      const data = res.data?.data ?? res.data;
      setQuote(data);
      const initial: Record<string, { sellerQuotedPriceKobo?: number; sellerNotes?: string }> = {};
      (data?.items || []).forEach((item: QuoteItem) => {
        initial[item.id] = {
          sellerQuotedPriceKobo: item.sellerQuotedPriceKobo ?? (item.requestedPriceKobo ? item.requestedPriceKobo : undefined),
          sellerNotes: item.sellerNotes ?? undefined,
        };
      });
      setItemPrices(initial);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load quote');
      router.push('/seller/quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!quote || quote.status !== 'PENDING') return;
    setSubmitting(true);
    try {
      const items = quote.items.map((item) => ({
        id: item.id,
        sellerQuotedPriceKobo: itemPrices[item.id]?.sellerQuotedPriceKobo
          ? Math.round(itemPrices[item.id].sellerQuotedPriceKobo!)
          : undefined,
        sellerNotes: itemPrices[item.id]?.sellerNotes,
      }));
      await apiClient.patch(`/quote-requests/${quote.id}`, {
        status: 'APPROVED',
        sellerResponse: sellerResponse || undefined,
        items,
      });
      toast.success('Quote approved');
      fetchQuote(quote.id);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to approve quote');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!quote || quote.status !== 'PENDING') return;
    setSubmitting(true);
    try {
      await apiClient.patch(`/quote-requests/${quote.id}`, {
        status: 'REJECTED',
        sellerResponse: sellerResponse || undefined,
      });
      toast.success('Quote rejected');
      fetchQuote(quote.id);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to reject quote');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (kobo: number) => `₦${(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading || !quote) {
    return (
      <SellerLayout>
        <div className="flex justify-center items-center min-h-[40vh]">
          <Loader2 className="w-10 h-10 text-[#ff6600] animate-spin" />
        </div>
      </SellerLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Quote #{quote.id.slice(0, 8)} - Seller | Carryofy</title>
      </Head>
      <SellerLayout>
        <div className="p-4 lg:p-8">
          <Link
            href="/seller/quotes"
            className="inline-flex items-center gap-2 text-[#ffcc99] hover:text-[#ff6600] mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to quotes
          </Link>

          <div className="bg-[#1a1a1a] rounded-2xl border border-[#ff6600]/20 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-white">Quote request</h1>
                <p className="text-[#ffcc99] text-sm">
                  From {quote.buyer?.name ?? 'Buyer'} · {formatDate(quote.createdAt)}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  quote.status === 'PENDING'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : quote.status === 'APPROVED'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {quote.status}
              </span>
            </div>

            {quote.message && (
              <div className="p-4 bg-black/40 rounded-xl">
                <p className="text-[#ffcc99] text-sm font-medium mb-1">Buyer message</p>
                <p className="text-white">{quote.message}</p>
              </div>
            )}

            <div>
              <p className="text-[#ffcc99] text-sm font-medium mb-3">Items</p>
              <div className="space-y-3">
                {quote.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center gap-4 p-4 bg-black/40 rounded-xl border border-[#ff6600]/10"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">{item.product?.title ?? item.productId}</p>
                      <p className="text-[#ffcc99] text-sm">
                        Qty: {item.requestedQuantity}
                        {item.requestedPriceKobo != null && (
                          <> · Requested: {formatPrice(item.requestedPriceKobo)}/unit</>
                        )}
                      </p>
                    </div>
                    {quote.status === 'PENDING' && (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          placeholder="Your price (₦)"
                          step="0.01"
                          min="0"
                          className="w-28 px-3 py-2 rounded-lg bg-black border border-[#ff6600]/30 text-white text-sm"
                          value={
                            itemPrices[item.id]?.sellerQuotedPriceKobo != null
                              ? (itemPrices[item.id].sellerQuotedPriceKobo! / 100).toFixed(2)
                              : ''
                          }
                          onChange={(e) => {
                            const v = e.target.value ? Math.round(parseFloat(e.target.value) * 100) : undefined;
                            setItemPrices((prev) => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], sellerQuotedPriceKobo: v },
                            }));
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Notes"
                          className="w-40 px-3 py-2 rounded-lg bg-black border border-[#ff6600]/30 text-white text-sm"
                          value={itemPrices[item.id]?.sellerNotes ?? ''}
                          onChange={(e) =>
                            setItemPrices((prev) => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], sellerNotes: e.target.value },
                            }))
                          }
                        />
                      </div>
                    )}
                    {quote.status !== 'PENDING' && item.sellerQuotedPriceKobo != null && (
                      <p className="text-white font-medium">{formatPrice(item.sellerQuotedPriceKobo)}/unit</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {quote.status === 'PENDING' && (
              <>
                <div>
                  <label className="block text-[#ffcc99] text-sm font-medium mb-2">Your response (optional)</label>
                  <textarea
                    value={sellerResponse}
                    onChange={(e) => setSellerResponse(e.target.value)}
                    placeholder="Message to the buyer"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-black border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600]"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Approve quote
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600/80 hover:bg-red-500 text-white font-semibold disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Reject
                  </button>
                </div>
              </>
            )}

            {quote.status === 'APPROVED' && quote.sellerResponse && (
              <div className="p-4 bg-black/40 rounded-xl">
                <p className="text-[#ffcc99] text-sm font-medium mb-1">Your response</p>
                <p className="text-white">{quote.sellerResponse}</p>
              </div>
            )}
          </div>
        </div>
      </SellerLayout>
    </>
  );
}
