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
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.categories?.filter(cat => cat.isActive) || [];

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
        <div>
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2">
              {selectedCategory ? `Shop ${getCategoryDisplayName(selectedCategory)}` : 'Explore Products'}
            </h1>
            <p className="text-[#ffcc99] text-lg">
              {total} {total === 1 ? 'product' : 'products'} available
              {selectedCategory ? ` in ${getCategoryDisplayName(selectedCategory)}` : ''}
            </p>
          </header>

          {/* Filter Bar */}
          <div className="mb-6 flex flex-wrap gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white hover:border-[#ff6600] transition"
              aria-expanded={showFilters}
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
            {categories.length > 0 && (
              <nav className="flex flex-wrap gap-2" aria-label="Product categories">
                {categories
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug);
                        setCurrentPage(1);
                      }}
                      className={`px-4 py-2 rounded-xl font-medium transition ${
                        selectedCategory === cat.slug
                          ? 'bg-[#ff6600] text-black'
                          : 'bg-[#1a1a1a] text-white border border-[#ff6600]/30 hover:border-[#ff6600]'
                      }`}
                      aria-pressed={selectedCategory === cat.slug}
                    >
                      {cat.name}
                    </button>
                  ))}
              </nav>
            )}

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white hover:border-[#ff6600] transition focus:outline-none focus:border-[#ff6600]"
              aria-label="Sort products"
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
                  <label htmlFor="minPrice" className="block text-[#ffcc99] text-sm mb-2">Min Price (₦)</label>
                  <input
                    type="number"
                    id="minPrice"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 bg-black border border-[#ff6600]/30 rounded-xl text-white focus:outline-none focus:border-[#ff6600]"
                  />
                </div>
                <div>
                  <label htmlFor="maxPrice" className="block text-[#ffcc99] text-sm mb-2">Max Price (₦)</label>
                  <input
                    type="number"
                    id="maxPrice"
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
            <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" aria-label="Products list">
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
                        loading="lazy"
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
                    <h2 className="text-white font-medium text-sm mb-1 line-clamp-2 group-hover:text-[#ff6600] transition">
                      {product.title}
                    </h2>
                    <p className="text-[#ffcc99] text-xs mb-2">{product.seller.businessName}</p>
                    <p className="text-[#ff6600] font-bold text-lg">{formatPrice(product.price)}</p>
                  </div>
                </Link>
              ))}
            </section>
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
            <nav className="mt-8 flex justify-center items-center gap-2" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white hover:border-[#ff6600] disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Previous page"
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
                className="p-2 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white hover:border-[#ff6600] disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Next page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </nav>
          )}
        </div>
      </BuyerLayout>
    </>
  );
}
