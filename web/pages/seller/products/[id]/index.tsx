import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import toast from 'react-hot-toast';
import SellerLayout from '../../../../components/seller/SellerLayout';
import { useAuth } from '../../../../lib/auth';
import { apiClient } from '../../../../lib/api/client';
import { getShareAnalytics, ProductShareAnalytics } from '../../../../lib/api/sharing';
import {
  formatNgnFromKobo,
  formatDetailDateTime,
  isYesterday,
  copyToClipboard,
} from '../../../../lib/api/utils';
import Link from 'next/link';
import {
  Edit,
  Package,
  ExternalLink,
  Copy,
  Share2,
  ZoomIn,
  Link2,
  Info,
  Calendar,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  FileText,
  Eye,
} from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  status: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
  categoryRel?: {
    id: string;
    name: string;
    commissionB2C: number;
    commissionB2B?: number | null;
  };
  material?: string;
  careInfo?: string;
  keyFeatures?: string[];
  seller?: {
    id: string;
    businessName: string;
  };
}

// Category name → commission % fallback (used when API returns null/undefined)
const CATEGORY_COMMISSION_LOOKUP: Record<string, number> = {
  electronics: 12,
  'home & kitchen': 15,
  'home and kitchen': 15,
  fashion: 10,
  general: 8,
};

