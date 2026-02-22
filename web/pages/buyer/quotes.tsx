import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import apiClient from '../../lib/api/client';
import { formatDate, formatNgnFromKobo } from '../../lib/api/utils';
import { tokenManager } from '../../lib/auth';
import {
  FileText,
  Loader2,
  ChevronRight,
  Package,
  Plus,
  Box,
  ChevronDown,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';

interface QuoteItem {
  id: string;
  productId: string;
  requestedQuantity: number;
  requestedPriceKobo?: number;
  sellerQuotedPriceKobo?: number;
  sellerNotes?: string;
  product?: { id: string; title: string; images?: string[] };
}

interface QuoteRequest {
  id: string;
  sellerId: string;
  status: string;
  message?: string;
  sellerResponse?: string;
  validUntil?: string;
  createdAt: string;
  items: QuoteItem[];
  seller?: { id: string; businessName: string };
}

type DisplayStatus = 'PENDING' | 'RESPONDED' | 'ACCEPTED' | 'EXPIRED';

const STATUS_TABS: { value: DisplayStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'RESPONDED', label: 'Responded' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'EXPIRED', label: 'Expired' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
];

function getDisplayStatus(q: QuoteRequest): DisplayStatus {
  const now = new Date();
  if (q.validUntil && new Date(q.validUntil) < now) return 'EXPIRED';
  if (q.status === 'APPROVED') return 'ACCEPTED';
  if (q.status === 'REJECTED') return 'EXPIRED';
  const hasResponse = q.items.some((i) => i.sellerQuotedPriceKobo != null);
  return hasResponse ? 'RESPONDED' : 'PENDING';
}

function getStatusBadgeClasses(status: DisplayStatus): string {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'RESPONDED':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'ACCEPTED':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'EXPIRED':
      return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    default:
      return 'bg-zinc-500/20 text-zinc-400';
  }
}

function getStatusLabel(status: DisplayStatus): string {
  return STATUS_TABS.find((t) => t.value === status)?.label ?? status;
}

