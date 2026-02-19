import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import SellerLayout from '../../../components/seller/SellerLayout';
import { Search, Trash2, Plus, Package, Edit, Eye, MoreVertical, Clock, CheckCircle, XCircle, AlertCircle, CheckSquare, Square, Copy, ShieldAlert, ShieldCheck, ShieldX, Loader2 } from 'lucide-react';
import { useAuth, tokenManager } from '../../../lib/auth';
import { apiClient } from '../../../lib/api/client';
import Link from 'next/link';
import Image from 'next/image';
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
  commissionPercentage?: number; // DEPRECATED - not used
  categoryRel?: {
    id: string;
    name: string;
    commissionB2C: number;
    commissionB2B?: number | null;
  };
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  PENDING_APPROVAL: {
    label: 'Pending Review',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10 border-yellow-400/30',
    icon: <Clock className="w-3 h-3" />,
  },
  ACTIVE: {
    label: 'Active',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10 border-green-400/30',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  INACTIVE: {
    label: 'Inactive',
    color: 'text-red-400',
    bgColor: 'bg-red-400/10 border-red-400/30',
    icon: <XCircle className="w-3 h-3" />,
  },
  REJECTED: {
    label: 'Rejected',
    color: 'text-red-400',
    bgColor: 'bg-red-400/10 border-red-400/30',
    icon: <XCircle className="w-3 h-3" />,
  },
};

