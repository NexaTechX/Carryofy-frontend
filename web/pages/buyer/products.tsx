import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import apiClient from '../../lib/api/client';
import { ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';

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
}

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const categories = [
  { id: 'grains', name: 'Grains' },
  { id: 'oils', name: 'Oils' },
  { id: 'packaged', name: 'Packaged Foods' },
  { id: 'spices', name: 'Spices' },
  { id: 'beverages', name: 'Beverages' },
  { id: 'personal-care', name: 'Personal Care' },
];

const sortOptions = [
  { value: 'createdAt:desc', label: 'Newest First' },
  { value: 'createdAt:asc', label: 'Oldest First' },
  { value: 'price:asc', label: 'Price: Low to High' },
  { value: 'price:desc', label: 'Price: High to Low' },
  { value: 'title:asc', label: 'Name: A to Z' },
  { value: 'title:desc', label: 'Name: Z to A' },
];

export default function ProductsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState('createdAt:desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState<string>('');

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
      // Get URL params
      const { category, search, page } = router.query;
      if (category && typeof category === 'string') {
        setSelectedCategory(category);
      }
      if (search && typeof search === 'string') {
        setSearchQuery(search);
      }
      if (page && typeof page === 'string') {
        setCurrentPage(parseInt(page));
      }
    }
  }, [mounted, router.query]);

  useEffect(() => {
    if (mounted) {
      fetchProducts();
    }
  }, [mounted, selectedCategory, minPrice, maxPrice, sortBy, currentPage, searchQuery]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', '15');

      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      if (minPrice) {
        params.append('minPrice', (parseFloat(minPrice) * 100).toString());
      }
      if (maxPrice) {
        params.append('maxPrice', (parseFloat(maxPrice) * 100).toString());
      }

      const [sortField, sortOrder] = sortBy.split(':');
      params.append('sortBy', sortField);
      params.append('sortOrder', sortOrder);

      const response = await apiClient.get<ProductsResponse>(`/products?${params.toString()}`);
      
      console.log('API Response:', response.data); // Debug log
      
      // Handle both possible response structures (wrapped or direct)
      const responseData = (response.data as any).data || response.data;
      
      // Ensure we have valid data
      if (responseData && Array.isArray(responseData.products)) {
        setProducts(responseData.products);
        setTotalPages(responseData.totalPages || 1);
        setTotal(responseData.total || 0);
      } else {
        console.error('Invalid response structure:', response.data);
        setProducts([]);
        setTotalPages(1);
        setTotal(0);
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.message || 'Failed to load products');
      setProducts([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('createdAt:desc');
    setSearchQuery('');
    setCurrentPage(1);
    router.push('/buyer/products', undefined, { shallow: true });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const activeFiltersCount = [selectedCategory, minPrice, maxPrice, searchQuery].filter(Boolean).length;

  return (
    <>
      <Head>
        <title>Explore Products - Buyer | Carryofy</title>
        <meta
          name="description"
          content="Browse and shop for trusted products from verified sellers on Carryofy."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <BuyerLayout>
        <div>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2">Explore Products</h1>
            <p className="text-[#ffcc99] text-lg">
              {total} {total === 1 ? 'product' : 'products'} available
            </p>
          </div>

          {/* Filter Bar */}
          <div className="mb-6 flex flex-wrap gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white hover:border-[#ff6600] transition"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-[#ff6600] text-black px-2 py-0.5 rounded-full text-sm font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(selectedCategory === cat.id ? '' : cat.id);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-xl font-medium transition ${
                    selectedCategory === cat.id
                      ? 'bg-[#ff6600] text-black'
                      : 'bg-[#1a1a1a] text-white border border-[#ff6600]/30 hover:border-[#ff6600]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white hover:border-[#ff6600] transition focus:outline-none focus:border-[#ff6600]"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-[#ff6600] hover:bg-[#ff6600] hover:text-black transition"
              >
                <X className="w-5 h-5" />
                <span>Clear All</span>
              </button>
            )}
          </div>

          {/* Collapsible Filter Panel */}
          {showFilters && (
            <div className="mb-6 p-6 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl">
              <h3 className="text-white text-lg font-bold mb-4">Price Range</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#ffcc99] text-sm mb-2">Min Price (₦)</label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 bg-black border border-[#ff6600]/30 rounded-xl text-white focus:outline-none focus:border-[#ff6600]"
                  />
                </div>
                <div>
                  <label className="block text-[#ffcc99] text-sm mb-2">Max Price (₦)</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="999999.00"
                    className="w-full px-4 py-2 bg-black border border-[#ff6600]/30 rounded-xl text-white focus:outline-none focus:border-[#ff6600]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6600]"></div>
              <p className="text-[#ffcc99] mt-4">Loading products...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 text-center">
              <p className="text-red-400">{error}</p>
              <button
                onClick={fetchProducts}
                className="mt-4 px-6 py-2 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Products Grid */}
          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/buyer/products/${product.id}`}
                  className="group bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl overflow-hidden hover:border-[#ff6600] transition"
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-black relative overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#ffcc99]">
                        No Image
                      </div>
                    )}
                    {product.quantity === 0 && (
                      <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                        <span className="text-red-400 font-bold text-lg">Out of Stock</span>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-4">
                    <h3 className="text-white font-medium text-sm mb-1 line-clamp-2 group-hover:text-[#ff6600] transition">
                      {product.title}
                    </h3>
                    <p className="text-[#ffcc99] text-xs mb-2">{product.seller.businessName}</p>
                    <p className="text-[#ff6600] font-bold text-lg">{formatPrice(product.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && products.length === 0 && (
            <div className="text-center py-12">
              <div className="text-[#ffcc99] text-xl mb-4">No products found</div>
              <p className="text-[#ffcc99]/70 mb-6">Try adjusting your filters or search query</p>
              <button
                onClick={handleClearFilters}
                className="px-6 py-3 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && products.length > 0 && totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white hover:border-[#ff6600] disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-10 h-10 rounded-xl font-medium transition ${
                      currentPage === pageNum
                        ? 'bg-[#ff6600] text-black'
                        : 'bg-[#1a1a1a] border border-[#ff6600]/30 text-white hover:border-[#ff6600]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white hover:border-[#ff6600] disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </BuyerLayout>
    </>
  );
}