function getCommissionRate(product: Product): number | null {
  const rate = product.categoryRel?.commissionB2C;
  if (rate != null && !Number.isNaN(rate)) return rate;
  const catName = (product.categoryRel?.name || '').toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_COMMISSION_LOOKUP)) {
    if (catName.includes(key)) return val;
  }
  return 15; // default
}

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const productId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : null;
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [statsRange, setStatsRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [stats, setStats] = useState({ views: 0, orders: 0, revenue: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [shareAnalytics, setShareAnalytics] = useState<ProductShareAnalytics | null>(null);
  const [shareAnalyticsLoading, setShareAnalyticsLoading] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  const [mobileQuickActionsOpen, setMobileQuickActionsOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    if (user.role !== 'SELLER') router.push('/');
  }, [router, authLoading, isAuthenticated, user]);

  useEffect(() => {
    if (id && isAuthenticated) {
      fetchProduct();
      fetchProductStats();
      fetchShareAnalytics();
    }
  }, [id, isAuthenticated]);

  const fetchProduct = async () => {
    if (!productId) return;
    try {
      const res = await apiClient.get(`/products/${productId}`);
      const data = res.data?.data || res.data;
      setProduct(data);
    } catch (e: any) {
      console.error('Error fetching product:', e);
      toast.error('Failed to load product');
      router.push('/seller/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductStats = async () => {
    if (!productId) {
      setStatsLoading(false);
      setStats({ views: 0, orders: 0, revenue: 0 });
      return;
    }
    try {
      setStatsLoading(true);
      const res = await apiClient.get(`/products/performance?productId=${productId}`);
      let data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        data = data.find((p: any) => p.productId === productId) || data[0];
      }
      if (data) {
        setStats({
          views: data.estimatedViews || 0,
          orders: data.totalSales || 0,
          revenue: data.totalRevenue || 0,
        });
      } else {
        setStats({ views: 0, orders: 0, revenue: 0 });
      }
    } catch {
      setStats({ views: 0, orders: 0, revenue: 0 });
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchShareAnalytics = async () => {
    if (!productId) return;
    try {
      setShareAnalyticsLoading(true);
      const data = await getShareAnalytics(productId);
      setShareAnalytics(data);
    } catch {
      setShareAnalytics(null);
    } finally {
      setShareAnalyticsLoading(false);
    }
  };

  const formatPrice = (kobo: number) => formatNgnFromKobo(kobo);

  const handleDelete = async () => {
    if (!product) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/products/${product.id}`);
      toast.success('Product deleted successfully');
      router.push('/seller/products');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const handleDeactivate = async () => {
    if (!product) return;
    setDeactivating(true);
    try {
      await apiClient.put(`/products/${product.id}`, { status: 'INACTIVE' });
      toast.success('Product deactivated');
      setProduct((p) => (p ? { ...p, status: 'INACTIVE' } : null));
      setDeactivateConfirm(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to deactivate product');
    } finally {
      setDeactivating(false);
    }
  };

  const handleDuplicate = async () => {
    if (!product) return;
    setDuplicating(true);
    try {
      const res = await apiClient.post('/products/clone', { productId: product.id });
      const cloned = res.data?.data || res.data;
      toast.success('Product duplicated successfully');
      router.push(`/seller/products/${cloned.id}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to duplicate product');
    } finally {
      setDuplicating(false);
    }
  };

  const handleCopyId = async () => {
    if (!product) return;
    const ok = await copyToClipboard(product.id);
    if (ok) {
      setIdCopied(true);
      toast.success('Copied!');
      setTimeout(() => setIdCopied(false), 2000);
    }
  };

  const getBaseUrl = () =>
    typeof window !== 'undefined' ? window.location.origin : 'https://carryofy.com';
  const productUrl = product ? `${getBaseUrl()}/buyer/products/${product.id}` : '';

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(productUrl);
    if (ok) toast.success('Copied!');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Check out this product on Carryofy: ${product?.title || 'Product'} ${productUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareInstagram = async () => {
    const ok = await copyToClipboard(productUrl);
    if (ok) toast.success('Link copied — paste in your Instagram bio or story');
  };

  const isActive = product?.status === 'ACTIVE';
  const commissionRate = product ? getCommissionRate(product) : null;
  const maxStock = Math.max(product?.quantity ?? 0, 10);
  const stockFill = product
    ? product.quantity === 0
      ? 0
      : Math.max(20, (product.quantity / maxStock) * 100)
    : 0;
  const stockColor =
    product?.quantity === 0
      ? '#EF4444'
      : product && product.quantity <= 5
        ? '#F59E0B'
        : '#22C55E';
  const stockLabel =
    product?.quantity === 0
      ? 'Out of stock'
      : product && product.quantity <= 5
        ? 'Low stock'
        : 'In stock';

  const perfectForItems = product?.careInfo
    ? product.careInfo
        .split(/\n/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const keyFeatures = product?.keyFeatures?.filter(Boolean) ?? [];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FF6B00]/30 border-t-[#FF6B00] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#A0A0A0]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !product) return null;

  const truncatedTitle =
    product.title.length > 40 ? `${product.title.slice(0, 40)}…` : product.title;

  return (
    <>
      <Head>
        <title>{product.title} - Seller Portal | Carryofy</title>
        <meta name="description" content={product.description || `View ${product.title} details`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500;0,600&display=swap"
          rel="stylesheet"
        />
      </Head>
      <SellerLayout>
        <div
          className="max-w-[1200px] mx-auto px-8 pt-8 pb-12"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-1.5 text-[13px]">
            <Link
              href="/seller/products"
              className="text-[#A0A0A0] hover:underline transition-colors"
            >
              Products
            </Link>
            <span className="text-[#555555]">›</span>
            <span className="text-white truncate max-w-[280px]" title={product.title}>
              {truncatedTitle}
            </span>
          </nav>

          {/* Inactive banner */}
          {!isActive && (
            <div
              className="mb-6 rounded-lg border px-4 py-3 flex items-center justify-between gap-4 flex-wrap"
              style={{
                backgroundColor: '#EF444415',
                borderColor: '#EF444430',
              }}
            >
              <span className="text-white text-sm">
                ⚠ This product is inactive and not visible to buyers.
              </span>
              <Link
                href={`/seller/products/${product.id}/edit`}
                className="text-[#FF6B00] text-sm font-medium hover:underline"
              >
                Activate product →
              </Link>
            </div>
          )}

          {/* Action buttons row */}
          <div className="flex justify-end gap-2 mb-6">
            <Link
              href={`/seller/products/${product.id}/edit`}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-[#FF6B00] text-[#FF6B00] text-sm font-medium hover:bg-[#FF6B00]/10 transition-all duration-150"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit Product
            </Link>
            <a
              href={`/buyer/products/${product.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-[#A0A0A0] text-sm font-medium hover:text-white hover:border-[#3A3A3A] transition-all duration-150"
            >
              View Public Page
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[55%_1fr] gap-6">
            {/* LEFT COLUMN */}
            <div className="space-y-5">
              {/* Image gallery */}
              <div>
                <div
                  className="relative w-full rounded-xl overflow-hidden border border-[#2A2A2A] bg-[#111111] aspect-[4/3] group cursor-pointer"
                  onClick={() => setLightboxOpen(true)}
                >
                  {product.images?.[selectedImage] ? (
                    <Image
                      src={product.images[selectedImage]}
                      alt={product.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      className="object-cover transition-opacity duration-150"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
                      <Package className="w-16 h-16 text-[#555555]" />
                    </div>
                  )}
                  {/* Status badge */}
                  <div
                    className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium ${
                      isActive ? 'bg-[#22C55E20] text-[#22C55E]' : 'bg-[#55555540] text-[#A0A0A0]'
                    }`}
                  >
                    ● {isActive ? 'Active' : 'Inactive'}
                  </div>
                  {/* Hover zoom overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Thumbnail strip */}
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const img = product.images?.[i];
                    const selected = selectedImage === i;
                    const isEmpty = !img;
                    return (
                      <button
                        key={i}
                        onClick={() => img && setSelectedImage(i)}
                        disabled={isEmpty}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all duration-150 flex items-center justify-center ${
                          isEmpty
                            ? 'border border-dashed border-[#2A2A2A] cursor-default'
                            : selected
                              ? 'border-2 border-[#FF6B00]'
                              : 'border border-[#2A2A2A] opacity-70 hover:opacity-100'
                        }`}
                      >
                        {img ? (
                          <Image
                            src={img}
                            alt={`${product.title} ${i + 1}`}
                            width={64}
                            height={64}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <span className="text-[#555555] text-lg">+</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description card */}
              <div
                className="rounded-xl border p-6 transition-shadow duration-200 hover:shadow-[0_0_0_1px_rgba(255,107,0,0.25)]"
                style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-[13px] uppercase tracking-[0.08em] text-[#A0A0A0]"
                    style={{ fontFamily: 'inherit' }}
                  >
                    Product Description
                  </span>
                  <Link
                    href={`/seller/products/${product.id}/edit`}
                    className="text-[13px] text-[#FF6B00] hover:underline flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </Link>
                </div>
                <div className="text-[14px] leading-[1.7] text-[#CCCCCC]" style={{ fontFamily: 'inherit' }}>
                  {product.description ? (
                    <>
                      <div
                        className={!descriptionExpanded ? 'line-clamp-4' : ''}
                        style={{ fontFamily: 'inherit' }}
                      >
                        {product.description}
                      </div>
                      {product.description.split(/\n/).length > 2 && (
                        <button
                          onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                          className="text-[#FF6B00] mt-2 text-sm font-medium"
                        >
                          {descriptionExpanded ? 'Read less ▴' : 'Read more ▾'}
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="italic text-[#555555]">No description provided</span>
                  )}
                </div>

                {perfectForItems.length > 0 && (
                  <div className="mt-5">
                    <p className="text-[13px] font-bold text-white mb-2">Perfect for:</p>
                    <ul className="space-y-1">
                      {perfectForItems.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-[13px] text-[#CCCCCC] leading-[1.8]"
                          style={{ paddingLeft: 16 }}
                        >
                          <span className="text-[#FF6B00] text-[6px] mt-1.5">●</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {keyFeatures.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {keyFeatures.map((f, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 text-[12px] rounded-full"
                        style={{
                          backgroundColor: '#FF6B0010',
                          border: '1px solid rgba(255,107,0,0.2)',
                          color: '#FF6B00',
                        }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Product details grid */}
              <div
                className="rounded-xl border p-5 transition-shadow duration-200 hover:shadow-[0_0_0_1px_rgba(255,107,0,0.25)]"
                style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[14px] font-bold text-white">Product Details</h3>
                  <button
                    onClick={handleCopyId}
                    title={idCopied ? 'Copied!' : 'Copy ID'}
                    className="text-[11px] text-[#555555] font-mono"
                  >
                    ID: {product.id.slice(0, 8)}...
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="rounded-lg border p-3.5"
                    style={{ backgroundColor: '#111111', borderColor: '#1A1A1A' }}
                  >
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-[#555555] mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      CREATED
                    </div>
                    <p className="text-[14px] text-white font-mono">{formatDetailDateTime(product.createdAt)}</p>
                  </div>
                  <div
                    className="rounded-lg border p-3.5"
                    style={{ backgroundColor: '#111111', borderColor: '#1A1A1A' }}
                  >
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-[#555555] mb-1">
                      <RefreshCw className="w-3.5 h-3.5" />
                      LAST UPDATED
                    </div>
                    <p className="text-[14px] text-white font-mono">{formatDetailDateTime(product.updatedAt)}</p>
                    {isYesterday(product.updatedAt) && (
                      <p className="text-[13px] text-[#A0A0A0] mt-0.5">(yesterday)</p>
                    )}
                  </div>
                  <div
                    className="rounded-lg border p-3.5"
                    style={{ backgroundColor: '#111111', borderColor: '#1A1A1A' }}
                  >
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-[#555555] mb-1">
                      <span>₦</span>
                      PRICE
                    </div>
                    <p className="text-[18px] font-bold text-[#FF6B00] font-mono">{formatPrice(product.price)}</p>
                  </div>
                  <div
                    className="rounded-lg border p-3.5"
                    style={{ backgroundColor: '#111111', borderColor: '#1A1A1A' }}
                  >
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-[#555555] mb-1">
                      <Package className="w-3.5 h-3.5" />
                      IN STOCK
                    </div>
                    <p className="text-[18px] font-bold text-white font-mono">{product.quantity} units</p>
                    <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#111111' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: product.quantity === 0 ? '100%' : `${stockFill}%`,
                          backgroundColor: stockColor,
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-[#A0A0A0] mt-1">{stockLabel}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-4">
              {/* Performance stats */}
              <div
                className="rounded-xl border p-5 transition-shadow duration-200 hover:shadow-[0_0_0_1px_rgba(255,107,0,0.25)]"
                style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[14px] font-bold text-white">Performance</h3>
                  <div className="flex gap-1 text-[12px]">
                    {(['7d', '30d', 'all'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setStatsRange(r)}
                        className={`px-2 py-1 rounded ${
                          statsRange === r ? 'text-[#FF6B00] font-medium' : 'text-[#A0A0A0]'
                        }`}
                      >
                        {r === 'all' ? 'All' : r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#FF6B0020' }}
                      >
                        <Package className="w-4 h-4 text-[#FF6B00]" />
                      </div>
                      <span className="text-[13px] text-[#A0A0A0]">Total Orders</span>
                    </div>
                    {statsLoading ? (
                      <div className="w-12 h-4 rounded bg-[#111111] animate-pulse" />
                    ) : (
                      <span className="text-[16px] font-bold text-white font-mono">
                        {(stats.orders ?? 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#FF6B0020' }}
                      >
                        <span className="text-[#FF6B00] text-sm">₦</span>
                      </div>
                      <span className="text-[13px] text-[#A0A0A0]">Total Revenue</span>
                    </div>
                    {statsLoading ? (
                      <div className="w-16 h-4 rounded bg-[#111111] animate-pulse" />
                    ) : (
                      <span className="text-[16px] font-bold text-white font-mono">
                        {formatPrice(stats.revenue ?? 0)}
                      </span>
                    )}
                  </div>
                </div>
                {stats.orders === 0 && stats.revenue === 0 && (
                  <>
                    <div className="my-3 border-t" style={{ borderColor: '#2A2A2A' }} />
                    <div
                      className="rounded-lg border p-3 mb-3"
                      style={{
                        backgroundColor: '#FF6B0008',
                        borderColor: '#FF6B0020',
                      }}
                    >
                      <p className="text-[13px] text-[#CCCCCC] mb-3">
                        💡 Share your product link to start getting orders
                      </p>
                      <button
                        onClick={handleCopyLink}
                        className="h-8 px-3 rounded-lg border border-[#FF6B00] text-[#FF6B00] text-sm font-medium hover:bg-[#FF6B00]/10 transition-colors"
                      >
                        Share Product
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Platform Commission */}
              <div
                className="rounded-xl border p-5 transition-shadow duration-200 hover:shadow-[0_0_0_1px_rgba(255,107,0,0.25)]"
                style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-bold text-white">Platform Commission</h3>
                    <span title="Commission rates are deducted from your sale price when an order is delivered. Rates vary by product category.">
                      <Info className="w-3.5 h-3.5 text-[#555555] cursor-help" />
                    </span>
                  </div>
                </div>
                {commissionRate != null ? (
                  <>
                    <p className="text-[24px] font-bold text-[#FF6B00] font-mono">{commissionRate}%</p>
                    <p className="text-[12px] text-[#A0A0A0] mt-1">
                      Category: {product.categoryRel?.name || 'General'} · B2C rate
                    </p>
                    <div
                      className="mt-4 rounded-lg border p-3"
                      style={{ backgroundColor: '#111111', borderColor: '#1A1A1A' }}
                    >
                      <p className="text-[12px] text-[#A0A0A0] mb-2">
                        Per sale at {formatPrice(product.price)}:
                      </p>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#CCCCCC]">Your earnings</span>
                          <span className="font-bold text-[#22C55E] font-mono">
                            {formatPrice(product.price - Math.round((product.price * commissionRate) / 100))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#CCCCCC]">Platform fee</span>
                          <span className="text-[#FF6B00] font-mono">
                            {formatPrice(Math.round((product.price * commissionRate) / 100))}
                          </span>
                        </div>
                        <div className="border-t pt-2 mt-2" style={{ borderColor: '#2A2A2A' }}>
                          <div className="flex justify-between">
                            <span className="text-[#CCCCCC]">Gross price</span>
                            <span className="text-white font-mono">{formatPrice(product.price)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-[13px] text-[#A0A0A0]">Loading...</p>
                )}
              </div>

              {/* Share & Promote */}
              <div
                className="rounded-xl border p-5 transition-shadow duration-200 hover:shadow-[0_0_0_1px_rgba(255,107,0,0.25)]"
                style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}
              >
                <h3 className="text-[14px] font-bold text-white mb-4">Share & Promote</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="h-9 px-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-[#A0A0A0] hover:text-white hover:border-[#3A3A3A] transition-all flex items-center gap-2"
                    title="Copy Link"
                  >
                    <Link2 className="w-4 h-4" />
                    Copy Link
                  </button>
                  <button
                    onClick={handleShareWhatsApp}
                    className="h-9 px-3 rounded-lg flex items-center gap-2 transition-all"
                    style={{
                      backgroundColor: '#25D36620',
                      border: '1px solid rgba(37,211,102,0.25)',
                      color: '#25D366',
                    }}
                    title="Share via WhatsApp"
                  >
                    <Share2 className="w-4 h-4" />
                    WhatsApp
                  </button>
                  <button
                    onClick={handleShareInstagram}
                    className="h-9 px-3 rounded-lg flex items-center gap-2 transition-all"
                    style={{
                      backgroundColor: '#E1306C20',
                      border: '1px solid rgba(225,48,108,0.25)',
                      color: '#E1306C',
                    }}
                    title="Share via Instagram"
                  >
                    <Share2 className="w-4 h-4" />
                    Instagram
                  </button>
                </div>
                {shareAnalyticsLoading ? (
                  <div className="h-4 w-32 rounded bg-[#111111] animate-pulse mt-3" />
                ) : shareAnalytics && shareAnalytics.totalShares > 0 ? (
                  <p className="text-[13px] text-[#A0A0A0] mt-3">
                    {shareAnalytics.uniqueSharers} people clicked your shared link this month
                  </p>
                ) : (
                  <div className="mt-4 flex items-center gap-2 text-[#555555]">
                    <Share2 className="w-6 h-6" />
                    <p className="text-[13px]">Share your product to track clicks</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div
                className="rounded-xl border p-4 transition-shadow duration-200 hover:shadow-[0_0_0_1px_rgba(255,107,0,0.25)] hidden md:block"
                style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}
              >
                <h3 className="text-[13px] font-bold text-[#A0A0A0] uppercase mb-3">Quick Actions</h3>
                <div className="space-y-0">
                  <Link
                    href={`/seller/products/${product.id}/edit`}
                    className="flex items-center justify-between h-10 px-2 rounded-lg hover:bg-[#111111] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Edit className="w-4 h-4 text-[#FF6B00]" />
                      <span className="text-[14px] text-white">Edit product details</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#555555] group-hover:text-[#A0A0A0]" />
                  </Link>
                  <a
                    href={`/buyer/products/${product.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between h-10 px-2 rounded-lg hover:bg-[#111111] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Eye className="w-4 h-4 text-[#FF6B00]" />
                      <span className="text-[14px] text-white">Preview public listing</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#555555] group-hover:text-[#A0A0A0]" />
                  </a>
                  <button
                    onClick={handleDuplicate}
                    disabled={duplicating}
                    className="flex items-center justify-between w-full h-10 px-2 rounded-lg hover:bg-[#111111] transition-colors group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <Copy className="w-4 h-4 text-[#FF6B00]" />
                      <span className="text-[14px] text-white">Duplicate this product</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#555555] group-hover:text-[#A0A0A0]" />
                  </button>
                  <Link
                    href={`/seller/analytics?product=${product.id}`}
                    className="flex items-center justify-between h-10 px-2 rounded-lg hover:bg-[#111111] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-[#FF6B00]" />
                      <span className="text-[14px] text-white">View full analytics</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#555555] group-hover:text-[#A0A0A0]" />
                  </Link>
                  <button
                    onClick={() => setDeactivateConfirm(true)}
                    className="flex items-center justify-between w-full h-10 px-2 rounded-lg hover:bg-[#111111] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                      <span className="text-[14px] text-[#EF4444]">Deactivate listing</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#555555] group-hover:text-[#A0A0A0]" />
                  </button>
                </div>
              </div>

              {/* Mobile: Quick Actions as floating button */}
              <div className="md:hidden fixed bottom-6 right-6 z-40">
                <button
                  onClick={() => setMobileQuickActionsOpen(!mobileQuickActionsOpen)}
                  className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-white flex items-center justify-center shadow-lg"
                >
                  <span className="text-xl">⋯</span>
                </button>
                {mobileQuickActionsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMobileQuickActionsOpen(false)}
                    />
                    <div
                      className="absolute bottom-14 right-0 w-64 rounded-xl border p-2 z-50"
                      style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}
                    >
                      <Link
                        href={`/seller/products/${product.id}/edit`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#111111]"
                        onClick={() => setMobileQuickActionsOpen(false)}
                      >
                        <Edit className="w-4 h-4 text-[#FF6B00]" />
                        <span className="text-sm text-white">Edit product</span>
                      </Link>
                      <a
                        href={`/buyer/products/${product.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#111111]"
                        onClick={() => setMobileQuickActionsOpen(false)}
                      >
                        <Eye className="w-4 h-4 text-[#FF6B00]" />
                        <span className="text-sm text-white">Preview listing</span>
                      </a>
                      <button
                        onClick={() => {
                          handleDuplicate();
                          setMobileQuickActionsOpen(false);
                        }}
                        disabled={duplicating}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-[#111111] text-left disabled:opacity-50"
                      >
                        <Copy className="w-4 h-4 text-[#FF6B00]" />
                        <span className="text-sm text-white">Duplicate</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lightbox */}
        {lightboxOpen && product.images?.[selectedImage] && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <Image
              src={product.images[selectedImage]}
              alt={product.title}
              fill
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Delete modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] border border-[#2A2A2A] rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Delete Product</h3>
                  <p className="text-[#A0A0A0] text-sm">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-[#CCCCCC] text-sm mb-6">
                Are you sure you want to delete &quot;{product.title}&quot;? All data will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-[#111111] border border-[#2A2A2A] text-white rounded-lg font-medium hover:bg-[#1A1A1A] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deactivate modal */}
        {deactivateConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] border border-[#2A2A2A] rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#EF444420] flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Deactivate Product</h3>
                  <p className="text-[#A0A0A0] text-sm">It will no longer be visible to buyers</p>
                </div>
              </div>
              <p className="text-[#CCCCCC] text-sm mb-6">
                Are you sure you want to deactivate this product? It will no longer be visible to buyers.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeactivateConfirm(false)}
                  disabled={deactivating}
                  className="flex-1 px-4 py-2.5 bg-[#111111] border border-[#2A2A2A] text-white rounded-lg font-medium hover:bg-[#1A1A1A] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeactivate}
                  disabled={deactivating}
                  className="flex-1 px-4 py-2.5 bg-[#EF4444] text-white rounded-lg font-medium hover:bg-[#DC2626] disabled:opacity-50"
                >
                  {deactivating ? 'Deactivating...' : 'Deactivate'}
                </button>
              </div>
            </div>
          </div>
        )}
      </SellerLayout>
    </>
  );
}