export default function MyQuotesPage() {
  const router = useRouter();
  const showSample = router.query.sample === '1';
  const [mounted, setMounted] = useState(false);
  const [list, setList] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<DisplayStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !tokenManager.isAuthenticated()) {
      if (mounted && !tokenManager.isAuthenticated()) {
        window.location.href = '/auth/login?redirect=/buyer/quotes';
      }
      return;
    }
    if (showSample) {
      setList([]);
      setLoading(false);
      setError(null);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get('/quote-requests');
        const data = res.data?.data ?? res.data;
        setList(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        setError(e.response?.data?.message || e.message || 'Failed to load quote requests.');
      } finally {
        setLoading(false);
      }
    })();
  }, [mounted, showSample]);

  const formatPrice = (kobo: number) => formatNgnFromKobo(kobo, { maximumFractionDigits: 2 });

  const displayList = list.map((q) => ({ ...q, displayStatus: getDisplayStatus(q) }));
  const filteredList =
    statusFilter === 'ALL'
      ? displayList
      : displayList.filter((q) => q.displayStatus === statusFilter);
  const sortedList = [...filteredList].sort((a, b) => {
    const da = new Date(a.createdAt).getTime();
    const db = new Date(b.createdAt).getTime();
    return sortBy === 'newest' ? db - da : da - db;
  });

  const isEmpty = !loading && !error && sortedList.length === 0;
  const isPopulated = !loading && !error && sortedList.length > 0;

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>My Quotes - Buyer | Carryofy</title>
        <meta name="description" content="Request and negotiate prices with sellers for bulk or custom orders" />
      </Head>
      <BuyerLayout>
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-white text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-[#ff6600]" />
                My Quotes
              </h1>
              <p className="text-[#ffcc99]/70 text-sm sm:text-base mt-1">
                Request and negotiate prices with sellers for bulk or custom orders
              </p>
            </div>
            <Link
              href="/buyer/products"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#ff6600] text-black font-bold rounded-xl hover:bg-[#e55d00] transition-colors shrink-0"
            >
              <Plus className="w-5 h-5" />
              New Quote Request
            </Link>
          </div>

          {/* Info Banner */}
          <div className="mb-6 p-4 rounded-xl bg-[#1a1a1a] border border-[#ff6600]/20">
            <p className="text-[#ffcc99]/90 text-sm">
              <span className="text-[#ff6600] mr-1.5">💡</span>
              <strong className="text-white">What are quotes?</strong> Request custom pricing from sellers for large
              orders or specialty products. Sellers respond within 24–48 hours.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-[#ffcc99] py-12">
              <Loader2 className="w-6 h-6 animate-spin" />
              Loading...
            </div>
          ) : error ? (
            <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/50 text-red-400">{error}</div>
          ) : (
            <>
              {/* Filter/Sort Bar */}
              {isPopulated && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex flex-wrap gap-1.5 p-1 bg-[#1a1a1a] rounded-lg border border-[#ff6600]/20 w-fit">
                    {STATUS_TABS.map((tab) => (
                      <button
                        key={tab.value}
                        onClick={() => setStatusFilter(tab.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          statusFilter === tab.value
                            ? 'bg-[#ff6600] text-black'
                            : 'text-[#ffcc99]/70 hover:text-white hover:bg-[#252525]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#ff6600]/30 bg-[#1a1a1a] text-[#ffcc99] text-sm hover:border-[#ff6600]/50 transition-colors"
                    >
                      {SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Sort'}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {sortDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setSortDropdownOpen(false)}
                          aria-hidden
                        />
                        <div className="absolute right-0 mt-1 z-20 py-1 min-w-[160px] rounded-lg border border-[#ff6600]/30 bg-[#1a1a1a] shadow-xl">
                          {SORT_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => {
                                setSortBy(opt.value);
                                setSortDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-[#252525] transition-colors ${
                                sortBy === opt.value ? 'text-[#ff6600] font-medium' : 'text-[#ffcc99]'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Populated State — Quote Cards */}
              {isPopulated && (
                <ul className="space-y-4">
                  {sortedList.map((q) => {
                    const item = q.items[0];
                    const productName = item?.product?.title ?? `Product ${item?.productId ?? '—'}`;
                    const sellerName = q.seller?.businessName ?? 'Seller';
                    const imageUrl = item?.product?.images?.[0];
                    const displayStatus = q.displayStatus;
                    const isExpiringSoon =
                      q.validUntil &&
                      displayStatus !== 'EXPIRED' &&
                      new Date(q.validUntil).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

                    return (
                      <li
                        key={q.id}
                        className="rounded-xl border border-[#ff6600]/20 bg-[#1a1a1a] overflow-hidden hover:border-[#ff6600]/40 transition-colors"
                      >
                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                          {/* Product thumbnail */}
                          <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-[#252525] overflow-hidden flex items-center justify-center">
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={productName}
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-10 h-10 text-[#ffcc99]/30" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                              <div>
                                <h3 className="text-white font-semibold">{productName}</h3>
                                <p className="text-[#ffcc99]/70 text-sm flex items-center gap-1.5">
                                  {sellerName}
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" aria-label="Verified" />
                                </p>
                              </div>
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusBadgeClasses(
                                  displayStatus
                                )}`}
                              >
                                {getStatusLabel(displayStatus)}
                              </span>
                            </div>
                            <p className="text-[#ffcc99]/50 text-xs mb-3">Quote ID: {q.id.slice(0, 8)}...</p>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#ffcc99] mb-3">
                              <span>
                                Qty: <strong className="text-white">{item?.requestedQuantity ?? '—'}</strong>
                              </span>
                              {item?.requestedPriceKobo != null && (
                                <span>Requested: {formatPrice(item.requestedPriceKobo)}/unit</span>
                              )}
                              {item?.sellerQuotedPriceKobo != null && (
                                <span className="text-[#ff6600] font-medium">
                                  Offered: {formatPrice(item.sellerQuotedPriceKobo)}/unit
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#ffcc99]/60">
                              <span>Submitted {formatDate(q.createdAt)}</span>
                              {q.validUntil && (
                                <span className={isExpiringSoon ? 'text-amber-400' : ''}>
                                  Expires {formatDate(q.validUntil)}
                                  {isExpiringSoon && ' (soon)'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 flex flex-wrap gap-2">
                          <Link
                            href={`/buyer/quotes/${q.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#ff6600]/40 text-[#ff6600] text-sm font-medium hover:bg-[#ff6600]/10 transition-colors"
                          >
                            View Details <ChevronRight className="w-4 h-4" />
                          </Link>
                          {displayStatus === 'RESPONDED' && (
                            <Link
                              href={`/buyer/checkout?quoteId=${q.id}`}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff6600] text-black text-sm font-bold rounded-lg hover:bg-[#e55d00] transition-colors"
                            >
                              Accept Offer
                            </Link>
                          )}
                          {displayStatus === 'RESPONDED' && (
                            <button
                              type="button"
                              className="px-4 py-2 rounded-lg border border-zinc-500/40 text-zinc-400 text-sm hover:bg-zinc-500/10 transition-colors"
                            >
                              Decline
                            </button>
                          )}
                          {displayStatus === 'EXPIRED' && (
                            <Link
                              href={`/buyer/quote-request?productId=${item?.productId}&sellerId=${q.sellerId}&quantity=${item?.requestedQuantity ?? 1}`}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#ff6600]/40 text-[#ff6600] text-sm font-medium hover:bg-[#ff6600]/10 transition-colors"
                            >
                              Resubmit
                            </Link>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Empty State */}
              {isEmpty && (
                <div className="rounded-xl border border-[#ff6600]/20 bg-[#1a1a1a] p-8 sm:p-12 text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-[#252525] border border-[#ff6600]/20 mb-6">
                    <Box className="w-12 h-12 text-[#ffcc99]/40" />
                  </div>
                  <h2 className="text-white text-xl font-bold mb-2">No quote requests yet</h2>
                  <p className="text-[#ffcc99]/70 text-sm max-w-md mx-auto mb-8">
                    Request quotes from sellers for bulk pricing, custom quantities, or negotiated rates.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                      href="/buyer/products"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff6600] text-black font-bold rounded-xl hover:bg-[#e55d00] transition-colors"
                    >
                      Browse Wholesale Products
                    </Link>
                    <Link
                      href="/buyer/help"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-[#ff6600]/50 text-[#ff6600] font-semibold hover:bg-[#ff6600]/10 transition-colors"
                    >
                      <HelpCircle className="w-5 h-5" />
                      Learn How Quotes Work
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </BuyerLayout>
    </>
  );
}
