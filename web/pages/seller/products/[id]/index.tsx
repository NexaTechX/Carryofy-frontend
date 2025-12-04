import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import SellerLayout from '../../../../components/seller/SellerLayout';
import { useAuth } from '../../../../lib/auth';
import { apiClient } from '../../../../lib/api/client';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  ExternalLink,
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
  seller?: {
    id: string;
    businessName: string;
  };
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode; description: string }> = {
  PENDING_APPROVAL: {
    label: 'Pending Review',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10 border-yellow-400/30',
    icon: <Clock className="w-4 h-4" />,
    description: 'Your product is being reviewed by our team. This usually takes 24-48 hours.',
  },
  ACTIVE: {
    label: 'Active',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10 border-green-400/30',
    icon: <CheckCircle className="w-4 h-4" />,
    description: 'Your product is live and visible to buyers.',
  },
  INACTIVE: {
    label: 'Inactive',
    color: 'text-red-400',
    bgColor: 'bg-red-400/10 border-red-400/30',
    icon: <XCircle className="w-4 h-4" />,
    description: 'This product has been deactivated and is not visible to buyers.',
  },
  REJECTED: {
    label: 'Rejected',
    color: 'text-red-400',
    bgColor: 'bg-red-400/10 border-red-400/30',
    icon: <XCircle className="w-4 h-4" />,
    description: 'This product was rejected. Please review and edit it to meet our guidelines.',
  },
};

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    // Only sellers can access this page
    if (user.role !== 'SELLER') {
      router.push('/');
      return;
    }
  }, [router, authLoading, isAuthenticated, user]);

  useEffect(() => {
    if (id && isAuthenticated) {
      fetchProduct();
    }
  }, [id, isAuthenticated]);

  const fetchProduct = async () => {
    try {
      const response = await apiClient.get(`/products/${id}`);
      const data = response.data?.data || response.data;
      setProduct(data);
    } catch (error: any) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
      router.push('/seller/products');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status] || statusConfig.PENDING_APPROVAL;
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'text-red-400', bg: 'bg-red-400/10' };
    if (quantity <= 5) return { label: 'Low Stock', color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
    return { label: 'In Stock', color: 'text-green-400', bg: 'bg-green-400/10' };
  };

  const handleDelete = async () => {
    if (!product) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/products/${product.id}`);
      toast.success('Product deleted successfully');
      router.push('/seller/products');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#ffcc99]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !product) {
    return null;
  }

  const statusCfg = getStatusConfig(product.status);
  const stockStatus = getStockStatus(product.quantity);

  return (
    <>
      <Head>
        <title>{product.title} - Seller Portal | Carryofy</title>
        <meta name="description" content={product.description || `View ${product.title} details`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SellerLayout>
        <div className="min-h-full pb-8">
          {/* Back Button */}
          <button
            onClick={() => router.push('/seller/products')}
            className="flex items-center gap-2 text-[#ffcc99] hover:text-[#ff6600] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Products</span>
          </button>

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
                  Are you sure you want to delete &quot;{product.title}&quot;? All data will be permanently removed.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 bg-[#0a0a0a] border border-[#ff6600]/30 text-[#ffcc99] rounded-xl font-medium hover:bg-[#ff6600]/10 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Images */}
            <div className="lg:col-span-1 space-y-4">
              {/* Main Image */}
              <div className="bg-[#1a1a1a] border border-[#ff6600]/20 rounded-2xl overflow-hidden">
                <div className="aspect-square relative">
                  {product.images?.[selectedImage] ? (
                    <img
                      src={product.images[selectedImage]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a]">
                      <Package className="w-16 h-16 text-[#ffcc99]/30" />
                    </div>
                  )}
                </div>
                
                {/* Thumbnail Strip */}
                {product.images && product.images.length > 1 && (
                  <div className="p-3 border-t border-[#ff6600]/20">
                    <div className="flex gap-2 overflow-x-auto">
                      {product.images.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                            selectedImage === index
                              ? 'border-[#ff6600]'
                              : 'border-transparent hover:border-[#ff6600]/50'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`${product.title} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="bg-[#1a1a1a] border border-[#ff6600]/20 rounded-2xl p-4">
                <h3 className="text-white font-semibold mb-3">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[#ffcc99] text-sm">Views</span>
                    <span className="text-white font-medium">--</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#ffcc99] text-sm">Orders</span>
                    <span className="text-white font-medium">--</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#ffcc99] text-sm">Revenue</span>
                    <span className="text-white font-medium">--</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="lg:col-span-2 space-y-4">
              {/* Header Card */}
              <div className="bg-[#1a1a1a] border border-[#ff6600]/20 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-2">{product.title}</h1>
                    <p className="text-[#ffcc99] text-sm">Product ID: {product.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/seller/products/${product.id}/edit`}
                      className="flex items-center gap-2 px-4 py-2 bg-[#ff6600] text-black font-medium rounded-xl hover:bg-[#cc5200] transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <p className="text-3xl font-bold text-[#ff6600]">{formatPrice(product.price)}</p>
                </div>

                {/* Status & Stock Badges */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border ${statusCfg.bgColor} ${statusCfg.color}`}>
                    {statusCfg.icon}
                    {statusCfg.label}
                  </span>
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                    <Package className="w-4 h-4" />
                    {product.quantity} {stockStatus.label}
                  </span>
                </div>

                {/* Status Description */}
                <div className={`p-4 rounded-xl ${statusCfg.bgColor} border`}>
                  <p className={`text-sm ${statusCfg.color}`}>
                    {statusCfg.description}
                  </p>
                </div>
              </div>

              {/* Description Card */}
              <div className="bg-[#1a1a1a] border border-[#ff6600]/20 rounded-2xl p-6">
                <h2 className="text-white font-semibold mb-3">Description</h2>
                {product.description ? (
                  <p className="text-[#ffcc99] whitespace-pre-wrap">{product.description}</p>
                ) : (
                  <p className="text-[#ffcc99]/50 italic">No description provided</p>
                )}
              </div>

              {/* Product Details Card */}
              <div className="bg-[#1a1a1a] border border-[#ff6600]/20 rounded-2xl p-6">
                <h2 className="text-white font-semibold mb-4">Product Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#0a0a0a] rounded-xl">
                    <p className="text-[#ffcc99] text-xs uppercase tracking-wider mb-1">Created</p>
                    <p className="text-white text-sm">{formatDate(product.createdAt)}</p>
                  </div>
                  <div className="p-4 bg-[#0a0a0a] rounded-xl">
                    <p className="text-[#ffcc99] text-xs uppercase tracking-wider mb-1">Last Updated</p>
                    <p className="text-white text-sm">{formatDate(product.updatedAt)}</p>
                  </div>
                  <div className="p-4 bg-[#0a0a0a] rounded-xl">
                    <p className="text-[#ffcc99] text-xs uppercase tracking-wider mb-1">Price</p>
                    <p className="text-white text-sm">{formatPrice(product.price)}</p>
                  </div>
                  <div className="p-4 bg-[#0a0a0a] rounded-xl">
                    <p className="text-[#ffcc99] text-xs uppercase tracking-wider mb-1">Quantity</p>
                    <p className="text-white text-sm">{product.quantity} units</p>
                  </div>
                </div>
              </div>

              {/* Public View Link */}
              {product.status === 'ACTIVE' && (
                <div className="bg-[#1a1a1a] border border-[#ff6600]/20 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-white font-semibold mb-1">Public Product Page</h2>
                      <p className="text-[#ffcc99] text-sm">View how buyers see your product</p>
                    </div>
                    <Link
                      href={`/products/${product.id}`}
                      target="_blank"
                      className="flex items-center gap-2 px-4 py-2 border border-[#ff6600]/30 text-[#ffcc99] font-medium rounded-xl hover:bg-[#ff6600]/10 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Public Page
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SellerLayout>
    </>
  );
}

