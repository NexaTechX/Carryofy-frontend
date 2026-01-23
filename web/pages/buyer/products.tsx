import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import apiClient from '../../lib/api/client';
import { ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import { useCategories } from '../../lib/buyer/hooks/useCategories';
import SEO from '../../components/seo/SEO';
import { BreadcrumbSchema } from '../../components/seo/JsonLd';
import ProductCard from '../../components/common/ProductCard';

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

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
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
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.categories?.filter(cat => cat.isActive) || [];

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState('newest');
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

      if (sortBy && sortBy !== 'newest') {
        params.append('sortBy', sortBy);
      }

      const response = await apiClient.get<ProductsResponse>(`/products?${params.toString()}`);
      
      const responseData = (response.data as any).data || response.data;
      
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
    setSortBy('newest');
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

  // Get category name for SEO
  const getCategoryDisplayName = (slug: string) => {
    const cat = categories.find(c => c.slug === slug);
    return cat?.name || slug;
  };

  // Dynamic SEO based on filters
  const pageTitle = selectedCategory
    ? `Buy ${getCategoryDisplayName(selectedCategory)} Online in Nigeria | Carryofy`
    : searchQuery
      ? `Search: ${searchQuery} - Products | Carryofy`
      : 'Shop Products Online in Nigeria | Same-Day Delivery Lagos | Carryofy';

  const pageDescription = selectedCategory
    ? `Shop ${getCategoryDisplayName(selectedCategory)} online at Carryofy Nigeria. ${total}+ products from verified sellers with same-day delivery in Lagos. Best prices, secure payments, buyer protection.`
    : `Discover ${total}+ products from verified Nigerian sellers. Shop electronics, fashion, groceries & more with same-day delivery in Lagos. Secure payments & buyer protection on Carryofy.`;

  const pageKeywords = [
    'buy online Nigeria',
    'shop online Lagos',
    'online shopping Nigeria',
    'same day delivery Lagos',
    'Nigerian marketplace',
    selectedCategory ? `buy ${getCategoryDisplayName(selectedCategory)} Nigeria` : '',
    selectedCategory ? `${getCategoryDisplayName(selectedCategory)} Lagos` : '',
    'verified sellers Nigeria',
    'secure shopping Nigeria',
    'Carryofy products',
    'best prices Nigeria',
    'fast delivery Nigeria',
  ].filter(Boolean).join(', ');

  if (!mounted) {
    return null;
  }

  const activeFiltersCount = [selectedCategory, minPrice, maxPrice, searchQuery].filter(Boolean).length;

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords={pageKeywords}
        canonical={`https://carryofy.com/buyer/products${selectedCategory ? `?category=${selectedCategory}` : ''}`}
        ogType="website"
        ogImage="https://carryofy.com/og/products.png"
        ogImageAlt="Shop Products on Carryofy Nigeria"
      />
      
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Products', url: '/buyer/products' },
          ...(selectedCategory ? [{ name: getCategoryDisplayName(selectedCategory), url: `/buyer/products?category=${selectedCategory}` }] : []),
        ]}
      />
      
      <BuyerLayout>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Sidebar - Categories & Filters */}
          <aside className="lg:w-64 lg:flex-shrink-0">
            <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 lg:sticky lg:top-24">
              {/* Categories Section */}
              <h2 className="text-white font-bold text-lg mb-4">Categories</h2>
              <nav aria-label="Product categories">
                <ul className="space-y-1 sm:space-y-2">
                  {categories
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((cat) => (
                      <li key={cat.id}>
                        <button
                          onClick={() => {
                            setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug);
                            setCurrentPage(1);
                          }}
                          className={`w-full text-left px-4 py-3 sm:py-2 rounded-lg transition ${
                            selectedCategory === cat.slug
                              ? 'bg-[#ff6600] text-black font-bold'
                              : 'text-white hover:bg-[#ff6600]/10 hover:text-white'
                          }`}
                        >
                          {cat.name}
                        </button>
                      </li>
                    ))}
                </ul>
              </nav>

              {/* Price Range Filter */}
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#ff6600]/30">
                <h3 className="text-white font-bold text-sm mb-3">Price Range (₦)</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[#ffcc99] text-xs mb-1 block">Min Price (₦)</label>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2 bg-black border border-[#ff6600]/30 rounded-lg text-white text-sm focus:outline-none focus:border-[#ff6600]"
                    />
                  </div>
                  <div>
                    <label className="text-[#ffcc99] text-xs mb-1 block">Max Price (₦)</label>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Any"
                      min="0"
                      className="w-full px-3 py-2 bg-black border border-[#ff6600]/30 rounded-lg text-white text-sm focus:outline-none focus:border-[#ff6600]"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setCurrentPage(1);
                      fetchProducts();
                    }}
                    className="w-full px-4 py-2 bg-[#ff6600] text-black font-bold rounded-lg hover:bg-[#cc5200] transition text-sm"
                  >
                    Apply Filter
                  </button>
                  {(minPrice || maxPrice) && (
                    <button
                      onClick={() => {
                        setMinPrice('');
                        setMaxPrice('');
                        setCurrentPage(1);
                        fetchProducts();
                      }}
                      className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] rounded-lg hover:border-[#ff6600] transition text-sm"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 bg-black/50 rounded-xl p-4 sm:p-6">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
              <p className="text-white text-sm sm:text-base">
                Showing <span className="font-bold">{products.length}</span> of{' '}
                <span className="font-bold">{total.toLocaleString()}</span> products
              </p>
              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <label className="text-white text-sm">Sort by:</label>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-lg text-white text-sm focus:outline-none focus:border-[#ff6600] cursor-pointer"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6600]"></div>
                <p className="text-white mt-4">Loading products...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 text-center" role="alert">
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
              <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5" aria-label="Products list">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    href={`/buyer/products/${product.id}`}
                    showFeatures={true}
                  />
                ))}
              </section>
            )}

            {/* Empty State */}
            {!loading && !error && products.length === 0 && (
              <div className="text-center py-12">
                <div className="text-white text-xl mb-4">No products found</div>
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
              <nav className="mt-6 sm:mt-8 flex justify-center items-center gap-1 sm:gap-2" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-lg sm:rounded-xl text-white hover:border-[#ff6600] disabled:opacity-50 disabled:cursor-not-allowed transition"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
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
                      className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl font-medium text-sm sm:text-base transition ${
                        currentPage === pageNum
                          ? 'bg-[#ff6600] text-black'
                          : 'bg-[#1a1a1a] border border-[#ff6600]/30 text-white hover:border-[#ff6600]'
                      }`}
                      aria-label={`Page ${pageNum}`}
                      aria-current={currentPage === pageNum ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-lg sm:rounded-xl text-white hover:border-[#ff6600] disabled:opacity-50 disabled:cursor-not-allowed transition"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </nav>
            )}
          </div>
        </div>
      </BuyerLayout>
    </>
  );
}
