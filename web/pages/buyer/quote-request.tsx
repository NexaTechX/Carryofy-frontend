import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import apiClient from '../../lib/api/client';
import { tokenManager } from '../../lib/auth';
import { FileText, ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';

interface ProductInfo {
  id: string;
  title: string;
  price: number;
  seller: { id: string; businessName: string };
}

interface QuoteRow {
  productId: string;
  requestedQuantity: number;
  product?: { id: string; title: string; sellerId: string };
}

export default function QuoteRequestPage() {
  const router = useRouter();
  const { productId, sellerId, quantity: qtyParam } = router.query;
  const [mounted, setMounted] = useState(false);
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [items, setItems] = useState<QuoteRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!tokenManager.isAuthenticated()) {
      if (productId) {
        router.replace(`/auth/login?redirect=/buyer/quote-request?productId=${productId}&sellerId=${sellerId}&quantity=${qtyParam || 1}`);
      }
      return;
    }
    if (!productId || !sellerId) {
      setLoading(false);
      return;
    }
    const qty = typeof qtyParam === 'string' ? parseInt(qtyParam, 10) : 1;
    const initialQty = !Number.isNaN(qty) && qty >= 1 ? qty : 1;
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
        setItems([
          {
            productId: p.id,
            requestedQuantity: initialQty,
            product: { id: p.id, title: p.title, sellerId: p.seller.id },
          },
        ]);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to load product.');
      } finally {
        setLoading(false);
      }
    })();
  }, [mounted, productId, sellerId, qtyParam]);

  const addRow = () => {
    setItems((prev) => [...prev, { productId: '', requestedQuantity: 1 }]);
  };

  const removeRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, updates: Partial<QuoteRow>) => {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...updates } : row)));
  };

  const fetchProductForRow = async (index: number, productIdInput: string) => {
    if (!productIdInput.trim() || !product?.seller.id) return;
    try {
      const res = await apiClient.get(`/products/${productIdInput.trim()}`);
      const p = res.data?.data ?? res.data;
      if (!p) return;
      if (p.seller?.id !== product.seller.id) {
        setError('All products must be from the same seller.');
        return;
      }
      updateRow(index, {
        productId: p.id,
        product: { id: p.id, title: p.title, sellerId: p.seller.id },
      });
      setError(null);
    } catch {
      updateRow(index, { productId: productIdInput.trim(), product: undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sellerIdRes = product?.seller.id;
    if (!sellerIdRes) return;
    const validItems = items.filter((row) => row.productId && row.requestedQuantity >= 1);
    if (validItems.length === 0) {
      setError('Add at least one product with quantity.');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await apiClient.post('/quote-requests', {
        sellerId: sellerIdRes,
        message: message.trim() || undefined,
        items: validItems.map((row) => ({
          productId: row.productId,
          requestedQuantity: row.requestedQuantity,
        })),
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
              <p className="text-[#ffcc99] text-sm">Seller: {product.seller.businessName}</p>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[#ffcc99] text-sm font-medium">Products</label>
                  <button
                    type="button"
                    onClick={addRow}
                    className="inline-flex items-center gap-1 text-sm text-[#ff6600] hover:text-[#ff9955]"
                  >
                    <Plus className="w-4 h-4" /> Add another product
                  </button>
                </div>
                <div className="space-y-3">
                  {items.map((row, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap items-center gap-2 p-4 bg-[#1a1a1a] border border-[#ff6600]/20 rounded-xl"
                    >
                      <div className="flex-1 min-w-[120px]">
                        {index === 0 && row.product ? (
                          <p className="text-white font-medium">{row.product.title}</p>
                        ) : (
                          <input
                            type="text"
                            placeholder="Product ID"
                            value={row.productId}
                            onChange={(e) => {
                              updateRow(index, { productId: e.target.value });
                              if (e.target.value.length >= 36) fetchProductForRow(index, e.target.value);
                            }}
                            onBlur={() => row.productId && fetchProductForRow(index, row.productId)}
                            className="w-full px-3 py-2 bg-black border border-[#ff6600]/30 rounded-lg text-white text-sm"
                          />
                        )}
                        {row.product && index > 0 && (
                          <p className="text-[#ffcc99] text-xs mt-1">{row.product.title}</p>
                        )}
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={row.requestedQuantity}
                        onChange={(e) => updateRow(index, { requestedQuantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                        className="w-20 px-3 py-2 bg-black border border-[#ff6600]/30 rounded-lg text-white text-sm"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                          aria-label="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
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
