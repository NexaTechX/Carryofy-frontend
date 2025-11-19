import Head from 'next/head';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
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
  ArrowRight,
  Package,
} from 'lucide-react';
import { tokenManager, userManager } from '../../../lib/auth';

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  images: string[];
  quantity: number;
  category?: string;
  seller: {
    id: string;
    businessName: string;
  };
  createdAt: string;
  updatedAt: string;
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

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [mounted, setMounted] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Check authentication
    if (!tokenManager.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    const user = userManager.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role && user.role !== 'BUYER' && user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    if (mounted && id) {
      fetchProduct();
    }
  }, [mounted, id]);

  const fetchReviews = useCallback(async (productId: string) => {
    try {
      setReviewsLoading(true);
      setReviewsError(null);
      const response = await apiClient.get<Review[]>(`/products/${productId}/reviews`);
      // Handle both possible response structures (wrapped or direct)
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
      // Handle both possible response structures (wrapped or direct)
      const productData = (response.data as any).data || response.data;
      setProduct(productData);
      fetchReviews(productData.id);
    } catch (err: any) {
      console.error('Error fetching product:', err);
      setError(err.response?.data?.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      setAddingToCart(true);
      setCartMessage(null);

      await apiClient.post('/cart/items', {
        productId: product.id,
        quantity: quantity,
      });

      setCartMessage({ type: 'success', text: 'Product added to cart successfully!' });
      setTimeout(() => {
        setCartMessage(null);
        // Optionally redirect to cart
        // router.push('/buyer/cart');
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

  const formatPrice = (priceInKobo: number) => {
    return `₦${(priceInKobo / 100).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getCategoryName = (categoryId?: string) => {
    const categoryMap: { [key: string]: string } = {
      grains: 'Grains',
      oils: 'Oils',
      packaged: 'Packaged Foods',
      spices: 'Spices',
      beverages: 'Beverages',
      'personal-care': 'Personal Care',
    };
    return categoryId ? categoryMap[categoryId] || categoryId : 'Uncategorized';
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{product?.title || 'Product'} - Buyer | Carryofy</title>
        <meta
          name="description"
          content={product?.description || 'View product details on Carryofy.'}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <BuyerLayout>
        <div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm mb-6">
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
          </div>

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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                <h1 className="text-white text-3xl md:text-4xl font-bold mb-4 leading-tight">{product.title}</h1>

                {/* Description */}
                {product.description && (
                  <div className="mb-6">
                    <p className="text-[#ffcc99] text-lg leading-relaxed whitespace-pre-wrap">{product.description}</p>
                  </div>
                )}

                {/* Seller Info with Rating */}
                <div className="mb-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-[#ffcc99]" />
                    <span className="text-[#ffcc99] text-sm">Seller:</span>
                    <span className="text-white font-medium">{product.seller.businessName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[#ffcc99] text-sm">Rating:</span>
                      <span className="text-white font-bold">4.8</span>
                      <Star className="w-4 h-4 text-[#ff6600] fill-[#ff6600]" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-medium text-sm">Fulfilled by Carryofy</span>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6 p-6 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl">
                  <p className="text-[#ffcc99] text-sm mb-2">Price</p>
                  <p className="text-[#ff6600] text-4xl font-bold">{formatPrice(product.price)}</p>
                  {product.quantity > 0 ? (
                    <div className="mt-3 flex items-center gap-2">
                      <Package className="w-4 h-4 text-green-400" />
                      <p className="text-green-400 text-sm font-medium">{product.quantity} units in stock</p>
                    </div>
                  ) : (
                    <p className="mt-3 text-red-400 text-sm font-medium">Out of stock</p>
                  )}
                </div>

                {/* Quantity Selector */}
                {product.quantity > 0 && (
                  <div className="mb-6">
                    <label className="block text-white text-sm font-medium mb-2">Quantity</label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white hover:border-[#ff6600] transition"
                      >
                        -
                      </button>
                      <span className="text-white text-xl font-bold w-12 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                        className="w-10 h-10 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white hover:border-[#ff6600] transition"
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
                  >
                    {cartMessage.text}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Buy Now Button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={product.quantity === 0 || addingToCart}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#ff6600] text-black rounded-xl font-bold text-lg hover:bg-[#cc5200] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-[#ff6600]/30"
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span>{addingToCart ? 'Processing...' : product.quantity === 0 ? 'Out of Stock' : 'Buy Now'}</span>
                  </button>
                  
                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={product.quantity === 0 || addingToCart}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#1a1a1a] text-white border-2 border-[#ff6600]/50 rounded-xl font-bold hover:bg-[#ff6600]/10 hover:border-[#ff6600] disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>{addingToCart ? 'Adding...' : product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                  </button>
                </div>

                {/* Additional Info */}
                <div className="mt-6 pt-6 border-t border-[#ff6600]/30">
                  <p className="text-[#ffcc99]/70 text-sm">
                    Product ID: <span className="text-[#ffcc99]">{product.id}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reviews Section */}
          {!loading && !error && product && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-3xl font-bold">Reviews</h2>
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
                    <div key={review.id} className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#ff6600]/10 border border-[#ff6600]/40 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-lg">
                            {review.authorName.slice(0, 1).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-semibold text-sm">{review.authorName}</p>
                              <p className="text-[#ffcc99]/60 text-xs">{new Date(review.createdAt).toLocaleDateString('en-NG')}</p>
                            </div>
                            <div className="flex items-center gap-1">
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
                          <p className="text-[#ffcc99]/80 text-sm leading-relaxed">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </BuyerLayout>
    </>
  );
}

