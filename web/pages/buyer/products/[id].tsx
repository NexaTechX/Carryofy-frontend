import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { GetServerSideProps } from 'next';
import BuyerLayout from '../../../components/buyer/BuyerLayout';
import apiClient from '../../../lib/api/client';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Store,
  Shield,
  Star,
  TrendingUp,
  Package,
  Info,
  Droplets,
  Heart,
  FileText,
  User,
  Share2,
  Zap,
  Check,
  ThumbsUp,
} from 'lucide-react';
import { useAuth, tokenManager, userManager } from '../../../lib/auth';
import { useCart } from '../../../lib/contexts/CartContext';
import { categoryDisplayName } from '../../../lib/buyer/categoryDisplay';
import SEO from '../../../components/seo/SEO';
import { ProductSchema, BreadcrumbSchema } from '../../../components/seo/JsonLd';
import { addToWishlist, removeFromWishlist, checkWishlist } from '../../../lib/api/wishlist';
import { showSuccessToast, showErrorToast } from '../../../lib/ui/toast';
import ShareButton from '../../../components/products/ShareButton';
import RelatedProducts from '../../../components/products/RelatedProducts';

interface PriceTier {
  minQuantity: number;
  maxQuantity: number;
  priceKobo: number;
}

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  images: string[];
  quantity: number;
  category?: string;
  material?: string;
  careInfo?: string;
  keyFeatures?: string[];
  seller: {
    id: string;
    businessName: string;
    isVerified?: boolean;
  };
  createdAt: string;
  updatedAt: string;
  sellingMode?: string;
  moq?: number;
  leadTimeDays?: number;
  b2bProductType?: string;
  requestQuoteOnly?: boolean;
  priceTiers?: PriceTier[];
  status?: string;
  tags?: string[];
}

// Placeholder specs for Product Details tab
const PLACEHOLDER_SPECS: Record<string, string>[] = [
  { Brand: 'AUX' },
  { Material: 'Premium Leather' },
  { Weight: '85kg' },
  { Dimensions: '140×90×110cm' },
  { Warranty: '12 months' },
  { Origin: 'China' },
];

// Placeholder bulk pricing tiers (used when product has no priceTiers)
const PLACEHOLDER_BULK_TIERS = [
  { min: 1, max: 4, priceKobo: 160000000, savings: null as string | null },
  { min: 5, max: 9, priceKobo: 144000000, savings: '10% off' },
  { min: 10, max: 999999, priceKobo: 128000000, savings: '20% off' },
];

// Placeholder perfect-for tags
const PLACEHOLDER_PERFECT_FOR = ['Home Use', 'Offices', 'Hotels', 'Spas'];

interface Review {
  id: string;
  productId: string;
  userId: string;
  orderId?: string;
  rating: number;
  comment: string;
  authorName: string;
  createdAt: string;
}

interface ProductPageProps {
  initialProduct: Product | null;
  error?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com/api/v1';

// Server-side data fetching for SEO
export const getServerSideProps: GetServerSideProps<ProductPageProps> = async ({ params }) => {
  const id = params?.id as string;

  if (!id) {
    return {
      props: {
        initialProduct: null,
        error: 'Product ID not provided',
      },
    };
  }

  try {
    // Add timeout to fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Handle specific HTTP error codes
      if (response.status === 404) {
        return {
          props: {
            initialProduct: null,
            error: 'Product not found',
          },
        };
      }

      return {
        props: {
          initialProduct: null,
          error: `Failed to load product (${response.status})`,
        },
      };
    }

    const data = await response.json();
    const product = data.data || data;

    return {
      props: {
        initialProduct: product,
      },
    };
  } catch (error: any) {
    console.error('Error fetching product for SSR:', error);

    // Handle connection errors
    if (error.name === 'AbortError' || error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
      console.warn(`Backend API not available at ${API_BASE_URL}. Product will be loaded client-side.`);
      // Return null product - client-side will handle fetching
      return {
        props: {
          initialProduct: null,
          // Don't show error, let client-side handle it
        },
      };
    }

    return {
      props: {
        initialProduct: null,
        error: 'Failed to load product',
      },
    };
  }
};

