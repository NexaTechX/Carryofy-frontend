import Head from 'next/head';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import apiClient from '../../lib/api/client';
import { tokenManager } from '../../lib/auth';
import { FileText, Loader2, ChevronRight, Package } from 'lucide-react';

interface QuoteItem {
  id: string;
  productId: string;
  requestedQuantity: number;
  sellerQuotedPriceKobo?: number;
  sellerNotes?: string;
  product?: { id: string; title: string; images: string[] };
}

interface QuoteRequest {
  id: string;
  sellerId: string;
  status: string;
  message?: string;
  sellerResponse?: string;
  createdAt: string;
  items: QuoteItem[];
  seller?: { id: string; businessName: string };
}

export default function MyQuotesPage() {
  const [mounted, setMounted] = useState(false);
  const [list, setList] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get('/quote-requests');
        const data = res.data?.data ?? res.data;
        setList(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to load quote requests.');
      } finally {
        setLoading(false);
      }
    })();
  }, [mounted]);

  const formatPrice = (kobo: number) =>
    `₦${(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>My Quote Requests - Buyer | Carryofy</title>
        <meta name="description" content="View and manage your B2B quote requests" />
      </Head>
      <BuyerLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-white text-2xl font-bold mb-6 flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#ff6600]" /> My quote requests
          </h1>

          {loading ? (
            <div className="flex items-center gap-2 text-[#ffcc99]">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400">{error}</div>
          ) : list.length === 0 ? (
            <div className="p-8 bg-[#1a1a1a] border border-[#ff6600]/20 rounded-xl text-center text-[#ffcc99]">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-60" />
              <p>You haven&apos;t sent any quote requests yet.</p>
              <Link href="/buyer/products" className="inline-block mt-4 text-[#ff6600] hover:underline">Browse B2B products</Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {list.map((q) => (
                <li
                  key={q.id}
                  className="p-4 sm:p-6 bg-[#1a1a1a] border border-[#ff6600]/20 rounded-xl"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="text-white font-medium">
                      {q.seller?.businessName ?? 'Seller'}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        q.status === 'APPROVED'
                          ? 'bg-green-500/20 text-green-400'
                          : q.status === 'REJECTED'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>
                  <p className="text-[#ffcc99] text-sm mb-3">
                    {new Date(q.createdAt).toLocaleDateString('en-NG', {
                      dateStyle: 'medium',
                    })}
                  </p>
                  <ul className="space-y-2 mb-4">
                    {q.items.map((item) => (
                      <li key={item.id} className="flex flex-wrap items-center gap-2 text-sm text-white">
                        <span>{item.product?.title ?? `Product ${item.productId}`}</span>
                        <span className="text-[#ffcc99]">× {item.requestedQuantity}</span>
                        {item.sellerQuotedPriceKobo != null && (
                          <span className="text-[#ff6600]">{formatPrice(item.sellerQuotedPriceKobo)}/unit</span>
                        )}
                        {item.sellerNotes && (
                          <span className="text-[#ffcc99]/80 text-xs">— {item.sellerNotes}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {q.status === 'APPROVED' && (
                    <Link
                      href={`/buyer/checkout?quoteId=${q.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff6600] text-black font-bold rounded-lg hover:bg-[#cc5200] transition"
                    >
                      Proceed to checkout <ChevronRight className="w-4 h-4" />
                    </Link>
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
