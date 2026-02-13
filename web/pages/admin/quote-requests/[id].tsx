import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '../../../components/admin/AdminLayout';
import { AdminPageHeader, AdminCard, LoadingState } from '../../../components/admin/ui';
import { fetchQuoteRequestById, AdminQuoteRequest } from '../../../lib/admin/api';
import { ArrowLeft, FileText } from 'lucide-react';

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatPrice = (kobo: number) => `₦${(kobo / 100).toFixed(2)}`;

export default function AdminQuoteRequestDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [quote, setQuote] = useState<AdminQuoteRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && typeof id === 'string') {
      setLoading(true);
      setError(null);
      fetchQuoteRequestById(id)
        .then(setQuote)
        .catch(() => setError('Failed to load quote request'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading || !quote) {
    return (
      <AdminLayout>
        <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          {loading ? (
            <LoadingState label="Loading quote request..." />
          ) : (
            <div className="rounded-2xl border border-[#1f2534] bg-[#0e131d] p-8 text-center text-gray-400">
              {error || 'Quote request not found.'}
              <Link href="/admin/quote-requests" className="mt-4 inline-block text-primary hover:underline">
                Back to list
              </Link>
            </div>
          )}
        </div>
      </AdminLayout>
    );
  }

  const statusTone = quote.status === 'APPROVED' ? 'success' : quote.status === 'REJECTED' ? 'danger' : 'warning';

  return (
    <>
      <Head>
        <title>Quote Request {quote.id.slice(0, 8)} - Admin | Carryofy</title>
      </Head>
      <AdminLayout>
        <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title={`Quote ${quote.id.slice(0, 8)}…`}
            tag="B2B"
            subtitle={`${quote.buyer?.name ?? 'Buyer'} · ${quote.seller?.businessName ?? 'Seller'} · ${quote.status}`}
            actions={
              <Link
                href="/admin/quote-requests"
                className="inline-flex items-center gap-2 rounded-lg border border-[#1f2534] px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#1f2534]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to list
              </Link>
            }
          />

          <div className="mt-6 space-y-6">
            <AdminCard title="Overview" className="bg-[#0e131d]">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Buyer</dt>
                  <dd className="mt-1 text-white">
                    {quote.buyer?.name ?? '—'} {quote.buyer?.email && `(${quote.buyer.email})`}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Seller</dt>
                  <dd className="mt-1 text-white">{quote.seller?.businessName ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase ${
                        statusTone === 'success'
                          ? 'border-[#1f3a27] bg-[#132019] text-[#6ef2a1]'
                          : statusTone === 'danger'
                            ? 'border-[#3a1f1f] bg-[#211010] text-[#ff8484]'
                            : 'border-[#3a2a1f] bg-[#21170f] text-[#ffb169]'
                      }`}
                    >
                      {quote.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Created</dt>
                  <dd className="mt-1 text-gray-300">{formatDate(quote.createdAt)}</dd>
                </div>
                {quote.validUntil && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Valid until</dt>
                    <dd className="mt-1 text-gray-300">{formatDate(quote.validUntil)}</dd>
                  </div>
                )}
              </dl>
              {quote.message && (
                <div className="mt-4 border-t border-[#1f2534] pt-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Buyer message</dt>
                  <dd className="mt-1 text-gray-300">{quote.message}</dd>
                </div>
              )}
              {quote.sellerResponse && (
                <div className="mt-4 border-t border-[#1f2534] pt-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Seller response</dt>
                  <dd className="mt-1 text-gray-300">{quote.sellerResponse}</dd>
                </div>
              )}
            </AdminCard>

            <AdminCard title="Items" className="bg-[#0e131d]">
              <div className="space-y-3">
                {quote.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#1f2534] p-4"
                  >
                    <div>
                      <p className="font-medium text-white">{item.product?.title ?? `Product ${item.productId}`}</p>
                      <p className="text-sm text-gray-400">Qty: {item.requestedQuantity}</p>
                    </div>
                    {'sellerQuotedPriceKobo' in item && item.sellerQuotedPriceKobo != null && (
                      <p className="text-primary font-semibold">{formatPrice(item.sellerQuotedPriceKobo)}</p>
                    )}
                  </div>
                ))}
              </div>
            </AdminCard>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