export default function ProductDetailPage({ initialProduct, error: ssrError }: ProductPageProps) {
  const router = useRouter();
  const { id } = router.query;
  const [mounted, setMounted] = useState(false);
  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState<string | null>(ssrError || null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'seller' | 'reviews'>('details');
  const [fullDescriptionOpen, setFullDescriptionOpen] = useState(false);
  const { addToCart } = useCart();
  const { user: authUser, isAuthenticated: authAuthenticated, isLoading: authLoading } = useAuth();

  // Sync auth from context (so we only show authenticated state after AuthProvider has validated token)
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const authenticated = !authLoading && authAuthenticated;
    setIsAuthenticated(!!authenticated);
  }, [authLoading, authAuthenticated]);

  useEffect(() => {
    if (mounted && id && !initialProduct) {
      fetchProduct();
    } else if (initialProduct) {
      fetchReviews(initialProduct.id);
      if (isAuthenticated) {
        checkWishlistStatus(initialProduct.id);
      }
    }
  }, [mounted, id, initialProduct, isAuthenticated]);

  // Only enforce MOQ in quantity when we're showing B2B (authenticated); never for public
  const mayShowB2bFull = isAuthenticated && (product?.sellingMode === 'B2B_ONLY' || product?.sellingMode === 'B2C_AND_B2B');
  useEffect(() => {
    if (mayShowB2bFull && product && (product.moq ?? 0) > 0 && quantity < product.moq!) {
      setQuantity(product.moq!);
    }
  }, [mayShowB2bFull, product?.id, product?.moq, product?.sellingMode, quantity]);

  const checkWishlistStatus = async (productId: string) => {
    try {
      const status = await checkWishlist(productId);
      setInWishlist(status);
    } catch (err) {
      console.error('Error checking wishlist status:', err);
    }
  };

  const fetchReviews = useCallback(async (productId: string) => {
    try {
      setReviewsLoading(true);
      setReviewsError(null);
      const response = await apiClient.get<Review[]>(`/products/${productId}/reviews`);
      const data = (response.data as any).data || response.data;
      setReviews(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
      const message = err.response?.data?.message || err.message || 'Failed to load reviews.';
      setReviewsError(message);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!product) return;

    const handleReviewsUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ productId: string }>).detail;
      if (detail?.productId === product.id) {
        fetchReviews(product.id);
      }
    };

    window.addEventListener('reviews:updated', handleReviewsUpdated as EventListener);
    return () => {
      window.removeEventListener('reviews:updated', handleReviewsUpdated as EventListener);
    };
  }, [product, fetchReviews]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<Product>(`/products/${id}`);
      const productData = (response.data as any).data || response.data;
      setProduct(productData);
      fetchReviews(productData.id);
    } catch (err: any) {
      console.error('Error fetching product:', err);

      // Handle network errors with helpful messages
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error' || err.code === 'ECONNREFUSED') {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com/api/v1';
        const fullUrl = `${apiBase}/products/${id}`;

        setError(
          `Cannot connect to backend server.\n\n` +
          `API URL: ${fullUrl}\n\n` +
          `Please check:\n` +
          `1. Backend server is running (cd apps/api && npm run start:dev)\n` +
          `2. Backend is on port 3000\n` +
          `3. Environment variable NEXT_PUBLIC_API_BASE is set correctly\n` +
          `4. No firewall is blocking the connection`
        );
      } else if (err.response?.status === 404) {
        setError('Product not found');
      } else if (err.response?.status === 401) {
        // This shouldn't happen if endpoint is public, but handle it anyway
        setError('Authentication required. Please log in.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load product');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/buyer/products/${product.id}`);
      return;
    }

    // Use selected quantity (effectiveQuantity respects MOQ and stock for B2B)
    const qty = effectiveQuantity;
    if (qty < 1) return;

    try {
      setAddingToCart(true);
      setCartMessage(null);

      await addToCart(product.id, qty);

      setCartMessage({ type: 'success', text: 'Product added to cart successfully!' });
      setTimeout(() => {
        setCartMessage(null);
      }, 2000);
    } catch (err: any) {
      console.error('Error adding to cart:', err);
      setCartMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to add product to cart',
      });
      setTimeout(() => setCartMessage(null), 3000);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product || !isAuthenticated) {
      router.push(`/auth/login?redirect=/buyer/products/${product?.id}`);
      return;
    }

    try {
      setWishlistLoading(true);
      if (inWishlist) {
        await removeFromWishlist(product.id);
        setInWishlist(false);
        showSuccessToast('Removed from saved list');
      } else {
        await addToWishlist(product.id);
        setInWishlist(true);
        showSuccessToast('Added to saved list');
      }
    } catch (err: any) {
      console.error('Error toggling wishlist:', err);
      showErrorToast(err.response?.data?.message || 'Failed to update saved list');
    } finally {
      setWishlistLoading(false);
    }
  };

  const formatPrice = (priceInKobo: number) => {
    return `₦${(priceInKobo / 100).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const isB2bEnabled = product?.sellingMode === 'B2B_ONLY' || product?.sellingMode === 'B2C_AND_B2B';
  const isB2bOnly = product?.sellingMode === 'B2B_ONLY';
  // B2B details (MOQ, tiers, bulk price) for all authenticated buyers — never for public
  const showB2bFull = isAuthenticated && isB2bEnabled;
  const showB2bCta = false; // logic removed
  // B2B_ONLY: add-to-cart unless quote-only. B2C_AND_B2B: cart unless quote-only for B2B context.
  const canAddToCart = isB2bOnly
    ? showB2bFull && !product?.requestQuoteOnly
    : !(showB2bFull && product?.requestQuoteOnly);
  // Only expose MOQ-based min quantity when showing B2B; otherwise public would see MOQ
  const minQuantity = showB2bFull && product && isB2bEnabled && (product.moq ?? 0) > 0 ? product.moq! : 1;
  const effectiveQuantity = product ? Math.max(minQuantity, Math.min(product.quantity, quantity)) : quantity;

  const resolveUnitPriceKobo = (p: Product, qty: number): number => {
    const tiers = p.priceTiers;
    if (tiers?.length) {
      const tier = tiers
        .slice()
        .sort((a, b) => a.minQuantity - b.minQuantity)
        .find((t) => qty >= t.minQuantity && qty <= t.maxQuantity);
      if (tier) return tier.priceKobo;
    }
    return p.price;
  };
  // Use tiered price only when B2B full view allowed; otherwise public gets base price only
  const unitPriceKobo = product
    ? showB2bFull ? resolveUnitPriceKobo(product, effectiveQuantity) : product.price
    : 0;
  const totalPriceKobo = product ? unitPriceKobo * effectiveQuantity : 0;

  const getCategoryName = (slug?: string) => {
    return slug ? categoryDisplayName(slug, slug) : 'Uncategorized';
  };

  // Calculate average rating from reviews
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 4.8;

  // SEO keywords based on product
  const productKeywords = product ? [
    product.title,
    `buy ${product.title} Nigeria`,
    `${product.title} Lagos`,
    `${product.title} price Nigeria`,
    `${getCategoryName(product.category)} Nigeria`,
    `buy ${getCategoryName(product.category)} online Nigeria`,
    product.seller?.businessName,
    'Carryofy',
    'same day delivery Lagos',
    'buy online Nigeria',
    'online shopping Nigeria',
    'fast delivery Nigeria',
  ].join(', ') : '';

  if (!mounted) {
    return null;
  }

  return (
    <>
      <SEO
        title={product ? `${product.title} - Buy Online in Nigeria | Carryofy` : 'Product | Carryofy'}
        description={product
          ? `Buy ${product.title} online in Nigeria at ${formatPrice(product.price)}. ${product.description?.slice(0, 120) || ''} Same-day delivery in Lagos. Sold by ${product.seller?.businessName || 'verified seller'} on Carryofy.`
          : 'Shop quality products online at Carryofy. Same-day delivery in Lagos, Nigeria.'
        }
        keywords={productKeywords}
        canonical={product ? `https://carryofy.com/buyer/products/${product.id}` : undefined}
        ogType="product"
        ogImage={product?.images?.[0] || 'https://carryofy.com/og/product.png'}
        ogImageAlt={product?.title || 'Product on Carryofy'}
        productPrice={product?.price}
        productCurrency="NGN"
        productAvailability={product?.quantity && product.quantity > 0 ? 'in stock' : 'out of stock'}
        productCondition="new"
      />

      {product && (
        <>
          <ProductSchema
            name={product.title}
            description={product.description || `Buy ${product.title} online at Carryofy`}
            image={product.images || []}
            price={product.price}
            currency="NGN"
            availability={product.quantity > 0 ? 'InStock' : 'OutOfStock'}
            sku={product.id}
            category={getCategoryName(product.category)}
            seller={{
              name: product.seller?.businessName || 'Carryofy Seller',
              url: `https://carryofy.com/seller/${product.seller?.id}`,
            }}
            rating={reviews.length > 0 ? { value: averageRating, count: reviews.length } : undefined}
            url={`https://carryofy.com/buyer/products/${product.id}`}
          />
          <BreadcrumbSchema
            items={[
              { name: 'Home', url: '/' },
              { name: 'Products', url: '/buyer/products' },
              ...(product.category ? [{ name: getCategoryName(product.category), url: `/buyer/products?category=${product.category}` }] : []),
              { name: product.title, url: `/buyer/products/${product.id}` },
            ]}
          />
        </>
      )}

      <BuyerLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Breadcrumb - Categories > Electronics & Gadgets > Product Name */}
          <nav className="flex items-center gap-2 text-sm mb-8 text-[#ffcc99]/70" aria-label="Breadcrumb">
            <Link href="/buyer/categories" className="hover:text-[#FF6B00] transition-colors">
              Categories
            </Link>
            <span className="text-[#ffcc99]/40">/</span>
            {product?.category && (
              <>
                <Link
                  href={`/buyer/products?category=${product.category}`}
                  className="hover:text-[#FF6B00] transition-colors"
                >
                  {getCategoryName(product.category)}
                </Link>
                <span className="text-[#ffcc99]/40">/</span>
              </>
            )}
            <span className="text-[#ffcc99]/90 truncate max-w-[200px] sm:max-w-none">{product?.title || 'Product'}</span>
          </nav>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-14 h-14 border-2 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin" />
              <p className="text-[#ffcc99]/80 mt-4 font-medium">Loading product...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="max-w-lg mx-auto bg-red-500/10 border border-red-500/40 rounded-2xl p-8 text-center">
              <p className="text-red-400 mb-6 whitespace-pre-line text-sm">{error}</p>
              <button
                onClick={fetchProduct}
                className="px-6 py-3 bg-[#ff6600] text-black rounded-xl font-semibold hover:bg-[#cc5200] transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Product Details */}
          {!loading && !error && product && (
            <article className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12" itemScope itemType="https://schema.org/Product">
              {/* Left Column - Image Gallery */}
              <div className="lg:sticky lg:top-24 lg:self-start">
                {/* Main Image - fixed height, object-fit contain, dark bg, zoom on hover */}
                <div className="bg-[#1A1A1A] rounded-2xl overflow-hidden mb-4 h-[400px] sm:h-[480px] relative ring-1 ring-white/5 group">
                  {product.images && product.images.length > 0 ? (
                    <>
                      <Image
                        src={product.images[selectedImageIndex]}
                        alt={product.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-contain group-hover:scale-105 transition-transform duration-300"
                        itemProp="image"
                        priority
                      />
                      {/* Fulfilled by Carryofy badge - top-left */}
                      <span className="absolute top-3 left-3 px-2.5 py-1.5 bg-[#FF6B00] text-black text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-lg">
                        <Package className="w-3.5 h-3.5" />
                        Fulfilled by Carryofy
                      </span>
                      {product.images.length > 1 && (
                        <>
                          <button
                            onClick={() =>
                              setSelectedImageIndex((prev) =>
                                prev === 0 ? product.images.length - 1 : prev - 1
                              )
                            }
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all backdrop-blur-sm"
                            aria-label="Previous image"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() =>
                              setSelectedImageIndex((prev) =>
                                prev === product.images.length - 1 ? 0 : prev + 1
                              )
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all backdrop-blur-sm"
                            aria-label="Next image"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          {/* Image counter badge - bottom right */}
                          <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm text-white/90 text-xs font-medium rounded-lg">
                            {selectedImageIndex + 1} / {product.images.length}
                          </span>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[#ffcc99]/60">
                      <div className="text-center">
                        <Package className="w-16 h-16 mx-auto mb-2 opacity-40" />
                        <p>No Image Available</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Thumbnail strip - 5 thumbnails, active has orange border */}
                {product.images && product.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {product.images.slice(0, 5).map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${selectedImageIndex === index
                          ? 'border-[#FF6B00] ring-2 ring-[#FF6B00]/30'
                          : 'border-white/10 hover:border-[#FF6B00]/50 opacity-80 hover:opacity-100'
                          }`}
                        aria-label={`View image ${index + 1}`}
                      >
                        <Image src={image} alt={`${product.title} ${index + 1}`} fill sizes="80px" className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column - Product Info */}
              <div className="space-y-6">
                {/* Feature tag chips (max 3) - small, rounded, dark outlined */}
                {product.keyFeatures && product.keyFeatures.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {product.keyFeatures.slice(0, 3).map((feature, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 border border-white/20 text-[#ffcc99]/90 rounded-full text-xs font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                )}

                {/* Product title - large, bold, white, 2-3 lines max */}
                <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight tracking-tight line-clamp-3" itemProp="name">
                  {product.title}
                </h1>

                {/* Seller row */}
                <div className="flex flex-wrap items-center gap-3 py-2">
                  <div className="flex items-center gap-2" itemProp="brand" itemScope itemType="https://schema.org/Brand">
                    <div className="w-9 h-9 rounded-lg bg-[#FF6B00]/20 flex items-center justify-center">
                      <Store className="w-4 h-4 text-[#FF6B00]" />
                    </div>
                    <span className="text-white font-medium">{product.seller.businessName}</span>
                  </div>
                  <button
                    onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex items-center gap-1.5 text-[#ffcc99]/90 hover:text-[#FF6B00] transition-colors"
                    itemProp="aggregateRating"
                    itemScope
                    itemType="https://schema.org/AggregateRating"
                  >
                    <Star className="w-4 h-4 text-[#FF6B00] fill-[#FF6B00]" />
                    <span className="font-semibold text-white" itemProp="ratingValue">{averageRating.toFixed(1)}</span>
                    <span className="text-sm">({reviews.length} reviews)</span>
                    <meta itemProp="reviewCount" content={String(reviews.length || 1)} />
                  </button>
                  {product.seller?.isVerified !== false && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded">
                      <Shield className="w-3.5 h-3.5" />
                      Verified Seller
                    </span>
                  )}
                  <Link
                    href={`/buyer/products?seller=${product.seller.id}`}
                    className="text-[#FF6B00] hover:underline text-sm font-medium"
                  >
                    View Store
                  </Link>
                </div>

                {/* Fulfillment + delivery row */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-[#FF6B00]">
                    <Check className="w-4 h-4" />
                    Fulfilled by Carryofy
                  </span>
                  <span className="flex items-center gap-1.5 text-[#FF6B00]">
                    <Zap className="w-4 h-4" />
                    Same-Day Delivery · Lagos
                  </span>
                </div>

                {/* Price Section - card with dark background + bulk pricing table */}
                <div className="p-6 bg-[#1A1A1A] border border-white/10 rounded-2xl" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                  {showB2bFull && product.requestQuoteOnly ? (
                    <p className="text-[#FF6B00] text-2xl font-bold">Price on quote</p>
                  ) : (
                    <>
                      <p className="text-[#FF6B00] text-3xl sm:text-4xl font-bold" itemProp="price" content={String((product.priceTiers?.[0]?.priceKobo ?? product.price) / 100)}>
                        {formatPrice(unitPriceKobo)}
                      </p>
                      {product.quantity > 0 ? (
                        <div className="mt-3 flex items-center gap-2 text-green-400 text-sm">
                          <span className="w-2 h-2 bg-green-400 rounded-full" />
                          {product.quantity} units in stock
                        </div>
                      ) : (
                        <p className="mt-3 text-red-400 text-sm font-medium">Out of stock</p>
                      )}
                      {/* Bulk Pricing Tier Table */}
                      {((product.priceTiers && product.priceTiers.length > 0) || (!product.requestQuoteOnly && (product.sellingMode === 'B2C_AND_B2B' || product.sellingMode === 'B2B_ONLY'))) && (
                        <div className="mt-5 pt-4 border-t border-white/10">
                          <p className="text-[#ffcc99]/80 text-xs font-medium mb-3">Bulk Pricing — automatically applied</p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-white/10">
                                  <th className="py-2 pr-4 text-left text-[#ffcc99]/70 font-medium">Quantity</th>
                                  <th className="py-2 pr-4 text-left text-[#ffcc99]/70 font-medium">Price Per Unit</th>
                                  <th className="py-2 text-left text-[#ffcc99]/70 font-medium">Savings</th>
                                </tr>
                              </thead>
                              <tbody className="text-white">
                                {product.priceTiers && product.priceTiers.length > 0
                                  ? [...product.priceTiers].sort((a, b) => a.minQuantity - b.minQuantity).map((tier, i) => (
                                    <tr key={i} className={i % 2 === 1 ? 'bg-white/[0.02]' : ''}>
                                      <td className="py-2 pr-4">{tier.minQuantity}–{tier.maxQuantity >= 999999 ? '∞' : tier.maxQuantity}</td>
                                      <td className="py-2 pr-4">{formatPrice(tier.priceKobo)}</td>
                                      <td className="py-2">—</td>
                                    </tr>
                                  ))
                                  : PLACEHOLDER_BULK_TIERS.map((tier, i) => (
                                    <tr key={i} className={i % 2 === 1 ? 'bg-white/[0.02]' : ''}>
                                      <td className="py-2 pr-4">{tier.min}–{tier.max >= 999999 ? '∞' : tier.max}</td>
                                      <td className="py-2 pr-4">{formatPrice(tier.priceKobo)}</td>
                                      <td className="py-2">{tier.savings ?? '—'}</td>
                                    </tr>
                                  ))
                                }
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <meta itemProp="priceCurrency" content="NGN" />
                  <link itemProp="availability" href={product.quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'} />
                </div>

                {/* About this product - structured sections */}
                <div>
                  <h3 className="text-white font-semibold mb-3">About this product</h3>
                  <p className="text-[#ffcc99]/90 text-sm leading-relaxed mb-4 line-clamp-3">
                    {product.description?.slice(0, 200) || `Buy ${product.title} online. Quality product from verified sellers. Same-day delivery available in Lagos.`}
                  </p>
                  {product.keyFeatures && product.keyFeatures.length > 0 && (
                    <div className="mb-4">
                      <p className="text-white font-medium text-sm mb-2">Key Features</p>
                      <ul className="space-y-1.5">
                        {product.keyFeatures.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-[#ffcc99]/90 text-sm">
                            <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mb-4">
                    <p className="text-white font-medium text-sm mb-2">Perfect For</p>
                    <div className="flex flex-wrap gap-2">
                      {(product.tags?.length ? product.tags : PLACEHOLDER_PERFECT_FOR).slice(0, 4).map((tag, i) => {
                        const label = typeof tag === 'string' ? tag : (tag as { name?: string })?.name ?? String(tag);
                        return (
                          <span key={i} className="px-3 py-1.5 border border-white/20 text-[#ffcc99]/90 rounded-full text-xs">
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  {product.description && product.description.length > 200 && (
                    <div>
                      <button
                        onClick={() => setFullDescriptionOpen(!fullDescriptionOpen)}
                        className="text-[#FF6B00] hover:underline text-sm font-medium"
                      >
                        {fullDescriptionOpen ? 'Show less' : 'Read Full Description'}
                      </button>
                      {fullDescriptionOpen && (
                        <p className="mt-2 text-[#ffcc99]/80 text-sm leading-relaxed whitespace-pre-wrap" itemProp="description">
                          {product.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Quantity + Actions */}
                {product.quantity > 0 && (
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Quantity</label>
                    <div className="flex items-center gap-2 mb-3">
                      <button
                        onClick={() => setQuantity(Math.max(minQuantity, quantity - 1))}
                        className="w-11 h-11 bg-white/5 border border-white/20 rounded-l-xl text-white hover:bg-white/10 transition font-medium"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-14 h-11 flex items-center justify-center bg-white/5 border-y border-white/20 text-white font-semibold">{effectiveQuantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                        className="w-11 h-11 bg-white/5 border border-white/20 rounded-r-xl text-white hover:bg-white/10 transition font-medium"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    {showB2bFull && product.priceTiers && effectiveQuantity >= (product.moq ?? 1) && unitPriceKobo < product.price && (
                      <p className="text-green-400 text-sm mb-4 flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        Bulk pricing applied ✓
                      </p>
                    )}
                  </div>
                )}

                {cartMessage && (
                  <div
                    className={`p-4 rounded-xl text-sm font-medium ${cartMessage.type === 'success'
                      ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                      : 'bg-red-500/10 border border-red-500/30 text-red-400'
                      }`}
                    role="alert"
                  >
                    {cartMessage.text}
                  </div>
                )}

                {/* Action Buttons - full width stack */}
                <div className="space-y-3">
                  {canAddToCart && (
                    <>
                      <button
                        onClick={handleAddToCart}
                        disabled={product.quantity === 0 || addingToCart}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#FF6B00] text-black rounded-xl font-bold text-base hover:bg-[#E65F00] disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {!isAuthenticated ? 'Login to Buy' : addingToCart ? 'Processing...' : product.quantity === 0 ? 'Out of Stock' : 'Buy Now'}
                      </button>
                      <button
                        onClick={handleAddToCart}
                        disabled={product.quantity === 0 || addingToCart}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-transparent text-white border-2 border-white/20 rounded-xl font-semibold hover:border-[#FF6B00]/50 hover:bg-[#FF6B00]/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        Add to Cart
                      </button>
                    </>
                  )}
                  <a
                    href={`/buyer/quote-request?productId=${product.id}&sellerId=${product.seller.id}&quantity=${effectiveQuantity}`}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-transparent text-[#ffcc99] hover:text-[#FF6B00] hover:bg-[#FF6B00]/5 rounded-xl font-medium transition"
                  >
                    <FileText className="w-5 h-5" />
                    Request a Quote
                  </a>
                  <div className="flex gap-4 pt-2">
                    <button
                      onClick={handleToggleWishlist}
                      disabled={wishlistLoading || !isAuthenticated}
                      className="flex items-center gap-2 text-[#ffcc99]/80 hover:text-[#FF6B00] transition disabled:opacity-50"
                      title={inWishlist ? 'Remove from saved list' : 'Save to List'}
                    >
                      <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current text-[#FF6B00]' : ''}`} />
                      <span className="text-sm font-medium">Save to List</span>
                    </button>
                    <ShareButton productId={product.id} productTitle={product.title} variant="ghost" />
                  </div>
                </div>

                {/* Trust Badges Row */}
                <div className="flex flex-wrap gap-6 py-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-sm text-[#ffcc99]/80">
                    <Shield className="w-4 h-4 text-green-400/80 shrink-0" />
                    <span>Buyer Protection</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#ffcc99]/80">
                    <Package className="w-4 h-4 text-[#FF6B00]/80 shrink-0" />
                    <span>Secure Packaging</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#ffcc99]/80">
                    <Check className="w-4 h-4 text-green-400/80 shrink-0" />
                    <span>Easy Returns</span>
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* Full-width Tabs - Product Details | Seller Info | Customer Reviews */}
          {!loading && !error && product && (
            <div className="mt-16 pt-12 border-t border-white/10">
              <div className="flex gap-1 border-b border-white/10 mb-6">
                {(['details', 'seller', 'reviews'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-sm font-medium rounded-t-xl transition ${
                      activeTab === tab
                        ? 'bg-[#1A1A1A] text-[#FF6B00] border border-white/10 border-b-transparent -mb-px'
                        : 'text-[#ffcc99]/70 hover:text-white'
                    }`}
                  >
                    {tab === 'details' && 'Product Details'}
                    {tab === 'seller' && 'Seller Info'}
                    {tab === 'reviews' && 'Customer Reviews'}
                  </button>
                ))}
              </div>

              {/* Tab 1 - Product Details (default) */}
              {activeTab === 'details' && (
                <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {PLACEHOLDER_SPECS.flatMap((obj, idx) =>
                        Object.entries(obj).map(([k, v]) => {
                          const value = k === 'Material' && product.material ? product.material : v;
                          return (
                            <tr key={`${k}-${idx}`} className={idx % 2 === 1 ? 'bg-white/[0.02]' : ''}>
                              <td className="py-3 px-6 text-[#ffcc99]/70 font-medium w-1/3">{k}</td>
                              <td className="py-3 px-6 text-white">{value}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 2 - Seller Info */}
              {activeTab === 'seller' && (
                <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-xl bg-[#FF6B00]/20 flex items-center justify-center">
                      <Store className="w-8 h-8 text-[#FF6B00]" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{product.seller.businessName}</h3>
                      {product.seller?.isVerified !== false && (
                        <span className="inline-flex items-center gap-1 text-green-400 text-sm">
                          <Shield className="w-4 h-4" />
                          Verified Seller
                        </span>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-[#ffcc99]/80">
                        <Star className="w-4 h-4 text-[#FF6B00] fill-[#FF6B00]" />
                        <span>{averageRating.toFixed(1)}</span>
                        <span className="text-sm">· Member since {new Date(product.createdAt).getFullYear()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href={`/buyer/products?seller=${product.seller.id}`}
                      className="px-6 py-3 bg-[#FF6B00] text-black font-bold rounded-xl hover:bg-[#E65F00] transition"
                    >
                      View All Products from {product.seller.businessName}
                    </Link>
                    <a
                      href={`/buyer/quote-request?productId=${product.id}&sellerId=${product.seller.id}`}
                      className="px-6 py-3 border border-white/20 text-white font-semibold rounded-xl hover:border-[#FF6B00]/50 hover:bg-[#FF6B00]/5 transition"
                    >
                      Contact Seller
                    </a>
                  </div>
                </div>
              )}

              {/* Tab 3 - Customer Reviews */}
              {activeTab === 'reviews' && (
                <section id="reviews-section" className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl font-bold text-white">{averageRating.toFixed(1)}</span>
                      <div className="flex flex-col">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-5 h-5 ${s <= Math.round(averageRating) ? 'text-[#FF6B00] fill-[#FF6B00]' : 'text-white/20'}`} />
                          ))}
                        </div>
                        <span className="text-[#ffcc99]/70 text-sm">{reviews.length} reviews</span>
                      </div>
                      {/* Bar chart breakdown - placeholder */}
                      <div className="hidden md:flex flex-col gap-1 ml-6 text-sm">
                        {[5, 4, 3, 2, 1].map((stars) => (
                          <div key={stars} className="flex items-center gap-2 w-32">
                            <span className="text-[#ffcc99]/70 w-8">{stars}★</span>
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#FF6B00] rounded-full"
                                style={{ width: `${stars === 5 ? 70 : stars === 4 ? 20 : 10}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <a
                      href={`/buyer/products/${product.id}?writeReview=1`}
                      className="shrink-0 px-4 py-2 border border-[#FF6B00] text-[#FF6B00] font-semibold rounded-xl hover:bg-[#FF6B00]/10 transition"
                    >
                      Write a Review
                    </a>
                  </div>
                  <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                    {['All', '5★', '4★', '3★', 'Verified Purchases'].map((filter) => (
                      <button
                        key={filter}
                        className="px-4 py-2 rounded-lg border border-white/20 text-[#ffcc99]/90 text-sm font-medium hover:border-[#FF6B00]/50 shrink-0"
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                  {reviewsLoading ? (
                    <div className="py-12 text-center">
                      <div className="w-8 h-8 border-2 border-[#FF6B00]/30 border-t-[#FF6B00] rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-[#ffcc99]/80">Loading reviews...</p>
                    </div>
                  ) : reviewsError ? (
                    <div className="py-8 text-center text-[#ffcc99]/80">{reviewsError}</div>
                  ) : reviews.length === 0 ? (
                    <div className="py-16 text-center">
                      <p className="text-white font-medium">No reviews yet</p>
                      <p className="text-[#ffcc99]/70 text-sm mt-2">Be the first to review this product.</p>
                      <a
                        href={`/buyer/products/${product.id}?writeReview=1`}
                        className="inline-flex mt-4 px-6 py-3 bg-[#FF6B00] text-black font-bold rounded-xl hover:bg-[#E65F00] transition"
                      >
                        Write a Review
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <article key={review.id} className="border border-white/10 rounded-xl p-5" itemScope itemType="https://schema.org/Review">
                          <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center shrink-0">
                              <User className="w-5 h-5 text-[#ffcc99]/60" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <p className="text-white font-medium text-sm" itemProp="author">{review.authorName}</p>
                                <div className="flex items-center gap-1" itemProp="reviewRating" itemScope itemType="https://schema.org/Rating">
                                  <meta itemProp="ratingValue" content={String(review.rating)} />
                                  <meta itemProp="bestRating" content="5" />
                                  {[1, 2, 3, 4, 5].map((starValue) => (
                                    <Star key={starValue} className={`w-4 h-4 shrink-0 ${starValue <= review.rating ? 'text-[#FF6B00] fill-[#FF6B00]' : 'text-white/20'}`} />
                                  ))}
                                </div>
                                <span className="text-[#ffcc99]/50 text-xs">
                                  <time itemProp="datePublished" dateTime={review.createdAt}>
                                    {new Date(review.createdAt).toLocaleDateString('en-NG')}
                                  </time>
                                </span>
                                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Verified</span>
                              </div>
                              <p className="text-[#ffcc99]/90 text-sm leading-relaxed" itemProp="reviewBody">{review.comment}</p>
                              <button className="mt-2 flex items-center gap-1 text-[#ffcc99]/60 hover:text-[#FF6B00] text-xs">
                                <ThumbsUp className="w-4 h-4" />
                                Helpful? (0)
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          )}

          {/* Related Products - You might also like (horizontal scroll, 4-6 cards) */}
          {!loading && !error && product && (
            <RelatedProducts
              productId={product.id}
              title="You might also like"
              horizontalScroll
              className="mt-16 pt-12 border-t border-white/10"
            />
          )}

          {/* Frequently Bought Together - placeholder for future API integration */}
          {!loading && !error && product && (
            <section className="mt-12" aria-label="Frequently bought together">
              <h2 className="text-white text-2xl font-bold mb-6">Frequently Bought Together</h2>
              <p className="text-[#ffcc99]/60 text-sm">Products that customers often buy together will appear here.</p>
            </section>
          )}
        </div>
      </BuyerLayout>
    </>
  );
}
