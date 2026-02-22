import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import apiClient from '../../lib/api/client';
import { ChevronLeft, ChevronRight, Filter, Search, X } from 'lucide-react';
import { useCategories } from '../../lib/buyer/hooks/useCategories';
import SEO from '../../components/seo/SEO';
import { BreadcrumbSchema } from '../../components/seo/JsonLd';
import ShopFiltersPanel from '../../components/buyer/shop/ShopFiltersPanel';
import ShopProductCard, { ShopProductCardProduct } from '../../components/buyer/shop/ShopProductCard';
import EmptyShopState from '../../components/buyer/shop/EmptyShopState';
import { categoryDisplayName } from '../../lib/buyer/categoryDisplay';

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
    isVerified?: boolean;
  };
  sellingMode?: string;
  moq?: number;
  b2bProductType?: string;
  requestQuoteOnly?: boolean;
  priceTiers?: { minQuantity: number; maxQuantity: number; priceKobo: number }[];
  keyFeatures?: string[];
  tags?: string[];
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

const PRICE_MIN = 0;
const PRICE_MAX = 2_147_483_647;

export default function ProductsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.categories?.filter(cat => cat.isActive) || [];

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [purchaseType, setPurchaseType] = useState<'B2C' | 'B2B'>('B2C');
  const [inStockOnly, setInStockOnly] = useState(true);
  const [verifiedSellersOnly, setVerifiedSellersOnly] = useState(false);
  const [moqMin, setMoqMin] = useState<string>('');
  const [moqMax, setMoqMax] = useState<string>('');
  const [priceLow, setPriceLow] = useState(PRICE_MIN);
  const [priceHigh, setPriceHigh] = useState(PRICE_MAX);

  const b2bOnly = purchaseType === 'B2B';

  useEffect(() => {
    setMounted(true);
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
      const { category, search, page, b2bOnly: b2bParam } = router.query;
      if (category && typeof category === 'string') setSelectedCategory(category);
      if (search && typeof search === 'string') setSearchQuery(search);
      if (page && typeof page === 'string') setCurrentPage(parseInt(page));
      if (b2bParam === 'true' || b2bParam === '1') setPurchaseType('B2B');
    }
  }, [mounted, router.query]);

  useEffect(() => {
    if (mounted) fetchProducts();
  }, [mounted, selectedCategory, sortBy, currentPage, searchQuery, b2bOnly, inStockOnly, verifiedSellersOnly, moqMin, moqMax, priceLow, priceHigh]);

  useEffect(() => {
    if (showFiltersMobile) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setShowFiltersMobile(false);
      };
      window.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
        window.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
  }, [showFiltersMobile]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', '15');
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (sortBy && sortBy !== 'newest') params.append('sortBy', sortBy);
      if (b2bOnly) params.append('b2bOnly', 'true');
      params.append('inStockOnly', inStockOnly ? 'true' : 'false');
      if (verifiedSellersOnly) params.append('verifiedSellersOnly', 'true');
      if (priceLow > PRICE_MIN) params.append('minPrice', priceLow.toString());
      if (priceHigh < PRICE_MAX) params.append('maxPrice', priceHigh.toString());
      if (moqMin !== '') {
        const n = parseInt(moqMin, 10);
        if (!isNaN(n) && n >= 0) params.append('moqMin', n.toString());
      }
      if (moqMax !== '') {
        const n = parseInt(moqMax, 10);
        if (!isNaN(n) && n >= 0) params.append('moqMax', n.toString());
      }

      const response = await apiClient.get<ProductsResponse>(`/products?${params.toString()}`);
      const responseData = (response.data as any).data || response.data;

      if (responseData && Array.isArray(responseData.products)) {
        setProducts(responseData.products);
        setTotalPages(responseData.totalPages || 1);
        setTotal(responseData.total || 0);
      } else {
        setProducts([]);
        setTotalPages(1);
        setTotal(0);
      }
    } catch (err: any) {
      const isNetworkError =
        err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED' ||
        (err.message && String(err.message).toLowerCase().includes('network error'));
      setError(
        isNetworkError
          ? 'Cannot reach the API. Start the API server and ensure it is running.'
          : err.response?.data?.message || 'Failed to load products'
      );
      setProducts([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchProducts();
    setShowFiltersMobile(false);
  };

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSortBy('newest');
    setSearchQuery('');
    setPurchaseType('B2C');
    setInStockOnly(true);
    setVerifiedSellersOnly(false);
    setMoqMin('');
    setMoqMax('');
    setPriceLow(PRICE_MIN);
    setPriceHigh(PRICE_MAX);
    setCurrentPage(1);
    router.push('/buyer/products', undefined, { shallow: true });
    setTimeout(() => fetchProducts(), 0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toShopCard = (p: Product): ShopProductCardProduct => ({
    id: p.id,
    title: p.title,
    price: p.price,
    images: p.images || [],
    quantity: p.quantity ?? 0,
    seller: { id: p.seller.id, businessName: p.seller.businessName, isVerified: p.seller.isVerified ?? true },
    keyFeatures: p.keyFeatures,
    moq: p.moq,
    requestQuoteOnly: p.requestQuoteOnly,
    priceTiers: p.priceTiers,
    fulfilledByCarryofy: true,
  });

  const displayProducts = products.length > 0 ? products.map(toShopCard) : [];
  const displayTotal = total;

  const pageTitle = selectedCategory
    ? `Buy ${categoryDisplayName(selectedCategory, '')} Online in Nigeria | Carryofy`
    : searchQuery
      ? `Search: ${searchQuery} - Products | Carryofy`
      : 'Shop Products Online in Nigeria | Carryofy';

  const pageDescription = selectedCategory
    ? `Shop ${categoryDisplayName(selectedCategory, '')} online at Carryofy Nigeria. Same-day delivery in Lagos. Best prices, secure payments.`
    : `Discover products from verified Nigerian sellers. Shop with same-day delivery in Lagos. Secure payments on Carryofy.`;

  if (!mounted) return null;

  return (
    <>
      <SEO title={pageTitle} description={pageDescription} canonical={`https://carryofy.com/buyer/products${selectedCategory ? `?category=${selectedCategory}` : ''}`} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Products', url: '/buyer/products' },
          ...(selectedCategory ? [{ name: categoryDisplayName(selectedCategory, ''), url: `/buyer/products?category=${selectedCategory}` }] : []),
        ]}
      />

      <BuyerLayout>
        <div className="flex h-full min-h-0 -m-3 sm:-m-4 lg:-m-6 xl:-m-8">
          {/* Filter Panel - Desktop */}
          <div className="hidden lg:flex lg:flex-col lg:w-[260px] lg:shrink-0 lg:h-full lg:min-h-0 lg:overflow-hidden">
            <ShopFiltersPanel
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={(slug) => { setSelectedCategory(slug); setCurrentPage(1); }}
              purchaseType={purchaseType}
              onPurchaseTypeChange={(t) => { setPurchaseType(t); setCurrentPage(1); }}
              inStockOnly={inStockOnly}
              onInStockOnlyChange={(v) => { setInStockOnly(v); setCurrentPage(1); }}
              verifiedSellersOnly={verifiedSellersOnly}
              onVerifiedSellersOnlyChange={(v) => { setVerifiedSellersOnly(v); setCurrentPage(1); }}
              moqMin={moqMin}
              moqMax={moqMax}
              onMoqMinChange={setMoqMin}
              onMoqMaxChange={setMoqMax}
              priceLow={priceLow}
              priceHigh={priceHigh}
              onPriceLowChange={setPriceLow}
              onPriceHighChange={setPriceHigh}
              priceMinBound={PRICE_MIN}
              priceMaxBound={PRICE_MAX}
              onApply={handleApplyFilters}
              onReset={handleResetFilters}
            />
          </div>

          {/* Mobile Filter Overlay */}
          {showFiltersMobile && (
            <>
              <div
                className="fixed inset-0 bg-black/70 z-[100] lg:hidden backdrop-blur-sm"
                onClick={() => setShowFiltersMobile(false)}
                aria-hidden="true"
              />
              <div
                className="fixed inset-y-0 left-0 w-[min(320px,85vw)] max-w-full z-[110] lg:hidden flex flex-col bg-[#1A1A1A] shadow-2xl transition-transform duration-200 ease-out"
                role="dialog"
                aria-label="Product filters"
              >
                <ShopFiltersPanel
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={(slug) => { setSelectedCategory(slug); setCurrentPage(1); }}
                  purchaseType={purchaseType}
                  onPurchaseTypeChange={(t) => { setPurchaseType(t); setCurrentPage(1); }}
                  inStockOnly={inStockOnly}
                  onInStockOnlyChange={(v) => { setInStockOnly(v); setCurrentPage(1); }}
                  verifiedSellersOnly={verifiedSellersOnly}
                  onVerifiedSellersOnlyChange={(v) => { setVerifiedSellersOnly(v); setCurrentPage(1); }}
                  moqMin={moqMin}
                  moqMax={moqMax}
                  onMoqMinChange={setMoqMin}
                  onMoqMaxChange={setMoqMax}
                  priceLow={priceLow}
                  priceHigh={priceHigh}
                  onPriceLowChange={setPriceLow}
                  onPriceHighChange={setPriceHigh}
                  priceMinBound={PRICE_MIN}
                  priceMaxBound={PRICE_MAX}
                  onApply={handleApplyFilters}
                  onReset={handleResetFilters}
                  onClose={() => setShowFiltersMobile(false)}
                />
              </div>
            </>
          )}

          {/* Product Grid Area */}
          <div className="flex-1 min-w-0 flex flex-col bg-[#111111]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* Search + Sort - sticky */}
            <div className="sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-4 bg-[#111111] border-b border-[#2a2a2a]">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ffcc99]/60" />
                <input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A1A] border border-[#2a2a2a] rounded-xl text-white placeholder-[#ffcc99]/50 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowFiltersMobile(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-[#FF6B00]/20 border border-[#FF6B00]/50 rounded-xl text-[#FF6B00] font-medium hover:bg-[#FF6B00]/30 hover:border-[#FF6B00] transition-colors min-w-[100px] justify-center"
                  aria-label="Open filters"
                >
                  <Filter className="w-4 h-4 shrink-0" />
                  <span>Filters</span>
                </button>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2.5 bg-[#1A1A1A] border border-[#2a2a2a] rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00] cursor-pointer"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
              {loading && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#FF6B00] border-t-transparent" />
                  <p className="text-[#ffcc99] mt-4">Loading products...</p>
                </div>
              )}

              {error && (
                <div className="py-12 text-center">
                  <p className="text-red-400 mb-4">{error}</p>
                  <button onClick={fetchProducts} className="px-6 py-2.5 bg-[#FF6B00] text-black font-bold rounded-xl hover:bg-[#ff9955]">
                    Try Again
                  </button>
                </div>
              )}

              {!loading && !error && products.length === 0 && (
                <EmptyShopState onBrowseCategories={handleResetFilters} />
              )}

              {!loading && !error && products.length > 0 && (
                <>
                  <p className="text-[#ffcc99]/80 text-sm mb-4">
                    Showing <span className="font-semibold text-white">{displayProducts.length}</span> of {displayTotal.toLocaleString()} products
                  </p>
                  <section className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-5" aria-label="Products">
                    {displayProducts.map((product) => (
                      <ShopProductCard key={product.id} product={product} href={`/buyer/products/${product.id}`} />
                    ))}
                  </section>

                  {products.length > 0 && totalPages > 1 && (
                    <nav className="mt-8 flex justify-center items-center gap-2" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 bg-[#1A1A1A] border border-[#2a2a2a] rounded-xl text-white hover:border-[#FF6B00] disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl font-medium text-sm ${
                              currentPage === pageNum ? 'bg-[#FF6B00] text-black' : 'bg-[#1A1A1A] border border-[#2a2a2a] text-white hover:border-[#FF6B00]'
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
                        className="p-2 bg-[#1A1A1A] border border-[#2a2a2a] rounded-xl text-white hover:border-[#FF6B00] disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Next page"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </nav>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </BuyerLayout>
    </>
  );
}