export default function ProductsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string | null>(null);
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
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;
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
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(priceInKobo / 100);
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status] || statusConfig.PENDING_APPROVAL;
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'text-red-400' };
    if (quantity <= 5) return { label: `Low Stock (${quantity})`, color: 'text-yellow-400' };
    return { label: `${quantity} in stock`, color: 'text-green-400' };
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

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

    setBulkProcessing(true);
    try {
      const response = await apiClient.post('/products/bulk/status', {
        productIds: Array.from(selectedProducts),
        status,
      });
      toast.success(response.data?.message || `Successfully updated ${response.data?.updated || 0} product(s)`);
      setSelectedProducts(new Set());
      setBulkAction(null);
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

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ffcc99]" />
              <input
                type="text"
                placeholder="Search products by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
              />
            </div>
          </div>

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
            <div className="bg-[#1a1a1a] border border-[#ff6600]/20 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[#ff6600]/10 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-[#ff6600]" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">No products found</h3>
              <p className="text-[#ffcc99] text-sm mb-6">
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ff6600] text-black font-medium rounded-xl hover:bg-[#cc5200] transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Product
                </Link>
              )}
              {!searchQuery && kycStatus !== 'APPROVED' && (
                <Link
                  href="/seller/settings?tab=kyc"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-500 transition-colors"
                >
                  <ShieldAlert className="w-5 h-5" />
                  {kycStatus === 'PENDING' ? 'View KYC Status' : kycStatus === 'REJECTED' ? 'Resubmit KYC' : 'Apply for KYC Verification'}
                </Link>
              )}
              {!searchQuery && sellerNotFound && kycStatus === 'APPROVED' && (
                <Link
                  href="/seller/onboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ff6600] text-black font-medium rounded-xl hover:bg-[#cc5200] transition-colors"
                >
                  <ShieldAlert className="w-5 h-5" />
                  Complete Seller Onboarding
                </Link>
              )}
            </div>
          ) : (
            <div className="bg-[#1a1a1a] border border-[#ff6600]/20 rounded-2xl overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#0a0a0a] border-b border-[#ff6600]/20">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#ffcc99] uppercase tracking-wider w-12">
                        <button
                          onClick={handleSelectAll}
                          className="p-1 hover:bg-[#ff6600]/10 rounded transition-colors"
                          title="Select All"
                        >
                          {selectedProducts.size === filteredProducts.length && filteredProducts.length > 0 ? (
                            <CheckSquare className="w-5 h-5 text-[#ff6600]" />
                          ) : (
                            <Square className="w-5 h-5 text-[#ffcc99]/60" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#ffcc99] uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#ffcc99] uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#ffcc99] uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#ffcc99] uppercase tracking-wider">
                        Commission
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#ffcc99] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-[#ffcc99] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ff6600]/10">
                    {filteredProducts.map((product) => {
                      const statusCfg = getStatusConfig(product.status);
                      const stockStatus = getStockStatus(product.quantity);

                      const isSelected = selectedProducts.has(product.id);
                      return (
                        <tr key={product.id} className="hover:bg-[#ff6600]/5 transition-colors">
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleSelectProduct(product.id)}
                              className="p-1 hover:bg-[#ff6600]/10 rounded transition-colors"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-[#ff6600]" />
                              ) : (
                                <Square className="w-5 h-5 text-[#ffcc99]/60" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#0a0a0a] border border-[#ff6600]/20 flex-shrink-0">
                                {product.images?.[0] ? (
                                  <img
                                    src={product.images[0]}
                                    alt={product.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-6 h-6 text-[#ffcc99]/30" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-white font-medium line-clamp-1">{product.title}</p>
                                <p className="text-[#ffcc99]/60 text-xs mt-0.5">
                                  ID: {product.id.slice(0, 8)}...
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-white font-semibold">{formatPrice(product.price)}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className={`text-sm font-medium ${stockStatus.color}`}>
                              {stockStatus.label}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-white font-semibold text-sm">
                                {product.categoryRel?.commissionB2C?.toFixed(1) ?? 'N/A'}%
                              </span>
                              {product.categoryRel?.name && (
                                <span className="text-[#ffcc99]/60 text-xs">
                                  {product.categoryRel.name}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${statusCfg.bgColor} ${statusCfg.color}`}>
                              {statusCfg.icon}
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/seller/products/${product.id}/edit`}
                                className="p-2 text-[#ffcc99] hover:text-[#ff6600] hover:bg-[#ff6600]/10 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/seller/products/${product.id}`}
                                className="p-2 text-[#ffcc99] hover:text-[#ff6600] hover:bg-[#ff6600]/10 rounded-lg transition-colors"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDuplicate(product.id)}
                                disabled={duplicating === product.id}
                                className="p-2 text-[#ffcc99] hover:text-[#ff6600] hover:bg-[#ff6600]/10 rounded-lg transition-colors disabled:opacity-50"
                                title="Duplicate"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(product.id)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
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
              <div className="md:hidden divide-y divide-[#ff6600]/10">
                {filteredProducts.map((product) => {
                  const statusCfg = getStatusConfig(product.status);
                  const stockStatus = getStockStatus(product.quantity);

                  return (
                    <div key={product.id} className="p-4">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#0a0a0a] border border-[#ff6600]/20 flex-shrink-0">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-[#ffcc99]/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium line-clamp-2">{product.title}</p>
                          <p className="text-[#ff6600] font-bold mt-1">{formatPrice(product.price)}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${statusCfg.bgColor} ${statusCfg.color}`}>
                              {statusCfg.icon}
                              {statusCfg.label}
                            </span>
                            <span className={`text-xs ${stockStatus.color}`}>
                              {stockStatus.label}
                            </span>
                          </div>
                          <div className="mt-2 p-2 bg-[#0a0a0a] rounded-lg border border-[#ff6600]/20">
                            <p className="text-[#ffcc99] text-xs mb-1">Platform Commission</p>
                            <p className="text-white font-semibold text-sm">
                              {product.categoryRel?.commissionB2C?.toFixed(1) ?? 'N/A'}%
                            </p>
                            {product.categoryRel?.name && (
                              <p className="text-[#ffcc99]/60 text-xs mt-0.5">{product.categoryRel.name}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-[#ff6600]/10">
                        <Link
                          href={`/seller/products/${product.id}/edit`}
                          className="flex items-center gap-1 px-3 py-1.5 text-[#ffcc99] hover:text-[#ff6600] text-sm font-medium"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDuplicate(product.id)}
                          disabled={duplicating === product.id}
                          className="flex items-center gap-1 px-3 py-1.5 text-[#ffcc99] hover:text-[#ff6600] text-sm font-medium disabled:opacity-50"
                        >
                          <Copy className="w-4 h-4" />
                          {duplicating === product.id ? 'Duplicating...' : 'Duplicate'}
                        </button>
                        <button
                          onClick={() => handleDeleteClick(product.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-red-400 hover:text-red-300 text-sm font-medium"
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
