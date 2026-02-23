import Head from 'next/head';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import SellerLayout from '../../../components/seller/SellerLayout';
import { useAuth, tokenManager } from '../../../lib/auth';
import { getApiUrl, formatDateTime, formatDate, formatNgnFromKobo } from '../../../lib/api/utils';
import {
  FileText,
  ChevronRight,
  CheckCircle,
  XCircle,
  ShoppingBag,
  Reply,
  ArrowRight,
  Send,
  FileQuestion,
} from 'lucide-react';

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
  validUntil?: string;
  createdAt: string;
  items: QuoteItem[];
  buyer?: { id: string; name: string; email: string; company?: string };
}

type FilterTab = 'all' | 'pending' | 'accepted' | 'declined' | 'expired';

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'expired', label: 'Expired' },
];

function getQuoteEffectiveStatus(q: QuoteRequest): FilterTab {
  if (q.status === 'APPROVED') return 'accepted';
  if (q.status === 'REJECTED') return 'declined';
  if (q.status === 'PENDING' && q.validUntil) {
    const validUntil = new Date(q.validUntil);
    if (validUntil < new Date()) return 'expired';
  }
  return 'pending';
}

function computeTotalValueKobo(q: QuoteRequest): number {
  return (q.items ?? []).reduce(
    (sum, i) =>
      sum +
      i.requestedQuantity * (i.sellerQuotedPriceKobo ?? i.requestedPriceKobo ?? 0),
    0
  );
}

