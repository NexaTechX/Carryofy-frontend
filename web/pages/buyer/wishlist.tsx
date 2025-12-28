import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import { Heart, ShoppingCart, Trash2, Package, ShoppingBag } from 'lucide-react';
import { getWishlist, removeFromWishlist, WishlistItem } from '../../lib/api/wishlist';
import apiClient from '../../lib/api/client';
import { showSuccessToast, showErrorToast } from '../../lib/ui/toast';

export default function WishlistPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingItems, setRemovingItems] = useState<{ [key: string]: boolean }>({});

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
    if (mounted) {
      fetchWishlist();
    }
  }, [mounted]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getWishlist();
      setWishlist(response.items || []);
    } catch (err: any) {
      console.error('Error fetching wishlist:', err);
      
      // Provide helpful error messages based on status code
      if (err.response?.status === 500) {
        setError(
          'Server error: The wishlist service is unavailable. ' +
          'This may indicate a database issue. Please check backend logs.'
        );
      } else if (err.response?.status === 401) {
        setError('Please log in to view your wishlist');
      } else {
        setError(err.response?.data?.message || 'Failed to load wishlist. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      setRemovingItems(prev => ({ ...prev, [productId]: true }));
      await removeFromWishlist(productId);
      setWishlist(prev => prev.filter(item => item.productId !== productId));
      showSuccessToast('Removed from wishlist');
    } catch (err: any) {
      console.error('Error removing from wishlist:', err);
      showErrorToast(err.response?.data?.message || 'Failed to remove from wishlist');
    } finally {
      setRemovingItems(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await apiClient.post('/cart/items', {
        productId,
        quantity: 1,
      });
      showSuccessToast('Product added to cart!');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err: any) {
      console.error('Error adding to cart:', err);
      showErrorToast(err.response?.data?.message || 'Failed to add product to cart');
    }
  };

  const formatPrice = (priceInKobo: number) => {
    return `₦${(priceInKobo / 100).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>My Wishlist - Buyer | Carryofy</title>
        <meta
          name="description"
          content="View and manage your saved products on Carryofy."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <BuyerLayout>
        <div>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <Heart className="w-8 h-8 text-[#ff6600]" />
              My Wishlist
            </h1>
            <p className="text-[#ffcc99] text-lg">
              {wishlist.length > 0 
                ? `${wishlist.length} saved product${wishlist.length > 1 ? 's' : ''}` 
                : 'Your saved products will appear here'}
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6600]"></div>
              <p className="text-[#ffcc99] mt-4">Loading wishlist...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchWishlist}
                className="px-6 py-2 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Wishlist Content */}
          {!loading && !error && (
            <>
              {wishlist.length === 0 ? (
                // Empty Wishlist State
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-2xl p-12 text-center">
                  <Heart className="w-20 h-20 text-[#ffcc99]/50 mx-auto mb-4" />
                  <h2 className="text-white text-2xl font-bold mb-2">Your wishlist is empty</h2>
                  <p className="text-[#ffcc99] mb-6">
                    Start saving products you love for later!
                  </p>
                  <Link
                    href="/buyer/products"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Browse Products
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlist.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl overflow-hidden hover:border-[#ff6600] transition"
                    >
                      {/* Product Image */}
                      <Link href={`/buyer/products/${item.product.id}`}>
                        <div className="relative aspect-square bg-black">
                          {item.product.images && item.product.images.length > 0 ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#ffcc99]">
                              <Package className="w-12 h-12" />
                            </div>
                          )}
                          {/* Stock Status Badge */}
                          {item.product.status === 'ACTIVE' && item.product.quantity > 0 ? (
                            <span className="absolute top-2 right-2 bg-green-500/90 text-white text-xs font-bold px-2 py-1 rounded">
                              In Stock
                            </span>
                          ) : (
                            <span className="absolute top-2 right-2 bg-red-500/90 text-white text-xs font-bold px-2 py-1 rounded">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* Product Details */}
                      <div className="p-4">
                        <Link href={`/buyer/products/${item.product.id}`}>
                          <h3 className="text-white text-lg font-bold mb-2 hover:text-[#ff6600] transition line-clamp-2">
                            {item.product.title}
                          </h3>
                        </Link>
                        
                        {item.product.seller && (
                          <p className="text-[#ffcc99]/70 text-sm mb-2">
                            by {item.product.seller.businessName}
                          </p>
                        )}

                        <p className="text-[#ff6600] text-2xl font-bold mb-4">
                          {formatPrice(item.product.price)}
                        </p>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddToCart(item.product.id)}
                            disabled={item.product.quantity === 0 || item.product.status !== 'ACTIVE'}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#ff6600] text-black rounded-lg font-bold hover:bg-[#cc5200] disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Add to Cart
                          </button>
                          <button
                            onClick={() => handleRemoveFromWishlist(item.product.id)}
                            disabled={removingItems[item.product.id]}
                            className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            title="Remove from wishlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </BuyerLayout>
    </>
  );
}

