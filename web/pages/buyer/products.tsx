import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager, useAuth } from '../../lib/auth';
import apiClient from '../../lib/api/client';
import { ChevronLeft, ChevronRight, Filter, PanelLeftClose, PanelLeft, Search } from 'lucide-react';
import { useCategories } from '../../lib/buyer/hooks/useCategories';
import SEO from '../../components/seo/SEO';
import { BreadcrumbSchema } from '../../components/seo/JsonLd';
import ShopFiltersPanel from '../../components/buyer/shop/ShopFiltersPanel';
import ShopProductCard, { ShopProductCardProduct } from '../../components/buyer/shop/ShopProductCard';
import EmptyShopState from '../../components/buyer/shop/EmptyShopState';
import CategoryBanner from '../../components/promotions/CategoryBanner';
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
const PRODUCTS_PAGE_SIZE = 24;

export default function ProductsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [showFiltersDesktop, setShowFiltersDesktop] = useState(true);
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.categories?.filter(cat => cat.isActive) || [];

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  /** Debounced value used for API + URL sync so typing does not hammer the server */
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [purchaseType, setPurchaseType] = useState<'ALL' | 'B2C' | 'B2B'>('ALL');
  const [inStockOnly, setInStockOnly] = useState(true);
  const [verifiedSellersOnly, setVerifiedSellersOnly] = useState(false);
  const [moqMin, setMoqMin] = useState<string>('');
  const [moqMax, setMoqMax] = useState<string>('');
  const [priceLow, setPriceLow] = useState(PRICE_MIN);
  const [priceHigh, setPriceHigh] = useState(PRICE_MAX);
  const [vendors, setVendors] = useState<{ id: string; businessName: string }[]>([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [selectedSellerId, setSelectedSellerId] = useState('');
  /** Skip one sync from URL after we shallow-replace ?search= so typing is not overwritten */
  const skipSearchSyncRef = useRef(false);

  const b2bOnly = purchaseType === 'B2B' ? true : purchaseType === 'B2C' ? false : undefined;

  useEffect(() => {
    setMounted(true);
    const u = userManager.getUser();
    // SECTION 3.1 — resolved: public catalog; only redirect logged-in non-buyers
    if (u && u.role && u.role !== 'BUYER' && u.role !== 'ADMIN') {
      router.push('/');
    }
  }, [router]);

  useLayoutEffect(() => {
    if (!mounted || !router.isReady) return;
    const { category, page, b2bOnly: b2bParam, sellerId } = router.query;
    if (category && typeof category === 'string') setSelectedCategory(category);
    if (page && typeof page === 'string') setCurrentPage(parseInt(page, 10));
    if (b2bParam === 'true' || b2bParam === '1') setPurchaseType('B2B');
    else if (b2bParam === 'false' || b2bParam === '0') setPurchaseType('B2C');
    if (sellerId && typeof sellerId === 'string') setSelectedSellerId(sellerId);
    else if (!sellerId) setSelectedSellerId('');
  }, [mounted, router.isReady, router.query]);

  useEffect(() => {
    if (!mounted || !router.isReady) return;
    if (skipSearchSyncRef.current) {
      skipSearchSyncRef.current = false;
      return;
    }
    const raw = router.query.search;
    const s = typeof raw === 'string' ? raw : '';
    setSearchQuery(s);
    setDebouncedSearch(s);
  }, [mounted, router.isReady, router.query.search]);

  useEffect(() => {
    if (!router.isReady) return;
    const id = window.setTimeout(() => {
      setDebouncedSearch((prev) => {
        if (prev !== searchQuery) {
          setCurrentPage(1);
        }
        return searchQuery;
      });
    }, 300);
    return () => window.clearTimeout(id);
  }, [searchQuery, router.isReady]);

  useEffect(() => {
    if (!mounted || !router.isReady || router.pathname !== '/buyer/products') return;
    const nextStr = debouncedSearch.trim();
    const cur = router.query.search;
    const curStr = typeof cur === 'string' ? cur : '';
    if (curStr === nextStr) return;
    const nextQuery = { ...router.query };
    if (nextStr) nextQuery.search = nextStr;
    else delete nextQuery.search;
    nextQuery.page = '1';
    skipSearchSyncRef.current = true;
    void router.replace({ pathname: '/buyer/products', query: nextQuery }, undefined, { shallow: true });
  }, [debouncedSearch, mounted, router.isReady, router.pathname, router.query, router]);

  useEffect(() => {
    if (!mounted || !tokenManager.isAuthenticated()) return;
    // Vendors for filter — authenticated buyers only
    let cancelled = false;
    apiClient
      .get('/sellers/vendors-for-shop')
      .then((res) => {
        if (cancelled) return;
        const raw = (res.data as { data?: unknown })?.data ?? res.data;
        const list = Array.isArray(raw) ? raw : [];
        setVendors(list as { id: string; businessName: string }[]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [mounted]);

  useEffect(() => {
    if (mounted && router.isReady) fetchProducts();
  }, [
    mounted,
    router.isReady,
    selectedCategory,
    sortBy,
    currentPage,
    debouncedSearch,
    b2bOnly,
    inStockOnly,
    verifiedSellersOnly,
    moqMin,
    moqMax,
    priceLow,
    priceHigh,
    selectedSellerId,
  ]);

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

  const fetchProducts = async (searchOverride?: string, pageOverride?: number) => {
    try {
      setLoading(true);
      setError(null);
      const searchTerm =
        searchOverride !== undefined ? String(searchOverride).trim() : debouncedSearch.trim();
      const pageNum = pageOverride !== undefined ? pageOverride : currentPage;
      const params = new URLSearchParams();
      params.append('page', String(pageNum));
      params.append('limit', String(PRODUCTS_PAGE_SIZE));
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (sortBy && sortBy !== 'newest') params.append('sortBy', sortBy);
      if (b2bOnly === true) params.append('b2bOnly', 'true');
      else if (b2bOnly === false) params.append('b2bOnly', 'false');
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
      if (selectedSellerId) params.append('sellerId', selectedSellerId);

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
    const trimmedSearch = searchQuery.trim();
    setDebouncedSearch(trimmedSearch);
    const q: Record<string, string> = {};
    if (selectedCategory) q.category = selectedCategory;
    if (trimmedSearch) q.search = trimmedSearch;
    if (b2bOnly === true) q.b2bOnly = 'true';
    else if (b2bOnly === false) q.b2bOnly = 'false';
    if (selectedSellerId) q.sellerId = selectedSellerId;
    router.replace({ pathname: '/buyer/products', query: q }, undefined, { shallow: true });
    fetchProducts(trimmedSearch, 1);
    setShowFiltersMobile(false);
  };

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSortBy('newest');
    setSearchQuery('');
    setDebouncedSearch('');
    setPurchaseType('ALL');
    setInStockOnly(true);
    setVerifiedSellersOnly(false);
    setMoqMin('');
    setMoqMax('');
    setPriceLow(PRICE_MIN);
    setPriceHigh(PRICE_MAX);
    setCurrentPage(1);
    setSelectedSellerId('');
    setVendorSearch('');
    router.replace({ pathname: '/buyer/products' }, undefined, { shallow: true });
    setTimeout(() => fetchProducts('', 1), 0);
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
    : debouncedSearch.trim()
      ? `Search: ${debouncedSearch.trim()} - Products | Carryofy`
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
        {/* SECTION 3.1 — resolved: guest banner */}
        {!user && (
          <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground/90 flex flex-wrap items-center justify-between gap-2">
            <span>Sign in to place orders and get delivery to your store</span>
            <Link
              href="/auth/login?redirect=/buyer/products"
              className="font-semibold text-primary hover:underline shrink-0"
            >
              Sign in
            </Link>
          </div>
        )}
        <div className="flex h-full min-h-0 -m-3 sm:-m-4 lg:-m-6 xl:-m-8">
          {/* Filter Panel - Desktop (max 260px, collapsible) */}
          <div
            id="shop-filters-desktop"
            className={`hidden lg:flex lg:flex-col lg:shrink-0 lg:h-full lg:min-h-0 overflow-hidden border-r border-border-custom transition-[width] duration-300 ease-out ${
              showFiltersDesktop ? 'lg:w-[260px] lg:max-w-[260px]' : 'lg:w-0 lg:max-w-0 lg:border-r-0'
            }`}
          >
            <div
              className="flex h-full min-h-0 w-[260px] max-w-[260px] flex-col shrink-0 overflow-hidden"
              aria-hidden={!showFiltersDesktop}
            >
            <ShopFiltersPanel
              categories={categories}
              vendors={vendors}
              vendorSearch={vendorSearch}
              onVendorSearchChange={setVendorSearch}
              selectedSellerId={selectedSellerId}
              onSellerIdChange={(id) => { setSelectedSellerId(id); setCurrentPage(1); }}
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
                className="fixed inset-y-0 left-0 w-[min(320px,85vw)] max-w-full z-[110] lg:hidden flex flex-col bg-sidebar-bg shadow-2xl transition-transform duration-200 ease-out"
                role="dialog"
                aria-label="Product filters"
              >
                <ShopFiltersPanel
                  categories={categories}
                  vendors={vendors}
                  vendorSearch={vendorSearch}
                  onVendorSearchChange={setVendorSearch}
                  selectedSellerId={selectedSellerId}
                  onSellerIdChange={(id) => { setSelectedSellerId(id); setCurrentPage(1); }}
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
          <div className="flex-1 min-w-0 flex flex-col bg-background" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            {selectedCategory && <CategoryBanner categorySlug={selectedCategory} />}

            {/* Search + Sort - sticky */}
            <div className="sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-4 bg-background border-b border-border-custom">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
                <input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-input-bg border border-input-border rounded-xl text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowFiltersDesktop((v) => !v)}
                  className="hidden lg:inline-flex items-center gap-2 px-4 py-2.5 bg-[#FF6B00]/20 border border-[#FF6B00]/50 rounded-xl text-[#FF6B00] font-medium hover:bg-[#FF6B00]/30 hover:border-[#FF6B00] transition-colors justify-center"
                  aria-expanded={showFiltersDesktop}
                  aria-controls="shop-filters-desktop"
                  aria-label={showFiltersDesktop ? 'Hide filters sidebar' : 'Show filters sidebar'}
                >
                  {showFiltersDesktop ? (
                    <>
                      <PanelLeftClose className="w-4 h-4 shrink-0" aria-hidden />
                      <span className="hidden xl:inline">Hide filters</span>
                    </>
                  ) : (
                    <>
                      <PanelLeft className="w-4 h-4 shrink-0" aria-hidden />
                      <span className="hidden xl:inline">Filters</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
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
                  className="px-4 py-2.5 bg-input-bg border border-input-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary cursor-pointer"
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
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent" />
                  <p className="text-foreground/70 mt-4">Loading products...</p>
                </div>
              )}

              {error && (
                <div className="py-12 text-center">
                  <p className="text-red-400 mb-4">{error}</p>
                  <button
                    type="button"
                    onClick={() => void fetchProducts()}
                    className="px-6 py-2.5 bg-primary text-black font-bold rounded-xl hover:bg-primary/80"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!loading && !error && products.length === 0 && (
                <EmptyShopState onBrowseCategories={handleResetFilters} />
              )}

              {!loading && !error && products.length > 0 && (
                <>
                  <p className="text-foreground/60 text-sm mb-4">
                    Showing <span className="font-semibold text-foreground">{displayProducts.length}</span> of {displayTotal.toLocaleString()} products
                  </p>
                  <section
                    className={`grid grid-cols-2 gap-4 sm:gap-4 lg:gap-5 md:grid-cols-3 ${
                      showFiltersDesktop
                        ? 'lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                        : 'lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
                    }`}
                    aria-label="Products"
                  >
                    {displayProducts.map((product) => (
                      <ShopProductCard key={product.id} product={product} href={`/buyer/products/${product.id}`} />
                    ))}
                  </section>

                  {products.length > 0 && totalPages > 1 && (
                    <nav className="mt-8 flex justify-center items-center gap-2" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 bg-input-bg border border-input-border rounded-xl text-foreground hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
                            className={`w-10 h-10 flex items-center justify-center rounded-xl font-medium text-sm ${currentPage === pageNum ? 'bg-primary text-black' : 'bg-input-bg border border-input-border text-foreground hover:border-primary'
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
                        className="p-2 bg-input-bg border border-input-border rounded-xl text-foreground hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
