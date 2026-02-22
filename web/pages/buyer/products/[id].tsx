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
}

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
        showSuccessToast('Removed from wishlist');
      } else {
        await addToWishlist(product.id);
        setInWishlist(true);
        showSuccessToast('Added to wishlist');
      }
    } catch (err: any) {
      console.error('Error toggling wishlist:', err);
      showErrorToast(err.response?.data?.message || 'Failed to update wishlist');
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
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm mb-8 text-[#ffcc99]/80" aria-label="Breadcrumb">
            <Link href="/buyer/categories" className="hover:text-[#ff6600] transition-colors">
              Categories
            </Link>
            <span className="opacity-50">/</span>
            {product?.category && (
              <>
                <Link
                  href={`/buyer/products?category=${product.category}`}
                  className="hover:text-[#ff6600] transition-colors"
                >
                  {getCategoryName(product.category)}
                </Link>
                <span className="opacity-50">/</span>
              </>
            )}
            <span className="text-white truncate max-w-[200px] sm:max-w-none">{product?.title || 'Product'}</span>
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
              {/* Left Column - Images */}
              <div className="lg:sticky lg:top-24 lg:self-start">
                {/* Main Image */}
                <div className="bg-[#0d0d0d] rounded-2xl overflow-hidden mb-4 aspect-square relative ring-1 ring-white/5">
                  {product.images && product.images.length > 0 ? (
                    <>
                      <Image
                        src={product.images[selectedImageIndex]}
                        alt={product.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                        itemProp="image"
                        priority
                      />
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
                          <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white/90 text-xs font-medium rounded-lg">
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

                {/* Thumbnail Images */}
                {product.images && product.images.length > 1 && (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {product.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedImageIndex === index
                          ? 'border-[#ff6600] ring-2 ring-[#ff6600]/30'
                          : 'border-white/10 hover:border-[#ff6600]/50 opacity-80 hover:opacity-100'
                          }`}
                        aria-label={`View image ${index + 1}`}
                      >
                        <Image src={image} alt={`${product.title} ${index + 1}`} fill sizes="120px" className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column - Product Info */}
              <div className="space-y-6">
                {/* Category & Title Block */}
                <div>
                  {product.category && (
                    <span className="inline-block px-3 py-1.5 bg-[#ff6600]/15 text-[#ff6600] rounded-lg text-sm font-medium mb-4">
                      {getCategoryName(product.category)}
                    </span>
                  )}
                  <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight tracking-tight" itemProp="name">
                    {product.title}
                  </h1>
                  {product.keyFeatures && product.keyFeatures.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {product.keyFeatures.map((feature, index) => (
                        <span
                          key={index}
                          className="px-2.5 py-1 bg-white/5 text-[#ffcc99]/90 rounded-lg text-sm"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Seller & Rating Row */}
                <div className="flex flex-wrap items-center gap-4 py-3 border-y border-white/10">
                  <div className="flex items-center gap-2" itemProp="brand" itemScope itemType="https://schema.org/Brand">
                    <div className="w-8 h-8 rounded-lg bg-[#ff6600]/20 flex items-center justify-center">
                      <Store className="w-4 h-4 text-[#ff6600]" />
                    </div>
                    <span className="text-white font-medium">{product.seller.businessName}</span>
                  </div>
                  <div className="flex items-center gap-1.5" itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
                    <Star className="w-4 h-4 text-[#ff6600] fill-[#ff6600]" />
                    <span className="text-white font-semibold" itemProp="ratingValue">{averageRating.toFixed(1)}</span>
                    <span className="text-[#ffcc99]/70 text-sm">({reviews.length} reviews)</span>
                    <meta itemProp="reviewCount" content={String(reviews.length || 1)} />
                  </div>
                  <div className="flex items-center gap-1.5 text-green-400/90 text-sm">
                    <Shield className="w-4 h-4 shrink-0" />
                    <span>Fulfilled by Carryofy • Same-Day Delivery Lagos</span>
                  </div>
                </div>

                {/* Price Card - Prominent */}
                <div className="p-6 bg-gradient-to-br from-[#1a1a1a] to-[#141414] border border-[#ff6600]/20 rounded-2xl" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                  {showB2bFull && product.requestQuoteOnly ? (
                    <p className="text-[#ff6600] text-2xl font-bold">Price on quote</p>
                  ) : showB2bFull && product.priceTiers?.length ? (
                    <div className="space-y-1">
                      <p className="text-[#ff6600] text-2xl font-bold">Unit: {formatPrice(unitPriceKobo)}</p>
                      <p className="text-[#ffcc99]/80">Total ({effectiveQuantity}): {formatPrice(totalPriceKobo)}</p>
                    </div>
                  ) : (
                    <p className="text-[#ff6600] text-3xl sm:text-4xl font-bold" itemProp="price" content={String(product.price / 100)}>
                      {formatPrice(product.price)}
                    </p>
                  )}
                  <meta itemProp="priceCurrency" content="NGN" />
                  <link itemProp="availability" href={product.quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'} />
                  {product.quantity > 0 ? (
                    <div className="mt-4 flex items-center gap-2 text-green-400/90 text-sm">
                      <Package className="w-4 h-4 shrink-0" />
                      <span>{product.quantity} units in stock</span>
                    </div>
                  ) : (
                    <p className="mt-4 text-red-400/90 text-sm font-medium">Out of stock</p>
                  )}
                </div>

                {/* Description - Collapsible feel, always visible but concise */}
                {product.description && (
                  <div>
                    <h3 className="text-white font-semibold mb-2">About this product</h3>
                    <p className="text-[#ffcc99]/90 text-base leading-relaxed whitespace-pre-wrap" itemProp="description">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Material & Care Information */}
                {(product.material || product.careInfo) && (
                  <div className="space-y-4">
                    {product.material && (
                      <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#ff6600]/15 flex items-center justify-center shrink-0">
                            <Droplets className="w-5 h-5 text-[#ff6600]" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold mb-1">Materials</h3>
                            <p className="text-[#ffcc99]/80 text-sm leading-relaxed whitespace-pre-wrap">{product.material}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {product.careInfo && (
                      <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#ff6600]/15 flex items-center justify-center shrink-0">
                            <Info className="w-5 h-5 text-[#ff6600]" />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold mb-1">Care Instructions</h3>
                            <p className="text-[#ffcc99]/80 text-sm leading-relaxed whitespace-pre-wrap">{product.careInfo}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* B2B info */}
                {showB2bFull && (
                  <div className="p-5 bg-white/[0.03] border border-white/10 rounded-xl">
                    <p className="text-[#ffcc99]/80 text-xs font-semibold uppercase tracking-wider mb-3">B2B / Bulk</p>
                    <div className="flex flex-wrap gap-4 text-sm mb-4">
                      {(product.moq ?? 0) > 0 && (
                        <span className="text-white">MOQ: <strong>{product.moq}</strong></span>
                      )}
                      {(product.leadTimeDays ?? 0) > 0 && (
                        <span className="text-white">Lead time: <strong>{product.leadTimeDays} days</strong></span>
                      )}
                      {product.b2bProductType && (
                        <span className="px-2 py-1 bg-[#ff6600]/15 text-[#ffcc99] rounded-lg text-xs">{product.b2bProductType.replace(/_/g, ' ')}</span>
                      )}
                    </div>
                    {product.priceTiers && product.priceTiers.length > 0 && !product.requestQuoteOnly && (
                      <div className="overflow-x-auto -mx-1">
                        <table className="w-full text-sm text-left">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="py-2 pr-4 text-[#ffcc99]/70 font-medium">Quantity</th>
                              <th className="py-2 text-[#ffcc99]/70 font-medium">Unit price</th>
                            </tr>
                          </thead>
                          <tbody className="text-white">
                            {[...(product.priceTiers || [])]
                              .sort((a, b) => a.minQuantity - b.minQuantity)
                              .map((t, i) => (
                                <tr key={i} className="border-b border-white/5">
                                  <td className="py-2 pr-4">{t.minQuantity} – {t.maxQuantity >= 999999 ? '∞' : t.maxQuantity}</td>
                                  <td className="py-2">{formatPrice(t.priceKobo)}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Quantity & Actions */}
                {product.quantity > 0 && (
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="text-white text-sm font-medium">Quantity{minQuantity > 1 ? ` (min ${minQuantity})` : ''}</label>
                    <div className="flex items-center">
                      <button
                        onClick={() => setQuantity(Math.max(minQuantity, quantity - 1))}
                        className="w-11 h-11 bg-white/5 border border-white/20 rounded-l-xl text-white hover:bg-white/10 transition"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-14 h-11 flex items-center justify-center bg-white/5 border-y border-white/20 text-white font-semibold">{effectiveQuantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                        className="w-11 h-11 bg-white/5 border border-white/20 rounded-r-xl text-white hover:bg-white/10 transition"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
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

                {/* Action Buttons */}
                <div className="space-y-3">
                  {showB2bFull && (
                    <a
                      href={`/buyer/quote-request?productId=${product.id}&sellerId=${product.seller.id}&quantity=${effectiveQuantity}`}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-transparent text-[#ff6600] border-2 border-[#ff6600] rounded-xl font-semibold hover:bg-[#ff6600]/10 transition"
                    >
                      <FileText className="w-5 h-5" />
                      Request a Quote
                    </a>
                  )}
                  {canAddToCart && (
                    <>
                      <button
                        onClick={handleAddToCart}
                        disabled={product.quantity === 0 || addingToCart}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#ff6600] text-black rounded-xl font-semibold text-base hover:bg-[#e65c00] disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <TrendingUp className="w-5 h-5" />
                        {!isAuthenticated
                          ? 'Login to Buy'
                          : addingToCart
                            ? 'Processing...'
                            : product.quantity === 0
                              ? 'Out of Stock'
                              : 'Buy Now'
                        }
                      </button>
                      <div className="flex gap-3">
                        <button
                          onClick={handleAddToCart}
                          disabled={product.quantity === 0 || addingToCart}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white/5 text-white border border-white/20 rounded-xl font-medium hover:bg-white/10 hover:border-[#ff6600]/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ShoppingCart className="w-5 h-5" />
                          {!isAuthenticated ? 'Login to Add' : addingToCart ? 'Adding...' : product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                        <button
                          onClick={handleToggleWishlist}
                          disabled={wishlistLoading || !isAuthenticated}
                          className={`p-3.5 border rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed ${inWishlist
                            ? 'bg-[#ff6600]/20 border-[#ff6600] text-[#ff6600]'
                            : 'bg-white/5 border-white/20 text-white hover:border-[#ff6600]/50 hover:bg-[#ff6600]/10'
                            }`}
                          title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                        >
                          <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </>
                  )}
                  {product.status === 'ACTIVE' && (
                    <ShareButton productId={product.id} productTitle={product.title} className="w-full" />
                  )}
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap gap-6 py-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-sm text-[#ffcc99]/80">
                    <Shield className="w-4 h-4 text-green-400/80 shrink-0" />
                    <span>Buyer Protection</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#ffcc99]/80">
                    <Package className="w-4 h-4 text-[#ff6600]/80 shrink-0" />
                    <span>Secure Packaging</span>
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* Related Products - lazy loaded, non-blocking */}
          {!loading && !error && product && (
            <RelatedProducts productId={product.id} />
          )}

          {/* Reviews Section */}
          {!loading && !error && product && (
            <section className="mt-16 pt-12 border-t border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h2 className="text-white text-2xl font-bold">Customer Reviews</h2>
                <p className="text-[#ffcc99]/70 text-sm">
                  {reviews.length > 0
                    ? `${reviews.length} review${reviews.length === 1 ? '' : 's'} from Carryofy buyers`
                    : 'No reviews yet. Be the first to share your experience!'}
                </p>
              </div>

              {reviewsLoading ? (
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-12 text-center">
                  <div className="w-8 h-8 border-2 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-[#ffcc99]/80">Loading reviews...</p>
                </div>
              ) : reviewsError ? (
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center text-[#ffcc99]/80">
                  {reviewsError}
                </div>
              ) : reviews.length === 0 ? (
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-12 text-center">
                  <p className="text-white font-medium">No buyer reviews yet</p>
                  <p className="text-[#ffcc99]/70 text-sm mt-1 max-w-sm mx-auto">
                    Once buyers confirm delivery and share feedback, you&apos;ll see their thoughts here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <article key={review.id} className="bg-white/[0.03] border border-white/10 rounded-xl p-5 sm:p-6" itemScope itemType="https://schema.org/Review">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#ff6600]/20 flex items-center justify-center shrink-0">
                          <span className="text-[#ff6600] font-semibold text-sm">
                            {review.authorName.slice(0, 1).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                            <p className="text-white font-medium text-sm" itemProp="author">{review.authorName}</p>
                            <div className="flex items-center gap-1" itemProp="reviewRating" itemScope itemType="https://schema.org/Rating">
                              <meta itemProp="ratingValue" content={String(review.rating)} />
                              <meta itemProp="bestRating" content="5" />
                              {[1, 2, 3, 4, 5].map((starValue) => (
                                <Star
                                  key={starValue}
                                  className={`w-4 h-4 shrink-0 ${starValue <= review.rating ? 'text-[#ff6600] fill-[#ff6600]' : 'text-white/20'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-[#ffcc99]/60 text-xs mb-2">
                            <time itemProp="datePublished" dateTime={review.createdAt}>
                              {new Date(review.createdAt).toLocaleDateString('en-NG')}
                            </time>
                          </p>
                          <p className="text-[#ffcc99]/90 text-sm leading-relaxed" itemProp="reviewBody">{review.comment}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </BuyerLayout>
    </>
  );
}
