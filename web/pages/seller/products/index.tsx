import Head from 'next/head';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import SellerLayout from '../../../components/seller/SellerLayout';
import { Search, Trash2, Plus, Package, Edit, Eye, Clock, CheckCircle, XCircle, AlertCircle, CheckSquare, Square, Copy, ShieldAlert, ShieldX, X } from 'lucide-react';
import { useAuth, tokenManager } from '../../../lib/auth';
import { getApiBaseUrl } from '../../../lib/api/utils';
import { apiClient } from '../../../lib/api/client';
import Link from 'next/link';
import { useConfirmation } from '../../../lib/hooks/useConfirmation';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';

interface Product {
  id: string;
  title: string;
  price: number;
  quantity: number;
  status: string;
  images: string[];
  createdAt: string;
  categoryRel?: {
    id: string;
    name: string;
    commissionB2C: number;
    commissionB2B?: number | null;
  };
}

type StatusFilter = 'all' | 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';
type SortBy = 'newest' | 'price' | 'stock';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'PENDING_APPROVAL', label: 'Pending Review' },
  { value: 'REJECTED', label: 'Rejected' },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price', label: 'Price' },
  { value: 'stock', label: 'Stock' },
];

export default function ProductsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [sellerNotFound, setSellerNotFound] = useState(false);
  const confirmation = useConfirmation();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    // Only sellers can access this page - admins should use admin dashboard
    if (user.role !== 'SELLER') {
      router.push('/');
      return;
    }
    fetchKycStatus();
  }, [router, authLoading, isAuthenticated, user]);

  const fetchKycStatus = async () => {
    try {
      setKycLoading(true);
      // Reset sellerNotFound when checking KYC status
      setSellerNotFound(false);
      const token = tokenManager.getAccessToken();
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/sellers/kyc`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const responseData = data.data || data;
        const status = responseData.status || 'NOT_SUBMITTED';
        setKycStatus(status);
        
        // Only fetch products if KYC is approved
        if (status === 'APPROVED') {
          fetchProducts();
        } else {
          setLoading(false);
        }
      } else if (response.status === 404) {
        // KYC not submitted yet - seller may or may not exist
        setKycStatus('NOT_SUBMITTED');
        setLoading(false);
      } else {
        // Other error - assume KYC not submitted
        setKycStatus('NOT_SUBMITTED');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching KYC status:', err);
      // Assume KYC not submitted
      setKycStatus('NOT_SUBMITTED');
      setLoading(false);
    } finally {
      setKycLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setSellerNotFound(false);
      setLoading(true);
      const sellerResponse = await apiClient.get('/sellers/me');
      const sellerData = sellerResponse.data?.data || sellerResponse.data;
      const sellerId = sellerData?.id;

      if (!sellerId) {
        console.error('Could not get seller ID');
        setSellerNotFound(true);
        setProducts([]);
        return;
      }

      const productsResponse = await apiClient.get(`/products?sellerId=${sellerId}`);
      const productsData = productsResponse.data?.data || productsResponse.data;
      setProducts(productsData?.products || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      if (error?.response?.status === 403) {
        toast.error('Access denied. Please ensure you are logged in as a seller.');
      } else if (error?.response?.status === 404) {
        // Seller profile doesn't exist - needs onboarding
        setSellerNotFound(true);
        setProducts([]);
      } else {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Failed to load products. Please try again.';
        toast.error(message);
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceInKobo: number) => {
    const naira = priceInKobo / 100;
    return `₦${naira.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of stock', bg: '#EF444420', color: '#EF4444' };
    if (quantity <= 5) return { label: `Low: ${quantity}`, bg: '#F59E0B20', color: '#F59E0B' };
    return { label: `${quantity} in stock`, bg: '#22C55E20', color: '#22C55E' };
  };

  const getStatusPill = (status: string) => {
    const isActive = status === 'ACTIVE';
    const isPendingApproval = status === 'PENDING_APPROVAL';
    const labels: Record<string, string> = {
      ACTIVE: 'Active',
      INACTIVE: 'Inactive',
      PENDING_APPROVAL: 'Pending Review',
      REJECTED: 'Rejected',
    };
    return {
      label: labels[status] ?? status,
      isActive,
      isPendingApproval,
    };
  };

  const handleDeleteClick = (productId: string) => {
    setDeleteConfirm(productId);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    setDeleting(true);
    try {
      await apiClient.delete(`/products/${deleteConfirm}`);
      toast.success('Product deleted successfully');
      setProducts(products.filter(p => p.id !== deleteConfirm));
      setDeleteConfirm(null);
    } catch (error: any) {
      console.error('Error deleting product:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to delete product';
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async (productId: string) => {
    setDuplicating(productId);
    try {
      const response = await apiClient.post('/products/clone', {
        productId,
      });
      const clonedProduct = response.data?.data || response.data;
      toast.success('Product duplicated successfully');
      // Navigate to the cloned product's edit page
      window.location.href = `/seller/products/${clonedProduct.id}`;
    } catch (error: any) {
      console.error('Error duplicating product:', error);
      toast.error(error?.response?.data?.message || 'Failed to duplicate product');
    } finally {
      setDuplicating(null);
    }
  };

  const filteredProducts = useMemo(() => {
    let list = products.filter((p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (statusFilter !== 'all') {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (sortBy === 'newest') {
      list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'price') {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'stock') {
      list = [...list].sort((a, b) => b.quantity - a.quantity);
    }
    return list;
  }, [products, searchQuery, statusFilter, sortBy]);

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;

    const confirmed = await confirmation.confirm({
      title: 'Delete Products',
      message: `Are you sure you want to delete ${selectedProducts.size} product(s)? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) return;

    setBulkProcessing(true);
    confirmation.setLoading(true);
    try {
      const response = await apiClient.post('/products/bulk/delete', {
        productIds: Array.from(selectedProducts),
      });
      toast.success(response.data?.message || `Successfully deleted ${response.data?.deleted || 0} product(s)`);
      setSelectedProducts(new Set());
      fetchProducts();
    } catch (error: any) {
      console.error('Error bulk deleting products:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete products');
    } finally {
      setBulkProcessing(false);
      confirmation.setLoading(false);
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    if (selectedProducts.size === 0) return;

    setBulkStatusOpen(false);
    setBulkProcessing(true);
    try {
      const response = await apiClient.post('/products/bulk/status', {
        productIds: Array.from(selectedProducts),
        status,
      });
      toast.success(response.data?.message || `Successfully updated ${response.data?.updated || 0} product(s)`);
      setSelectedProducts(new Set());
      fetchProducts();
    } catch (error: any) {
      console.error('Error bulk updating status:', error);
      toast.error(error?.response?.data?.message || 'Failed to update product status');
    } finally {
      setBulkProcessing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#ffcc99]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Products - Seller Portal | Carryofy</title>
        <meta name="description" content="Manage your products on Carryofy." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500&display=swap" rel="stylesheet" />
      </Head>
      <SellerLayout>
        <div className="min-h-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Products</h1>
              <p className="text-[#ffcc99] text-sm mt-1">
                Manage your product listings ({products.length} products)
              </p>
            </div>
            {kycStatus === 'APPROVED' ? (
              <Link
                href="/seller/products/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#ff6600] to-[#cc5200] text-white font-medium rounded-xl hover:from-[#cc5200] hover:to-[#ff6600] transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Product
              </Link>
            ) : (
              <button
                disabled
                title="Complete KYC verification to add products"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#333]/60 text-[#ffcc99]/40 font-medium rounded-xl cursor-not-allowed border border-[#ff6600]/10"
              >
                <Plus className="w-5 h-5" />
                Add Product
              </button>
            )}
          </div>

          {/* KYC Gate Banner - Show when KYC is not approved */}
          {!kycLoading && kycStatus !== 'APPROVED' && (
            <div className={`mb-6 rounded-2xl border p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${kycStatus === 'PENDING'
                ? 'bg-yellow-900/20 border-yellow-500/30'
                : kycStatus === 'REJECTED'
                  ? 'bg-red-900/20 border-red-500/30'
                  : 'bg-blue-900/20 border-blue-500/30'
              }`}>
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${kycStatus === 'PENDING'
                  ? 'bg-yellow-500/20'
                  : kycStatus === 'REJECTED'
                    ? 'bg-red-500/20'
                    : 'bg-blue-500/20'
                }`}>
                {kycStatus === 'PENDING' ? (
                  <Clock className={`w-6 h-6 text-yellow-400`} />
                ) : kycStatus === 'REJECTED' ? (
                  <ShieldX className="w-6 h-6 text-red-400" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-blue-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-base mb-1 ${kycStatus === 'PENDING' ? 'text-yellow-300'
                    : kycStatus === 'REJECTED' ? 'text-red-300'
                      : 'text-blue-300'
                  }`}>
                  {kycStatus === 'PENDING'
                    ? '⏳ KYC Verification Under Review'
                    : kycStatus === 'REJECTED'
                      ? '❌ KYC Verification Rejected'
                      : '🔒 KYC Verification Required'}
                </h3>
                <p className={`text-sm ${kycStatus === 'PENDING' ? 'text-yellow-200/80'
                    : kycStatus === 'REJECTED' ? 'text-red-200/80'
                      : 'text-blue-200/80'
                  }`}>
                  {kycStatus === 'PENDING'
                    ? 'Your identity verification is currently under review by our team. You will be able to upload products once your KYC is approved. This usually takes 1–2 business days.'
                    : kycStatus === 'REJECTED'
                      ? 'Your KYC submission was rejected. Please review the feedback, update your documents, and resubmit to start selling.'
                      : 'You must complete identity verification (KYC) before you can upload or manage products. This is a one-time process to protect buyers and sellers on Carryofy.'}
                </p>
              </div>
              <Link
                href="/seller/settings?tab=kyc"
                className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all ${kycStatus === 'PENDING'
                    ? 'bg-yellow-600 hover:bg-yellow-500'
                    : kycStatus === 'REJECTED'
                      ? 'bg-red-600 hover:bg-red-500'
                      : 'bg-blue-600 hover:bg-blue-500'
                  }`}
              >
                {kycStatus === 'PENDING' ? 'View Status' : kycStatus === 'REJECTED' ? 'Resubmit KYC' : 'Start KYC'}
              </Link>
            </div>
          )}

          {/* Search bar with filters */}
          <div className="mb-6 w-full">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A0A0A0]" />
                <input
                  type="text"
                  placeholder="Search products by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#1a1a1a] border border-[#2A2A2A] rounded-xl text-white placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="px-4 py-3 bg-[#1a1a1a] border border-[#2A2A2A] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6600] min-w-[140px]"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      Filter: {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="px-4 py-3 bg-[#1a1a1a] border border-[#2A2A2A] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6600] min-w-[140px]"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      Sort: {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 4.3 — resolved: PENDING_APPROVAL seller messaging (emails via API Resend) */}
          {kycStatus === 'APPROVED' && products.some((p) => p.status === 'PENDING_APPROVAL') && (
            <div className="mb-6 rounded-xl border border-amber-500/35 bg-amber-950/30 px-4 py-3">
              <p className="text-amber-100/95 text-sm flex items-start gap-2">
                <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-amber-200">Pending review:</strong> Approval typically takes up to 24 hours. You’ll receive an email when each listing is approved or rejected.
                </span>
              </p>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirm && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-2xl p-6 max-w-md w-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Delete Product</h3>
                    <p className="text-[#ffcc99] text-sm">This action cannot be undone</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-6">
                  Are you sure you want to delete this product? All data associated with it will be permanently removed.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteCancel}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 bg-[#0a0a0a] border border-[#ff6600]/30 text-[#ffcc99] rounded-xl font-medium hover:bg-[#ff6600]/10 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Products Grid/Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-10 h-10 border-3 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-[#ffcc99] text-sm">Loading products...</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-[#2A2A2A] rounded-2xl p-16 text-center flex flex-col items-center justify-center">
              <div className="w-[48px] h-[48px] rounded-lg bg-[#ff6600]/20 flex items-center justify-center mx-auto mb-5">
                <Package className="w-12 h-12 text-[#ff6600]" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">No products yet</h3>
              <p className="text-[#A0A0A0] text-sm mb-8 max-w-sm">
                {searchQuery
                  ? 'Try a different search term'
                  : kycStatus !== 'APPROVED'
                    ? 'Complete KYC verification to start adding products'
                    : sellerNotFound && kycStatus === 'APPROVED'
                      ? 'We could not find your seller profile. Please contact support.'
                      : 'Start by adding your first product'}
              </p>
              {!searchQuery && kycStatus === 'APPROVED' && !sellerNotFound && (
                <Link
                  href="/seller/products/new"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-[#ff6600] text-white font-bold rounded-xl hover:bg-[#cc5200] transition-colors text-base"
                >
                  <Plus className="w-6 h-6" />
                  Add Your First Product
                </Link>
              )}
              {!searchQuery && kycStatus !== 'APPROVED' && (
                <Link
                  href="/seller/settings?tab=kyc"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors"
                >
                  <ShieldAlert className="w-6 h-6" />
                  {kycStatus === 'PENDING' ? 'View KYC Status' : kycStatus === 'REJECTED' ? 'Resubmit KYC' : 'Apply for KYC Verification'}
                </Link>
              )}
              {!searchQuery && sellerNotFound && kycStatus === 'APPROVED' && (
                <Link
                  href="/seller/onboard"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-[#ff6600] text-white font-bold rounded-xl hover:bg-[#cc5200] transition-colors"
                >
                  <ShieldAlert className="w-6 h-6" />
                  Complete Seller Onboarding
                </Link>
              )}
            </div>
          ) : (
            <div className="bg-[#1a1a1a] border border-[#2A2A2A] border-l-[3px] border-l-[#ff6600] rounded-r-xl overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#111111] border-b border-[#2A2A2A]">
                      <th className="px-6 py-4 text-left w-12">
                        <button
                          onClick={handleSelectAll}
                          className="p-1 hover:bg-[#1A1A1A] rounded transition-colors"
                          title="Select All"
                        >
                          {selectedProducts.size === filteredProducts.length && filteredProducts.length > 0 ? (
                            <CheckSquare className="w-5 h-5 text-[#ff6600]" />
                          ) : (
                            <Square className="w-5 h-5 text-[#A0A0A0]" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-[#A0A0A0]">
                        Product
                      </th>
                      <th className="px-6 py-4 text-right text-[11px] font-medium uppercase tracking-[0.08em] text-[#A0A0A0]">
                        Price
                      </th>
                      <th className="px-6 py-4 text-right text-[11px] font-medium uppercase tracking-[0.08em] text-[#A0A0A0]">
                        Stock
                      </th>
                      <th className="px-6 py-4 text-right text-[11px] font-medium uppercase tracking-[0.08em] text-[#A0A0A0]">
                        Commission
                      </th>
                      <th className="px-6 py-4 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-[#A0A0A0]">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-[11px] font-medium uppercase tracking-[0.08em] text-[#A0A0A0]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A2A]">
                    {filteredProducts.map((product) => {
                      const stockBadge = getStockBadge(product.quantity);
                      const statusPill = getStatusPill(product.status);
                      const isSelected = selectedProducts.has(product.id);

                      return (
                        <tr key={product.id} className="hover:bg-[#1A1A1A]/50 transition-colors">
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleSelectProduct(product.id)}
                              className="p-1 hover:bg-[#1A1A1A] rounded transition-colors"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-[#ff6600]" />
                              ) : (
                                <Square className="w-5 h-5 text-[#A0A0A0]" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#111111] border border-[#2A2A2A] flex-shrink-0">
                                {product.images?.[0] ? (
                                  <img
                                    src={product.images[0]}
                                    alt={product.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-4 h-4 text-[#A0A0A0]" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-white font-bold text-[14px] truncate max-w-[280px]" title={product.title}>
                                  {product.title.length > 40 ? `${product.title.slice(0, 40)}…` : product.title}
                                </p>
                                <p className="text-[#555555] text-[11px] font-mono mt-0.5">
                                  {product.id}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-white text-[14px]" style={{ fontFamily: "'DM Mono', monospace" }}>
                              {formatPrice(product.price)}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium"
                              style={{ backgroundColor: stockBadge.bg, color: stockBadge.color }}
                            >
                              {stockBadge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-[#ff6600] font-bold text-[14px]">
                                {product.categoryRel?.commissionB2C?.toFixed(1) ?? 'N/A'}%
                              </span>
                              {product.categoryRel?.name && (
                                <span className="text-[#A0A0A0] text-[11px] mt-0.5">
                                  {product.categoryRel.name}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                                  statusPill.isPendingApproval
                                    ? 'bg-amber-500/15 text-amber-200 border border-amber-500/35'
                                    : statusPill.isActive
                                      ? 'bg-[#22C55E15] text-[#22C55E]'
                                      : 'bg-[#2A2A2A] text-[#A0A0A0]'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                    statusPill.isPendingApproval
                                      ? 'bg-amber-400'
                                      : statusPill.isActive
                                        ? 'bg-[#22C55E]'
                                        : 'bg-[#A0A0A0]'
                                  }`}
                                />
                                {statusPill.label}
                              </span>
                              {statusPill.isPendingApproval && (
                                <span className="text-[11px] text-amber-200/80 max-w-[200px] leading-snug">
                                  Usually reviewed within 24h
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/seller/products/${product.id}/edit`}
                                className="w-8 h-8 flex items-center justify-center rounded-md bg-transparent hover:bg-[#1A1A1A] text-[#A0A0A0] hover:text-[#ff6600] transition-colors"
                                title="Edit product"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/seller/products/${product.id}`}
                                className="w-8 h-8 flex items-center justify-center rounded-md bg-transparent hover:bg-[#1A1A1A] text-[#A0A0A0] hover:text-[#3B82F6] transition-colors"
                                title="Preview listing"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDuplicate(product.id)}
                                disabled={duplicating === product.id}
                                className="w-8 h-8 flex items-center justify-center rounded-md bg-transparent hover:bg-[#1A1A1A] text-[#A0A0A0] hover:text-[#A0A0A0] transition-colors disabled:opacity-50"
                                title="Duplicate"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(product.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-md bg-transparent hover:bg-[#1A1A1A] text-[#A0A0A0] hover:text-[#EF4444] transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-[#2A2A2A]">
                {filteredProducts.map((product) => {
                  const stockBadge = getStockBadge(product.quantity);
                  const statusPill = getStatusPill(product.status);

                  return (
                    <div key={product.id} className="p-4">
                      <div className="flex gap-4">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#111111] border border-[#2A2A2A] flex-shrink-0">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-[#A0A0A0]" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm line-clamp-2">{product.title}</p>
                          <p className="text-white text-sm mt-1" style={{ fontFamily: "'DM Mono', monospace" }}>
                            {formatPrice(product.price)}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                                statusPill.isPendingApproval
                                  ? 'bg-amber-500/15 text-amber-200 border border-amber-500/35'
                                  : statusPill.isActive
                                    ? 'bg-[#22C55E15] text-[#22C55E]'
                                    : 'bg-[#2A2A2A] text-[#A0A0A0]'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                  statusPill.isPendingApproval
                                    ? 'bg-amber-400'
                                    : statusPill.isActive
                                      ? 'bg-[#22C55E]'
                                      : 'bg-[#A0A0A0]'
                                }`}
                              />
                              {statusPill.label}
                            </span>
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                              style={{ backgroundColor: stockBadge.bg, color: stockBadge.color }}
                            >
                              {stockBadge.label}
                            </span>
                          </div>
                          <div className="mt-2 p-2 bg-[#111111] rounded-lg border border-[#2A2A2A]">
                            <p className="text-[#ff6600] font-bold text-sm">
                              {product.categoryRel?.commissionB2C?.toFixed(1) ?? 'N/A'}%
                            </p>
                            {product.categoryRel?.name && (
                              <p className="text-[#A0A0A0] text-xs mt-0.5">{product.categoryRel.name}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-[#2A2A2A]">
                        <Link
                          href={`/seller/products/${product.id}/edit`}
                          className="flex items-center gap-1 px-3 py-1.5 text-[#A0A0A0] hover:text-[#ff6600] text-sm font-medium"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDuplicate(product.id)}
                          disabled={duplicating === product.id}
                          className="flex items-center gap-1 px-3 py-1.5 text-[#A0A0A0] hover:text-white text-sm font-medium disabled:opacity-50"
                        >
                          <Copy className="w-4 h-4" />
                          {duplicating === product.id ? 'Duplicating...' : 'Duplicate'}
                        </button>
                        <button
                          onClick={() => handleDeleteClick(product.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-[#A0A0A0] hover:text-[#EF4444] text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Floating bulk action bar */}
        {selectedProducts.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-4 px-4 py-3 bg-[#1a1a1a] border-t border-[#2A2A2A] shadow-lg">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <span className="text-white font-medium whitespace-nowrap">
                {selectedProducts.size} selected
              </span>
              <span className="text-[#A0A0A0] hidden sm:inline">·</span>
              <button
                onClick={handleBulkDelete}
                disabled={bulkProcessing}
                className="text-[#EF4444] hover:text-[#F87171] font-medium text-sm disabled:opacity-50 whitespace-nowrap"
              >
                Delete selected
              </button>
              <span className="text-[#A0A0A0] hidden sm:inline">·</span>
              <div className="relative">
                <button
                  onClick={() => setBulkStatusOpen((v) => !v)}
                  className="text-[#A0A0A0] hover:text-white font-medium text-sm py-1 whitespace-nowrap"
                >
                  Change status
                </button>
                {bulkStatusOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setBulkStatusOpen(false)}
                    />
                    <div className="absolute bottom-full left-0 mb-2 py-1 bg-[#1a1a1a] border border-[#2A2A2A] rounded-lg shadow-xl z-50 min-w-[140px]">
                      <button
                        onClick={() => handleBulkStatusChange('ACTIVE')}
                        disabled={bulkProcessing}
                        className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#2A2A2A] disabled:opacity-50"
                      >
                        Set Active
                      </button>
                      <button
                        onClick={() => handleBulkStatusChange('INACTIVE')}
                        disabled={bulkProcessing}
                        className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#2A2A2A] disabled:opacity-50"
                      >
                        Set Inactive
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedProducts(new Set())}
              className="p-2 text-[#A0A0A0] hover:text-white hover:bg-[#2A2A2A] rounded-lg transition-colors flex-shrink-0"
              title="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </SellerLayout>
      <ConfirmationDialog
        open={confirmation.open}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        variant={confirmation.variant}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
        loading={confirmation.loading}
      />
    </>
  );
}
