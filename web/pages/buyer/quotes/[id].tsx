import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import BuyerLayout from '../../../components/buyer/BuyerLayout';
import apiClient from '../../../lib/api/client';
import { formatDate, formatNgnFromKobo } from '../../../lib/api/utils';
import { tokenManager } from '../../../lib/auth';
import { FileText, ArrowLeft, Loader2, Package } from 'lucide-react';

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

export default function QuoteDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [mounted, setMounted] = useState(false);
  const [quote, setQuote] = useState<QuoteRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !tokenManager.isAuthenticated()) {
      if (mounted && !tokenManager.isAuthenticated()) {
        window.location.href = `/auth/login?redirect=/buyer/quotes/${id}`;
      }
      return;
    }
    if (!id || typeof id !== 'string') return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get(`/quote-requests/${id}`);
        const data = res.data?.data ?? res.data;
        setQuote(data);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        setError(e.response?.data?.message || e.message || 'Failed to load quote.');
        setQuote(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [mounted, id]);

  const formatPrice = (kobo: number) => formatNgnFromKobo(kobo, { maximumFractionDigits: 2 });

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>Quote Details - Buyer | Carryofy</title>
      </Head>
      <BuyerLayout>
        <div className="max-w-2xl mx-auto">
          <Link
            href="/buyer/quotes"
            className="inline-flex items-center gap-2 text-[#ffcc99] hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Quotes
          </Link>

          {loading ? (
            <div className="flex items-center gap-2 text-[#ffcc99] py-12">
              <Loader2 className="w-6 h-6 animate-spin" />
              Loading...
            </div>
          ) : error ? (
            <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/50 text-red-400">{error}</div>
          ) : quote ? (
            <div className="rounded-xl border border-[#ff6600]/20 bg-[#1a1a1a] overflow-hidden">
              <div className="p-6 border-b border-[#ff6600]/20">
                <h1 className="text-white text-xl font-bold flex items-center gap-2">
                  <FileText className="w-6 h-6 text-[#ff6600]" />
                  Quote #{quote.id.slice(0, 8)}
                </h1>
                <p className="text-[#ffcc99]/70 text-sm mt-1">
                  Submitted {formatDate(quote.createdAt)}
                  {quote.validUntil && ` · Expires ${formatDate(quote.validUntil)}`}
                </p>
                <span className="inline-block mt-3 px-3 py-1 rounded-lg text-sm font-medium bg-[#ff6600]/20 text-[#ff6600]">
                  {quote.seller?.businessName ?? 'Seller'}
                </span>
              </div>
              <div className="p-6 space-y-4">
                {quote.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 rounded-lg bg-[#252525]/50 border border-[#ff6600]/10"
                  >
                    <div className="w-16 h-16 rounded-lg bg-[#1a1a1a] overflow-hidden flex items-center justify-center shrink-0">
                      {item.product?.images?.[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.title}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-[#ffcc99]/30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium">{item.product?.title ?? `Product ${item.productId}`}</h3>
                      <p className="text-[#ffcc99]/70 text-sm mt-1">
                        Qty: {item.requestedQuantity}
                        {item.requestedPriceKobo != null && ` · Requested: ${formatPrice(item.requestedPriceKobo)}/unit`}
                        {item.sellerQuotedPriceKobo != null && (
                          <span className="text-[#ff6600] ml-1">· Offered: {formatPrice(item.sellerQuotedPriceKobo)}/unit</span>
                        )}
                      </p>
                      {item.sellerNotes && (
                        <p className="text-[#ffcc99]/60 text-xs mt-2">{item.sellerNotes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {quote.status === 'APPROVED' && (
                <div className="p-6 border-t border-[#ff6600]/20">
                  <Link
                    href={`/buyer/checkout?quoteId=${quote.id}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff6600] text-black font-bold rounded-xl hover:bg-[#e55d00] transition-colors"
                  >
                    Proceed to Checkout
                  </Link>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </BuyerLayout>
    </>
  );
}
