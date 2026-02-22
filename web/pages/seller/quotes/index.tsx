import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import SellerLayout from '../../../components/seller/SellerLayout';
import { useAuth, tokenManager } from '../../../lib/auth';
import { getApiUrl, formatDateTime } from '../../../lib/api/utils';
import { FileText, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react';

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

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function SellerQuotesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

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

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    PENDING: { label: 'Pending', color: 'text-yellow-400', icon: <Clock className="w-4 h-4" /> },
    APPROVED: { label: 'Approved', color: 'text-green-400', icon: <CheckCircle className="w-4 h-4" /> },
    REJECTED: { label: 'Rejected', color: 'text-red-400', icon: <XCircle className="w-4 h-4" /> },
  };

  const filteredQuotes = statusFilter
    ? quotes.filter((q) => q.status === statusFilter)
    : quotes;

  return (
    <>
      <Head>
        <title>Quote Requests - Seller | Carryofy</title>
        <meta name="description" content="Manage B2B quote requests" />
      </Head>
      <SellerLayout>
        <div className="p-4 lg:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#ff6600]/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#ff6600]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Quote Requests</h1>
                <p className="text-[#ffcc99] text-sm">B2B inquiries and quote requests from buyers</p>
              </div>
            </div>
            {!loading && quotes.length > 0 && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-[#ff6600]/30 bg-black px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6600]"
              >
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value || 'all'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-2 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin" />
            </div>
          ) : quotes.length === 0 ? (
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#ff6600]/20 p-12 text-center">
              <FileText className="w-12 h-12 text-[#ff6600]/50 mx-auto mb-4" />
              <p className="text-white font-medium mb-1">No quote requests yet</p>
              <p className="text-[#ffcc99] text-sm">When buyers request quotes for your B2B products, they will appear here.</p>
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#ff6600]/20 p-12 text-center">
              <p className="text-white font-medium mb-1">No quotes match the selected filter</p>
              <p className="text-[#ffcc99] text-sm">Try selecting a different status.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuotes.map((quote) => {
                const status = statusConfig[quote.status] || statusConfig.PENDING;
                return (
                  <Link
                    key={quote.id}
                    href={`/seller/quotes/${quote.id}`}
                    className="block bg-[#1a1a1a] rounded-xl border border-[#ff6600]/20 p-5 hover:border-[#ff6600]/40 transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center gap-1.5 ${status.color}`}>
                          {status.icon}
                          {status.label}
                        </span>
                        <span className="text-white font-medium">
                          {quote.buyer?.name ?? 'Buyer'} · {quote.items?.length ?? 0} item(s)
                        </span>
                        <span className="text-[#ffcc99] text-sm">{formatDateTime(quote.createdAt)}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#ffcc99]" />
                    </div>
                    {quote.message && (
                      <p className="mt-2 text-[#ffcc99] text-sm line-clamp-2">{quote.message}</p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </SellerLayout>
    </>
  );
}