export default function SellerQuotesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');

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
    fetchQuotes();
  }, [router, authLoading, isAuthenticated, user]);

  const fetchQuotes = async () => {
    try {
      const token = tokenManager.getAccessToken();
      const response = await fetch(getApiUrl('/quote-requests'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setQuotes(list);
      }
    } catch (e) {
      console.error(e);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = quotes.length;
    const pending = quotes.filter((q) => getQuoteEffectiveStatus(q) === 'pending').length;
    const accepted = quotes.filter((q) => q.status === 'APPROVED').length;
    const totalValueKobo = quotes
      .filter((q) => q.status === 'APPROVED')
      .reduce((sum, q) => sum + computeTotalValueKobo(q), 0);
    return {
      totalRequests: total,
      pendingResponse: pending,
      accepted,
      totalValueKobo,
    };
  }, [quotes]);

  const filteredQuotes = useMemo(() => {
    if (filterTab === 'all') return quotes;
    return quotes.filter((q) => getQuoteEffectiveStatus(q) === filterTab);
  }, [quotes, filterTab]);

  const getBorderColor = (q: QuoteRequest) => {
    const status = getQuoteEffectiveStatus(q);
    if (status === 'accepted') return 'border-l-[#22c55e]';
    if (status === 'declined') return 'border-l-[#ef4444]';
    if (status === 'expired') return 'border-l-[#6b7280]';
    return 'border-l-[#FF6B00]'; // pending
  };

  const getInitials = (name: string) => {
    return name
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <>
      <Head>
        <title>Quote Requests - Seller | Carryofy</title>
        <meta name="description" content="Manage B2B quote requests" />
      </Head>
      <SellerLayout>
        <div className="p-4 lg:p-8">
          {/* Page header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#ff6600]/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#ff6600]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Quote Requests</h1>
                <p className="text-[#ffcc99] text-sm">B2B inquiries and quote requests from buyers</p>
              </div>
            </div>

            {/* Stats row - always visible */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="h-[80px] rounded-[10px] bg-[#1A1A1A] border border-[#2A2A2A] flex flex-col justify-center px-4">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#A0A0A0]">
                  Total Requests
                </span>
                <span className="text-xl font-bold text-white mt-1">
                  {loading ? '—' : stats.totalRequests}
                </span>
              </div>
              <div className="h-[80px] rounded-[10px] bg-[#1A1A1A] border border-[#2A2A2A] flex flex-col justify-center px-4">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#A0A0A0]">
                  Pending Response
                </span>
                <span className="text-xl font-bold text-white mt-1">
                  {loading ? '—' : stats.pendingResponse}
                </span>
              </div>
              <div className="h-[80px] rounded-[10px] bg-[#1A1A1A] border border-[#2A2A2A] flex flex-col justify-center px-4">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#A0A0A0]">
                  Accepted
                </span>
                <span className="text-xl font-bold text-white mt-1">
                  {loading ? '—' : stats.accepted}
                </span>
              </div>
              <div className="h-[80px] rounded-[10px] bg-[#1A1A1A] border border-[#2A2A2A] flex flex-col justify-center px-4">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#A0A0A0]">
                  Total Value
                </span>
                <span className="text-xl font-bold text-white mt-1">
                  {loading ? '—' : formatNgnFromKobo(stats.totalValueKobo)}
                </span>
              </div>
            </div>
          </div>

          {/* How Quotes Work banner - only when 0 quotes */}
          {!loading && quotes.length === 0 && (
            <div className="mb-6 rounded-[12px] bg-[#1A1A1A] border border-[#2A2A2A] p-5">
              <h3 className="text-sm font-semibold text-white mb-4">How quotes work</h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-4 sm:gap-6">
                <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left">
                  <div className="w-10 h-10 rounded-full bg-[#FF6B00]/20 flex items-center justify-center mb-2">
                    <ShoppingBag className="w-5 h-5 text-[#FF6B00]" />
                  </div>
                  <p className="text-white font-medium text-sm">Step 1</p>
                  <p className="text-white font-semibold">Buyer finds your B2B product</p>
                  <p className="text-[#A0A0A0] text-xs mt-1">
                    Products set to B2B or Both mode appear with a quote option
                  </p>
                </div>
                <div className="hidden sm:flex items-center pt-6">
                  <ArrowRight className="w-5 h-5 text-[#2A2A2A]" />
                </div>
                <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left">
                  <div className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center mb-2">
                    <FileText className="w-5 h-5 text-[#A0A0A0]" />
                  </div>
                  <p className="text-white font-medium text-sm">Step 2</p>
                  <p className="text-white font-semibold">They submit a quote request with quantity & details</p>
                  <p className="text-[#A0A0A0] text-xs mt-1">
                    Buyer includes quantity, preferred price, and optional message
                  </p>
                </div>
                <div className="hidden sm:flex items-center pt-6">
                  <ArrowRight className="w-5 h-5 text-[#2A2A2A]" />
                </div>
                <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left">
                  <div className="w-10 h-10 rounded-full bg-[#22c55e]/20 flex items-center justify-center mb-2">
                    <Reply className="w-5 h-5 text-[#22c55e]" />
                  </div>
                  <p className="text-white font-medium text-sm">Step 3</p>
                  <p className="text-white font-semibold">You respond with price, terms & delivery timeline</p>
                  <p className="text-[#A0A0A0] text-xs mt-1">
                    Accept, decline, or counter with your offer
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filter tabs - always visible when we have content to show or for empty state */}
          <div className="mb-4 flex flex-wrap gap-2">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilterTab(tab.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  filterTab === tab.value
                    ? 'bg-[#FF6B00] text-white'
                    : 'bg-[#1A1A1A] border border-[#2A2A2A] text-[#A0A0A0] hover:text-white hover:border-[#3A3A3A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-2 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin" />
            </div>
          ) : quotes.length === 0 ? (
            /* Empty state card */
            <div className="rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] p-12 text-center max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-[#FF6B00]/20 flex items-center justify-center mx-auto mb-4">
                <FileQuestion className="w-10 h-10 text-[#FF6B00]" strokeWidth={1.5} />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">No quote requests yet</h2>
              <p className="text-[#A0A0A0] text-sm mb-6 max-w-sm mx-auto">
                Make sure your products are set to B2B or Both mode so buyers can request quotes
              </p>
              <Link
                href="/seller/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#ff7a1a] text-white font-semibold text-sm transition"
              >
                Update product selling mode →
              </Link>
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] p-12 text-center">
              <p className="text-white font-medium mb-1">No quotes match the selected filter</p>
              <p className="text-[#A0A0A0] text-sm">Try selecting a different tab.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuotes.map((quote) => {
                const firstItem = quote.items?.[0];
                const productName = firstItem?.product?.title ?? 'Product';
                const totalQty = quote.items?.reduce((s, i) => s + i.requestedQuantity, 0) ?? 0;
                const messagePreview = quote.message
                  ? quote.message.length > 60
                    ? quote.message.slice(0, 60) + '…'
                    : quote.message
                  : null;
                const isPending = getQuoteEffectiveStatus(quote) === 'pending';

                return (
                  <div
                    key={quote.id}
                    className={`rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] border-l-4 ${getBorderColor(
                      quote
                    )} p-5 flex flex-col sm:flex-row sm:items-center gap-4`}
                  >
                    {/* Left: buyer info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center shrink-0 text-white text-sm font-semibold">
                        {getInitials(quote.buyer?.name ?? 'B')}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{quote.buyer?.name ?? 'Buyer'}</p>
                        {quote.buyer?.company && (
                          <p className="text-[#A0A0A0] text-xs truncate">{quote.buyer.company}</p>
                        )}
                      </div>
                    </div>

                    {/* Middle: product + quantity + message */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-white font-medium truncate">{productName}</p>
                      <p className="text-[#A0A0A0] text-sm">
                        Qty: {totalQty}
                        {quote.items && quote.items.length > 1 && ` · ${quote.items.length} items`}
                      </p>
                      {messagePreview && (
                        <p className="text-[#A0A0A0] text-xs truncate">{messagePreview}</p>
                      )}
                    </div>

                    {/* Right: date, deadline, actions */}
                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-[#A0A0A0] text-xs">{formatDateTime(quote.createdAt)}</p>
                        {quote.validUntil && (
                          <p className="text-[#A0A0A0] text-xs">
                            Deadline: {formatDate(quote.validUntil)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isPending ? (
                          <>
                            <Link
                              href={`/seller/quotes/${quote.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium text-sm transition"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Accept
                            </Link>
                            <Link
                              href={`/seller/quotes/${quote.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#ef4444]/80 hover:bg-[#ef4444] text-white font-medium text-sm transition"
                            >
                              <XCircle className="w-4 h-4" />
                              Decline
                            </Link>
                            <Link
                              href={`/seller/quotes/${quote.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00]/10 font-medium text-sm transition"
                            >
                              <Send className="w-4 h-4" />
                              Counter
                            </Link>
                          </>
                        ) : (
                          <Link
                            href={`/seller/quotes/${quote.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#2A2A2A] text-[#A0A0A0] hover:text-white hover:border-[#3A3A3A] font-medium text-sm transition"
                          >
                            View
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SellerLayout>
    </>
  );
}
