import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import apiClient from '../../lib/api/client';
import { tokenManager } from '../../lib/auth';
import { FileText, ArrowLeft, Loader2 } from 'lucide-react';

interface ProductInfo {
  id: string;
  title: string;
  price: number;
  seller: { id: string; businessName: string };
}

export default function QuoteRequestPage() {
  const router = useRouter();
  const { productId, sellerId, quantity: qtyParam } = router.query;
  const [mounted, setMounted] = useState(false);
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [requestedQuantity, setRequestedQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !productId || !sellerId) return;
    const qty = typeof qtyParam === 'string' ? parseInt(qtyParam, 10) : 1;
    if (!Number.isNaN(qty) && qty >= 1) setRequestedQuantity(qty);
  }, [mounted, productId, sellerId, qtyParam]);

  useEffect(() => {
    if (!mounted || !tokenManager.isAuthenticated()) {
      if (mounted && productId && !tokenManager.isAuthenticated()) {
        router.replace(`/auth/login?redirect=/buyer/quote-request?productId=${productId}&sellerId=${sellerId}&quantity=${requestedQuantity}`);
      }
      return;
    }
    if (!productId || !sellerId) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get(`/products/${productId}`);
        const p = res.data?.data ?? res.data;
        if (!p || p.seller?.id !== sellerId) {
          setError('Product not found or seller mismatch.');
          return;
        }
        setProduct({
          id: p.id,
          title: p.title,
          price: p.price,
          seller: p.seller,
        });
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to load product.');
      } finally {
        setLoading(false);
      }
    })();
  }, [mounted, productId, sellerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !sellerId || !product) return;
    try {
      setSubmitting(true);
      setError(null);
      await apiClient.post('/quote-requests', {
        sellerId,
        message: message.trim() || undefined,
        items: [
          {
            productId,
            requestedQuantity,
          },
        ],
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to submit quote request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>Request a Quote - Buyer | Carryofy</title>
        <meta name="description" content="Request a quote for bulk or B2B pricing" />
      </Head>
      <BuyerLayout>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link
            href={productId ? `/buyer/products/${productId}` : '/buyer/products'}
            className="inline-flex items-center gap-2 text-[#ffcc99] hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to product
          </Link>
          <h1 className="text-white text-2xl font-bold mb-6 flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#ff6600]" /> Request a Quote
          </h1>

          {success ? (
            <div className="p-6 bg-green-500/10 border border-green-500/50 rounded-xl text-green-400">
              <p className="font-medium">Quote request sent.</p>
              <p className="text-sm mt-2 text-[#ffcc99]">The seller will respond with a quote. Check &quot;My quote requests&quot; for updates.</p>
              <Link href="/buyer/quotes" className="inline-block mt-4 text-[#ff6600] hover:underline">View my quote requests</Link>
            </div>
          ) : loading ? (
            <div className="flex items-center gap-2 text-[#ffcc99]">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading...
            </div>
          ) : error && !product ? (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400">{error}</div>
          ) : product ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="p-4 bg-[#1a1a1a] border border-[#ff6600]/20 rounded-xl">
                <p className="text-white font-medium">{product.title}</p>
                <p className="text-[#ffcc99] text-sm">Seller: {product.seller.businessName}</p>
                <p className="text-[#ff6600] text-sm mt-1">Quantity: {requestedQuantity}</p>
              </div>
              <div>
                <label className="block text-[#ffcc99] text-sm font-medium mb-2">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={requestedQuantity}
                  onChange={(e) => setRequestedQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-[#ffcc99] text-sm font-medium mb-2">Message (optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. delivery timeline, payment terms..."
                  rows={3}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white placeholder-[#ffcc99]/50"
                />
              </div>
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">{error}</div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#ff6600] text-black font-bold rounded-xl hover:bg-[#cc5200] disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                {submitting ? 'Sending...' : 'Submit quote request'}
              </button>
            </form>
          ) : null}
        </div>
      </BuyerLayout>
    </>
  );
}
