import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
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
import { tokenManager, userManager } from '../../../lib/auth';
import SEO from '../../../components/seo/SEO';
import { ProductSchema, BreadcrumbSchema } from '../../../components/seo/JsonLd';
import { addToWishlist, removeFromWishlist, checkWishlist } from '../../../lib/api/wishlist';
import { showSuccessToast, showErrorToast } from '../../../lib/ui/toast';

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
  const [hasBusinessProfile, setHasBusinessProfile] = useState<boolean | null>(null);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check authentication
    const authenticated = tokenManager.isAuthenticated();
    setIsAuthenticated(authenticated);

    if (!authenticated) {
      setHasBusinessProfile(false);
      return;
    }

    const user = userManager.getUser();
    if (user && user.role && user.role !== 'BUYER' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    // Fetch full profile to check business buyer status
    if (authenticated) {
      apiClient.get('/users/me')
        .then((res) => {
          const data = (res.data as any)?.data ?? res.data;
          setHasBusinessProfile(!!data?.businessBuyerProfile);
        })
        .catch(() => setHasBusinessProfile(false));
    }
  }, [router]);

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

  useEffect(() => {
    const b2b = product?.sellingMode === 'B2B_ONLY' || product?.sellingMode === 'B2C_AND_B2B';
    if (product && b2b && (product.moq ?? 0) > 0 && quantity < product.moq!) {
      setQuantity(product.moq!);
    }
  }, [product?.id, product?.moq, product?.sellingMode, quantity]);

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

    try {
      setAddingToCart(true);
      setCartMessage(null);

      await apiClient.post('/cart/items', {
        productId: product.id,
        quantity: effectiveQuantity,
      });

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
  const showB2bFull = isB2bEnabled && (hasBusinessProfile === true);
  const showB2bCta = isB2bEnabled && hasBusinessProfile === false && isAuthenticated;
  // Consumers can add to cart only for B2C_AND_B2B (B2C path). B2B_ONLY has no consumer purchase path.
  const canAddToCart = isB2bOnly
    ? showB2bFull && !product?.requestQuoteOnly  // B2B_ONLY: only business buyers, and only if not quote-only
    : !(showB2bFull && product?.requestQuoteOnly);  // B2C_AND_B2B: show unless business + quote-only
  const minQuantity = product && isB2bEnabled && (product.moq ?? 0) > 0 ? product.moq! : 1;
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
  const unitPriceKobo = product ? resolveUnitPriceKobo(product, effectiveQuantity) : 0;
  const totalPriceKobo = product ? unitPriceKobo * effectiveQuantity : 0;

  const getCategoryName = (categoryId?: string) => {
    const categoryMap: { [key: string]: string } = {
      grains: 'Grains',
      oils: 'Oils',
      packaged: 'Packaged Foods',
      spices: 'Spices',
      beverages: 'Beverages',
      'personal-care': 'Personal Care',
      electronics: 'Electronics',
      fashion: 'Fashion',
      home: 'Home & Living',
    };
    return categoryId ? categoryMap[categoryId] || categoryId : 'Uncategorized';
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
        <div>
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm mb-6" aria-label="Breadcrumb">
            <Link href="/buyer/categories" className="text-[#ffcc99] hover:text-[#ff6600] transition">
              Categories
            </Link>
            <span className="text-[#ffcc99]/50">/</span>
            {product?.category && (
              <>
                <Link 
                  href={`/buyer/products?category=${product.category}`} 
                  className="text-[#ffcc99] hover:text-[#ff6600] transition"
                >
                  {getCategoryName(product.category)}
                </Link>
                <span className="text-[#ffcc99]/50">/</span>
              </>
            )}
            <span className="text-white">{product?.title || 'Product'}</span>
          </nav>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6600]"></div>
              <p className="text-[#ffcc99] mt-4">Loading product...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchProduct}
                className="px-6 py-2 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Product Details */}
          {!loading && !error && product && (
            <article className="grid grid-cols-1 lg:grid-cols-2 gap-8" itemScope itemType="https://schema.org/Product">
              {/* Left Column - Images */}
              <div>
                {/* Main Image */}
                <div className="bg-black rounded-xl overflow-hidden mb-4 aspect-square relative">
                  {product.images && product.images.length > 0 ? (
                    <>
                      <img
                        src={product.images[selectedImageIndex]}
                        alt={product.title}
                        className="w-full h-full object-cover"
                        itemProp="image"
                      />
                      {product.images.length > 1 && (
                        <>
                          <button
                            onClick={() =>
                              setSelectedImageIndex((prev) =>
                                prev === 0 ? product.images.length - 1 : prev - 1
                              )
                            }
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/75 text-white rounded-full transition"
                            aria-label="Previous image"
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </button>
                          <button
                            onClick={() =>
                              setSelectedImageIndex((prev) =>
                                prev === product.images.length - 1 ? 0 : prev + 1
                              )
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/75 text-white rounded-full transition"
                            aria-label="Next image"
                          >
                            <ChevronRight className="w-6 h-6" />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#ffcc99]">
                      No Image Available
                    </div>
                  )}
                </div>

                {/* Thumbnail Images */}
                {product.images && product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition ${
                          selectedImageIndex === index
                            ? 'border-[#ff6600]'
                            : 'border-[#ff6600]/30 hover:border-[#ff6600]/70'
                        }`}
                        aria-label={`View image ${index + 1}`}
                      >
                        <img src={image} alt={`${product.title} ${index + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column - Product Info */}
              <div>
                {/* Category Badge */}
                {product.category && (
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-[#ff6600]/20 text-[#ff6600] rounded-full text-sm font-medium">
                      {getCategoryName(product.category)}
                    </span>
                  </div>
                )}

                {/* Product Title */}
                <h1 className="text-white text-3xl md:text-4xl font-bold mb-4 leading-tight" itemProp="name">
                  {product.title}
                </h1>

                {/* Key Features */}
                {product.keyFeatures && product.keyFeatures.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.keyFeatures.map((feature, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[#ff6600]/20 text-[#ff6600] rounded-full text-sm font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                {product.description && (
                  <div className="mb-6">
                    <p className="text-[#ffcc99] text-lg leading-relaxed whitespace-pre-wrap" itemProp="description">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Material & Care Information */}
                {(product.material || product.careInfo) && (
                  <div className="mb-6 space-y-4">
                    {/* Material Information */}
                    {product.material && (
                      <div className="p-4 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-[#ff6600]/20 rounded-lg flex items-center justify-center shrink-0">
                            <Droplets className="w-5 h-5 text-[#ff6600]" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-semibold mb-2">Materials & Composition</h3>
                            <p className="text-[#ffcc99] text-sm leading-relaxed whitespace-pre-wrap">
                              {product.material}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Care Instructions */}
                    {product.careInfo && (
                      <div className="p-4 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-[#ff6600]/20 rounded-lg flex items-center justify-center shrink-0">
                            <Info className="w-5 h-5 text-[#ff6600]" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-semibold mb-2">Care Instructions</h3>
                            <p className="text-[#ffcc99] text-sm leading-relaxed whitespace-pre-wrap">
                              {product.careInfo}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Seller Info with Rating */}
                <div className="mb-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-[#ffcc99]" />
                    <span className="text-[#ffcc99] text-sm">Seller:</span>
                    <span className="text-white font-medium" itemProp="brand">{product.seller.businessName}</span>
                  </div>
                  <div className="flex items-center gap-2" itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
                    <div className="flex items-center gap-1">
                      <span className="text-[#ffcc99] text-sm">Rating:</span>
                      <span className="text-white font-bold" itemProp="ratingValue">{averageRating.toFixed(1)}</span>
                      <Star className="w-4 h-4 text-[#ff6600] fill-[#ff6600]" />
                      <meta itemProp="reviewCount" content={String(reviews.length || 1)} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-medium text-sm">Fulfilled by Carryofy • Same-Day Delivery Lagos</span>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6 p-6 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                  <p className="text-[#ffcc99] text-sm mb-2">Price</p>
                  {showB2bFull && product.requestQuoteOnly ? (
                    <p className="text-[#ff6600] text-xl font-bold">Price on quote</p>
                  ) : showB2bFull && product.priceTiers?.length ? (
                    <>
                      <p className="text-[#ff6600] text-2xl font-bold">Unit: {formatPrice(unitPriceKobo)}</p>
                      <p className="text-[#ffcc99] text-lg mt-1">Total ({effectiveQuantity}): {formatPrice(totalPriceKobo)}</p>
                    </>
                  ) : (
                    <p className="text-[#ff6600] text-4xl font-bold" itemProp="price" content={String(product.price / 100)}>
                      {formatPrice(product.price)}
                    </p>
                  )}
                  <meta itemProp="priceCurrency" content="NGN" />
                  <link itemProp="availability" href={product.quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'} />
                  {product.quantity > 0 ? (
                    <div className="mt-3 flex items-center gap-2">
                      <Package className="w-4 h-4 text-green-400" />
                      <p className="text-green-400 text-sm font-medium">{product.quantity} units in stock</p>
                    </div>
                  ) : (
                    <p className="mt-3 text-red-400 text-sm font-medium">Out of stock</p>
                  )}
                </div>

                {/* B2B info (MOQ, lead time, type, tier table) - full view for business buyers */}
                {showB2bFull && (
                  <div className="mb-6 p-6 bg-[#1a1a1a] border border-[#ff6600]/20 rounded-xl">
                    <p className="text-[#ffcc99] text-sm font-bold mb-3">B2B / Bulk</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {(product.moq ?? 0) > 0 && (
                        <span className="text-white">MOQ: <strong>{product.moq}</strong></span>
                      )}
                      {(product.leadTimeDays ?? 0) > 0 && (
                        <span className="text-white">Lead time: <strong>{product.leadTimeDays} days</strong></span>
                      )}
                      {product.b2bProductType && (
                        <span className="px-2 py-0.5 bg-[#ff6600]/20 text-[#ffcc99] rounded">{product.b2bProductType.replace(/_/g, ' ')}</span>
                      )}
                    </div>
                    {product.priceTiers && product.priceTiers.length > 0 && !product.requestQuoteOnly && (
                      <div className="mt-4">
                        <p className="text-[#ffcc99] text-xs mb-2">Tiered pricing</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left text-white">
                            <thead>
                              <tr className="border-b border-[#ff6600]/30">
                                <th className="py-2 pr-4">Quantity</th>
                                <th className="py-2">Unit price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...(product.priceTiers || [])]
                                .sort((a, b) => a.minQuantity - b.minQuantity)
                                .map((t, i) => (
                                  <tr key={i} className="border-b border-white/10">
                                    <td className="py-2 pr-4">{t.minQuantity} – {t.maxQuantity >= 999999 ? '∞' : t.maxQuantity}</td>
                                    <td className="py-2">{formatPrice(t.priceKobo)}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* CTA for consumers when product has B2B - register as business to see bulk pricing */}
                {showB2bCta && (
                  <div className="mb-6 p-6 bg-[#1a1a1a] border border-[#ff6600]/20 rounded-xl">
                    <p className="text-[#ffcc99] text-sm font-bold mb-2">Bulk pricing available</p>
                    <p className="text-white text-sm mb-4">Register as a business buyer to see MOQ, tiered pricing, and request custom quotes.</p>
                    <Link
                      href="/buyer/profile#business"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff6600]/20 border border-[#ff6600] text-[#ff6600] rounded-xl font-medium hover:bg-[#ff6600]/30 transition"
                    >
                      <FileText className="w-4 h-4" />
                      Register as business buyer
                    </Link>
                  </div>
                )}

                {/* Quantity Selector */}
                {product.quantity > 0 && (
                  <div className="mb-6">
                    <label className="block text-white text-sm font-medium mb-2">Quantity{minQuantity > 1 ? ` (min ${minQuantity})` : ''}</label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setQuantity(Math.max(minQuantity, quantity - 1))}
                        className="w-10 h-10 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white hover:border-[#ff6600] transition"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="text-white text-xl font-bold w-12 text-center">{effectiveQuantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                        className="w-10 h-10 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white hover:border-[#ff6600] transition"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Cart Message */}
                {cartMessage && (
                  <div
                    className={`mb-4 p-4 rounded-xl ${
                      cartMessage.type === 'success'
                        ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                        : 'bg-red-500/10 border border-red-500/50 text-red-400'
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
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#1a1a1a] text-[#ff6600] border-2 border-[#ff6600] rounded-xl font-bold hover:bg-[#ff6600]/10 transition"
                    >
                      <FileText className="w-5 h-5" />
                      Request a Quote
                    </a>
                  )}
                  {canAddToCart && (
                    <>
                      {/* Buy Now Button */}
                      <button
                        onClick={handleAddToCart}
                        disabled={product.quantity === 0 || addingToCart}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#ff6600] text-black rounded-xl font-bold text-lg hover:bg-[#cc5200] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-[#ff6600]/30"
                      >
                        <TrendingUp className="w-5 h-5" />
                        <span>
                          {!isAuthenticated 
                            ? 'Login to Buy' 
                            : addingToCart 
                              ? 'Processing...' 
                              : product.quantity === 0 
                                ? 'Out of Stock' 
                                : 'Buy Now'
                          }
                        </span>
                      </button>
                      
                      <div className="flex gap-3">
                        {/* Add to Cart Button */}
                        <button
                          onClick={handleAddToCart}
                          disabled={product.quantity === 0 || addingToCart}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#1a1a1a] text-white border-2 border-[#ff6600]/50 rounded-xl font-bold hover:bg-[#ff6600]/10 hover:border-[#ff6600] disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <ShoppingCart className="w-5 h-5" />
                          <span>
                            {!isAuthenticated 
                              ? 'Login to Add to Cart' 
                              : addingToCart 
                                ? 'Adding...' 
                                : product.quantity === 0 
                                  ? 'Out of Stock' 
                                  : 'Add to Cart'
                            }
                          </span>
                        </button>
                    
                    {/* Wishlist Button */}
                    <button
                      onClick={handleToggleWishlist}
                      disabled={wishlistLoading || !isAuthenticated}
                      className={`px-6 py-4 border-2 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                        inWishlist
                          ? 'bg-[#ff6600]/20 border-[#ff6600] text-[#ff6600]'
                          : 'bg-[#1a1a1a] border-[#ff6600]/50 text-white hover:bg-[#ff6600]/10 hover:border-[#ff6600]'
                      }`}
                      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                    </>
                  )}
                </div>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t border-[#ff6600]/30 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm text-[#ffcc99]">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span>Buyer Protection</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#ffcc99]">
                    <Package className="w-4 h-4 text-[#ff6600]" />
                    <span>Secure Packaging</span>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-4">
                  <p className="text-[#ffcc99]/70 text-sm">
                    Product ID: <span className="text-[#ffcc99]">{product.id}</span>
                  </p>
                </div>
              </div>
            </article>
          )}

          {/* Reviews Section */}
          {!loading && !error && product && (
            <section className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-3xl font-bold">Customer Reviews</h2>
                <p className="text-[#ffcc99]/70 text-sm">
                  {reviews.length > 0
                    ? `${reviews.length} review${reviews.length === 1 ? '' : 's'} from Carryofy buyers`
                    : 'No reviews yet. Be the first to share your experience!'}
                </p>
              </div>

              {reviewsLoading ? (
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-2xl p-10 text-center text-[#ffcc99]/80">
                  Loading reviews...
                </div>
              ) : reviewsError ? (
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-2xl p-10 text-center text-[#ffcc99]/80">
                  {reviewsError}
                </div>
              ) : reviews.length === 0 ? (
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-2xl p-10 text-center text-[#ffcc99]/80">
                  <p className="text-lg font-medium">No buyer reviews yet</p>
                  <p className="text-sm mt-2">
                    Once buyers confirm delivery and share feedback, you&apos;ll see their thoughts here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <article key={review.id} className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6" itemScope itemType="https://schema.org/Review">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#ff6600]/10 border border-[#ff6600]/40 flex items-center justify-center shrink-0">
                          <span className="text-white font-semibold text-lg">
                            {review.authorName.slice(0, 1).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-semibold text-sm" itemProp="author">{review.authorName}</p>
                              <p className="text-[#ffcc99]/60 text-xs">
                                <time itemProp="datePublished" dateTime={review.createdAt}>
                                  {new Date(review.createdAt).toLocaleDateString('en-NG')}
                                </time>
                              </p>
                            </div>
                            <div className="flex items-center gap-1" itemProp="reviewRating" itemScope itemType="https://schema.org/Rating">
                              <meta itemProp="ratingValue" content={String(review.rating)} />
                              <meta itemProp="bestRating" content="5" />
                              {[1, 2, 3, 4, 5].map((starValue) => (
                                <Star
                                  key={starValue}
                                  className={`w-4 h-4 ${
                                    starValue <= review.rating ? 'text-[#ff6600] fill-[#ff6600]' : 'text-[#ffcc99]/30'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-[#ffcc99]/80 text-sm leading-relaxed" itemProp="reviewBody">{review.comment}</p>
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
