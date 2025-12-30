import { GetServerSideProps } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import SEO, { generateKeywords } from '../../components/seo/SEO';
import { BreadcrumbSchema, FAQSchema } from '../../components/seo/JsonLd';
import ProductComparison from '../../components/products/ProductComparison';
import ProductCard from '../../components/common/ProductCard';
import { ChevronLeft, ChevronRight, Star, Truck, Shield, Package, Filter, X, ChevronDown, GitCompare } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com/api/v1';

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  images: string[];
  quantity: number;
  category?: string;
  keyFeatures?: string[];
  seller: {
    id: string;
    businessName: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
}

interface ProductsPageProps {
  products: Product[];
  categories: Category[];
  total: number;
  totalPages: number;
  currentPage: number;
  selectedCategory: string;
  searchQuery: string;
  error?: string;
}

// Server-side data fetching - no authentication required!
export const getServerSideProps: GetServerSideProps<ProductsPageProps> = async ({ query }) => {
  const page = parseInt(query.page as string) || 1;
  const category = (query.category as string) || '';
  const search = (query.search as string) || '';
  const sortBy = (query.sortBy as string) || 'newest';
  const minPrice = (query.minPrice as string) || '';
  const maxPrice = (query.maxPrice as string) || '';
  const limit = 24;

  try {
    // Fetch products
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    // Don't send status - backend defaults to ACTIVE for public browsing
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    if (sortBy && sortBy !== 'newest') params.append('sortBy', sortBy);
    if (minPrice) params.append('minPrice', (parseFloat(minPrice) * 100).toString()); // Convert to kobo
    if (maxPrice) params.append('maxPrice', (parseFloat(maxPrice) * 100).toString()); // Convert to kobo

    const [productsResponse, categoriesResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/products?${params.toString()}`),
      fetch(`${API_BASE_URL}/categories`),
    ]);

    let products: Product[] = [];
    let total = 0;
    let totalPages = 1;
    let categories: Category[] = [];

    if (productsResponse.ok) {
      const data = await productsResponse.json();
      const responseData = data.data || data;
      products = responseData.products || [];
      total = responseData.total || 0;
      totalPages = responseData.totalPages || 1;
    }

    if (categoriesResponse.ok) {
      const catData = await categoriesResponse.json();
      categories = (catData.data?.categories || catData.categories || []).filter((c: Category) => c.isActive);
    }

    return {
      props: {
        products,
        categories,
        total,
        totalPages,
        currentPage: page,
        selectedCategory: category,
        searchQuery: search,
      },
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      props: {
        products: [],
        categories: [],
        total: 0,
        totalPages: 1,
        currentPage: 1,
        selectedCategory: '',
        searchQuery: '',
        error: 'Failed to load products',
      },
    };
  }
};

export default function PublicProductsPage({
  products,
  categories,
  total,
  totalPages,
  currentPage,
  selectedCategory,
  searchQuery,
  error,
}: ProductsPageProps) {
  const router = useRouter();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  // Get initial values from URL query
  const [sortBy, setSortBy] = useState<string>((router.query.sortBy as string) || 'newest');
  const [minPrice, setMinPrice] = useState<string>((router.query.minPrice as string) ? (parseInt(router.query.minPrice as string) / 100).toString() : '');
  const [maxPrice, setMaxPrice] = useState<string>((router.query.maxPrice as string) ? (parseInt(router.query.maxPrice as string) / 100).toString() : '');
  const [comparisonProducts, setComparisonProducts] = useState<Product[]>([]);

  // Load comparison products from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('productComparison');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Filter to only include products that exist in current products list
        const validProducts = parsed.filter((p: Product) => 
          products.some(prod => prod.id === p.id)
        );
        setComparisonProducts(validProducts);
      } catch (e) {
        console.error('Error loading comparison products:', e);
      }
    }
  }, [products]);

  // Update state when router query changes
  useEffect(() => {
    setSortBy((router.query.sortBy as string) || 'newest');
    setMinPrice((router.query.minPrice as string) ? (parseInt(router.query.minPrice as string) / 100).toString() : '');
    setMaxPrice((router.query.maxPrice as string) ? (parseInt(router.query.maxPrice as string) / 100).toString() : '');
  }, [router.query]);

  const handleAddToComparison = (product: Product) => {
    if (comparisonProducts.length >= 4) {
      alert('You can compare up to 4 products at a time');
      return;
    }
    if (comparisonProducts.some(p => p.id === product.id)) {
      return; // Already in comparison
    }
    const updated = [...comparisonProducts, product];
    setComparisonProducts(updated);
    localStorage.setItem('productComparison', JSON.stringify(updated));
  };

  const handleRemoveFromComparison = (productId: string) => {
    const updated = comparisonProducts.filter(p => p.id !== productId);
    setComparisonProducts(updated);
    if (updated.length === 0) {
      localStorage.removeItem('productComparison');
    } else {
      localStorage.setItem('productComparison', JSON.stringify(updated));
    }
  };

  const handleClearComparison = () => {
    setComparisonProducts([]);
    localStorage.removeItem('productComparison');
  };

  const formatPrice = (priceInKobo: number) => {
    return `₦${(priceInKobo / 100).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getCategoryName = (slug: string) => {
    const cat = categories.find((c) => c.slug === slug);
    return cat?.name || slug;
  };

  // Build canonical URL
  const buildUrl = (params: { 
    page?: number; 
    category?: string; 
    search?: string;
    sortBy?: string;
    minPrice?: string;
    maxPrice?: string;
  }) => {
    const urlParams = new URLSearchParams();
    if (params.category) urlParams.set('category', params.category);
    if (params.search) urlParams.set('search', params.search);
    if (params.sortBy && params.sortBy !== 'newest') urlParams.set('sortBy', params.sortBy);
    if (params.minPrice) urlParams.set('minPrice', params.minPrice);
    if (params.maxPrice) urlParams.set('maxPrice', params.maxPrice);
    if (params.page && params.page > 1) urlParams.set('page', params.page.toString());
    const queryString = urlParams.toString();
    return `/products${queryString ? `?${queryString}` : ''}`;
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    const url = buildUrl({ 
      category: selectedCategory, 
      search: searchQuery, 
      sortBy: newSort,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
    });
    window.location.href = url;
  };

  const handlePriceFilter = () => {
    const url = buildUrl({ 
      category: selectedCategory, 
      search: searchQuery, 
      sortBy: sortBy !== 'newest' ? sortBy : undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
    });
    window.location.href = url;
  };

  // SEO content
  const pageTitle = selectedCategory
    ? `Buy ${getCategoryName(selectedCategory)} Online in Nigeria - Best Prices | Carryofy`
    : searchQuery
      ? `Search "${searchQuery}" - ${total} Products Found | Carryofy Nigeria`
      : 'Shop Online in Nigeria - Same Day Delivery Lagos | Carryofy';

  const pageDescription = selectedCategory
    ? `Shop ${getCategoryName(selectedCategory)} online at Carryofy Nigeria. Browse ${total}+ products from verified sellers with same-day delivery in Lagos. Best prices, secure payments, and buyer protection guaranteed.`
    : `Discover ${total}+ quality products from verified Nigerian sellers on Carryofy. Electronics, fashion, groceries, home goods and more. Same-day delivery in Lagos, secure payments, 100% buyer protection.`;

  const keywords = generateKeywords(['primary', 'problemAware', 'locations']) + 
    (selectedCategory ? `, ${getCategoryName(selectedCategory)} Nigeria, buy ${getCategoryName(selectedCategory)} online Lagos` : '');

  // FAQ data for schema
  const faqs = [
    {
      question: 'How does Carryofy ensure product quality?',
      answer: 'All sellers on Carryofy go through a verification process. Products are inspected at our fulfillment centers before shipping, ensuring quality and authenticity.',
    },
    {
      question: 'What payment methods are accepted on Carryofy?',
      answer: 'Carryofy accepts bank transfers, debit/credit cards (Visa, Mastercard), and mobile money payments. All transactions are secured with encryption.',
    },
    {
      question: 'How fast is delivery in Lagos?',
      answer: 'Carryofy offers same-day delivery for orders placed before 12pm in Lagos. Standard delivery takes 1-3 business days within Nigeria.',
    },
    {
      question: 'Is there a return policy?',
      answer: 'Yes, Carryofy offers a 7-day return policy on most products. If you receive a damaged or incorrect item, contact support for a full refund or replacement.',
    },
  ];

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords={keywords}
        canonical={`https://carryofy.com${buildUrl({ category: selectedCategory, search: searchQuery, page: currentPage })}`}
        ogType="website"
        ogImage="https://carryofy.com/og/products.png"
        ogImageAlt="Shop Products Online at Carryofy Nigeria"
      />

      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Products', url: '/products' },
          ...(selectedCategory ? [{ name: getCategoryName(selectedCategory), url: `/products?category=${selectedCategory}` }] : []),
        ]}
      />

      <FAQSchema faqs={faqs} />

      <div className="min-h-screen flex flex-col bg-black">
        <Header />

        <main className="flex-grow pt-16 sm:pt-20">
          {/* Hero Section with Search */}
          <section className="bg-gradient-to-b from-[#1a1a1a] to-black py-8 sm:py-12 border-b border-[#ff6600]/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="font-heading text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-center">
                {selectedCategory ? `Shop ${getCategoryName(selectedCategory)}` : 'Shop Products Online'}
              </h1>
              <p className="text-[#ffcc99] text-sm sm:text-base lg:text-lg text-center mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
                {selectedCategory
                  ? `Browse ${total} ${getCategoryName(selectedCategory)} products from verified Nigerian sellers`
                  : `Discover ${total.toLocaleString()} products with same-day delivery in Lagos`}
              </p>

              {/* Search Bar */}
              <form action="/products" method="GET" className="max-w-2xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <input
                    type="text"
                    name="search"
                    defaultValue={searchQuery}
                    placeholder="Search products..."
                    className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600] text-base"
                  />
                  {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
                  <button
                    type="submit"
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-[#ff6600] text-black font-bold rounded-xl hover:bg-[#cc5200] transition touch-target btn-mobile"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Trust Badges - Scrollable on mobile */}
          <section className="bg-[#1a1a1a] py-4 sm:py-6 border-b border-[#ff6600]/20 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex sm:grid sm:grid-cols-4 gap-4 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex items-center justify-center gap-2 shrink-0 sm:shrink">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff6600]" />
                  <span className="text-[#ffcc99] text-xs sm:text-sm whitespace-nowrap">Same-Day Lagos</span>
                </div>
                <div className="flex items-center justify-center gap-2 shrink-0 sm:shrink">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                  <span className="text-[#ffcc99] text-xs sm:text-sm whitespace-nowrap">Buyer Protection</span>
                </div>
                <div className="flex items-center justify-center gap-2 shrink-0 sm:shrink">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff6600]" />
                  <span className="text-[#ffcc99] text-xs sm:text-sm whitespace-nowrap">Verified Sellers</span>
                </div>
                <div className="flex items-center justify-center gap-2 shrink-0 sm:shrink">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff6600]" />
                  <span className="text-[#ffcc99] text-xs sm:text-sm whitespace-nowrap">Secure Packaging</span>
                </div>
              </div>
            </div>
          </section>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white font-medium w-full justify-center touch-target btn-mobile"
              >
                <Filter className="w-5 h-5" />
                <span>Filter by Category</span>
                {selectedCategory && (
                  <span className="ml-2 px-2 py-0.5 bg-[#ff6600] text-black text-xs font-bold rounded-full">
                    {getCategoryName(selectedCategory)}
                  </span>
                )}
              </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              {/* Mobile Sidebar Overlay */}
              {mobileFiltersOpen && (
                <div 
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
                  onClick={() => setMobileFiltersOpen(false)}
                />
              )}

              {/* Sidebar - Categories */}
              <aside className={`
                fixed lg:static inset-y-0 left-0 z-50 w-[280px] sm:w-[320px] lg:w-64 
                transform transition-transform duration-300 ease-in-out
                ${mobileFiltersOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                lg:flex-shrink-0
              `}>
                <div className="h-full lg:h-auto bg-[#1a1a1a] border-r lg:border border-[#ff6600]/30 lg:rounded-xl p-6 lg:sticky lg:top-24 overflow-y-auto">
                  {/* Mobile Close Button */}
                  <div className="flex items-center justify-between mb-4 lg:hidden">
                    <h2 className="text-white font-bold text-lg">Categories</h2>
                    <button
                      onClick={() => setMobileFiltersOpen(false)}
                      className="p-2 text-[#ffcc99] hover:text-white transition touch-target"
                      aria-label="Close filters"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <h2 className="hidden lg:block text-white font-bold text-lg mb-4">Categories</h2>
                  <nav aria-label="Product categories">
                    <ul className="space-y-1 sm:space-y-2">
                      <li>
                        <Link
                          href="/products"
                          onClick={() => setMobileFiltersOpen(false)}
                          className={`block px-4 py-3 sm:py-2 rounded-lg transition touch-target ${
                            !selectedCategory
                              ? 'bg-[#ff6600] text-black font-bold'
                              : 'text-[#ffcc99] hover:bg-[#ff6600]/10 hover:text-white'
                          }`}
                        >
                          All Products
                        </Link>
                      </li>
                      {categories
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((cat) => (
                          <li key={cat.id}>
                            <Link
                              href={`/products?category=${cat.slug}`}
                              onClick={() => setMobileFiltersOpen(false)}
                              className={`block px-4 py-3 sm:py-2 rounded-lg transition touch-target ${
                                selectedCategory === cat.slug
                                  ? 'bg-[#ff6600] text-black font-bold'
                                  : 'text-[#ffcc99] hover:bg-[#ff6600]/10 hover:text-white'
                              }`}
                            >
                              {cat.name}
                            </Link>
                          </li>
                        ))}
                    </ul>
                  </nav>

                  {/* Price Range Filter */}
                  <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#ff6600]/30">
                    <h3 className="text-white font-bold text-sm mb-3">Price Range</h3>
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
                        onClick={handlePriceFilter}
                        className="w-full px-4 py-2 bg-[#ff6600] text-black font-bold rounded-lg hover:bg-[#cc5200] transition text-sm"
                      >
                        Apply Filter
                      </button>
                      {(minPrice || maxPrice) && (
                        <button
                          onClick={() => {
                            setMinPrice('');
                            setMaxPrice('');
                            const url = buildUrl({ 
                              category: selectedCategory, 
                              search: searchQuery, 
                              sortBy: sortBy !== 'newest' ? sortBy : undefined,
                            });
                            window.location.href = url;
                          }}
                          className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] rounded-lg hover:border-[#ff6600] transition text-sm"
                        >
                          Clear Filter
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Why Shop Here */}
                  <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#ff6600]/30">
                    <h3 className="text-white font-bold text-sm mb-3">Why Shop on Carryofy?</h3>
                    <ul className="text-[#ffcc99] text-sm space-y-2">
                      <li>✓ Verified Nigerian Sellers</li>
                      <li>✓ Same-Day Delivery in Lagos</li>
                      <li>✓ Secure Payments</li>
                      <li>✓ 7-Day Return Policy</li>
                      <li>✓ 24/7 Customer Support</li>
                    </ul>
                  </div>
                </div>
              </aside>

              {/* Products Grid */}
              <div className="flex-1 min-w-0">
                {/* Results Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                  <p className="text-[#ffcc99] text-sm sm:text-base">
                    Showing <span className="text-white font-bold">{products.length}</span> of{' '}
                    <span className="text-white font-bold">{total.toLocaleString()}</span> products
                    {selectedCategory && (
                      <>
                        {' '}in <span className="text-[#ff6600] font-semibold">{getCategoryName(selectedCategory)}</span>
                      </>
                    )}
                  </p>
                  {/* Sort Options */}
                  <div className="flex items-center gap-2">
                    <label className="text-[#ffcc99] text-sm">Sort by:</label>
                    <select 
                      value={sortBy}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="px-3 py-2 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-lg text-white text-sm focus:outline-none focus:border-[#ff6600] cursor-pointer"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="popular">Most Popular</option>
                    </select>
                  </div>
                </div>

                {/* Error State */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 text-center mb-8">
                    <p className="text-red-400">{error}</p>
                  </div>
                )}

                {/* Products Grid */}
                {products.length > 0 ? (
                  <section
                    className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
                    aria-label="Products"
                    itemScope
                    itemType="https://schema.org/ItemList"
                  >
                    <meta itemProp="numberOfItems" content={total.toString()} />
                    {products.map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToComparison={handleAddToComparison}
                        href={`/products/${product.id}`}
                        showFeatures={true}
                      />
                    ))}
                  </section>
                ) : (
                  <div className="text-center py-16">
                    <Package className="w-16 h-16 text-[#ffcc99]/30 mx-auto mb-4" />
                    <h3 className="text-white text-xl font-bold mb-2">No Products Found</h3>
                    <p className="text-[#ffcc99] mb-6">
                      {searchQuery
                        ? `No results for "${searchQuery}". Try a different search term.`
                        : 'No products available in this category yet.'}
                    </p>
                    <Link
                      href="/products"
                      className="inline-block px-6 py-3 bg-[#ff6600] text-black font-bold rounded-xl hover:bg-[#cc5200] transition"
                    >
                      View All Products
                    </Link>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav className="mt-6 sm:mt-8 flex justify-center items-center gap-1 sm:gap-2" aria-label="Pagination">
                    {currentPage > 1 && (
                      <Link
                        href={buildUrl({ category: selectedCategory, search: searchQuery, page: currentPage - 1 })}
                        className="p-2 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-lg sm:rounded-xl text-white hover:border-[#ff6600] transition touch-target"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Link>
                    )}

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
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
                        <Link
                          key={pageNum}
                          href={buildUrl({ category: selectedCategory, search: searchQuery, page: pageNum })}
                          className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl font-medium text-sm sm:text-base transition touch-target ${
                            currentPage === pageNum
                              ? 'bg-[#ff6600] text-black'
                              : 'bg-[#1a1a1a] border border-[#ff6600]/30 text-white hover:border-[#ff6600]'
                          }`}
                          aria-label={`Page ${pageNum}`}
                          aria-current={currentPage === pageNum ? 'page' : undefined}
                        >
                          {pageNum}
                        </Link>
                      );
                    })}

                    {currentPage < totalPages && (
                      <Link
                        href={buildUrl({ category: selectedCategory, search: searchQuery, page: currentPage + 1 })}
                        className="p-2 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-lg sm:rounded-xl text-white hover:border-[#ff6600] transition touch-target"
                        aria-label="Next page"
                      >
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Link>
                    )}
                  </nav>
                )}

                {/* SEO Content Section */}
                <section className="mt-10 sm:mt-16 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-4 sm:p-6 lg:p-8">
                  <h2 className="text-white text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                    {selectedCategory
                      ? `Buy ${getCategoryName(selectedCategory)} Online in Nigeria`
                      : 'Online Shopping in Nigeria Made Easy'}
                  </h2>
                  <div className="text-[#ffcc99] space-y-3 sm:space-y-4 text-sm sm:text-base">
                    {selectedCategory ? (
                      <>
                        <p>
                          Looking for the best {getCategoryName(selectedCategory).toLowerCase()} in Nigeria? Carryofy is your trusted
                          online marketplace for quality {getCategoryName(selectedCategory).toLowerCase()} from verified Nigerian
                          sellers. Browse our collection of {total}+ products and enjoy same-day delivery in Lagos.
                        </p>
                        <p>
                          All our sellers are verified and products are quality-checked at our fulfillment centers before shipping.
                          Shop with confidence knowing you&apos;re protected by our buyer guarantee and 7-day return policy.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          Carryofy connects you with trusted local sellers in Lagos for same-day delivery. Browse {total.toLocaleString()}+ products from verified sellers, from electronics and fashion to groceries and home goods.
                        </p>
                        <p>
                          Order today, receive today in Lagos. Our reliable delivery network ensures fast, safe delivery without the WhatsApp stress.
                        </p>
                        <p className="hidden sm:block">
                          Shop with confidence from verified sellers, enjoy same-day delivery in Lagos, secure payments, and buyer protection. Order today, receive today. Or your money back.
                        </p>
                      </>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>

        <Footer />

        {/* Product Comparison Component */}
        <ProductComparison
          products={comparisonProducts}
          onRemove={handleRemoveFromComparison}
          onClear={handleClearComparison}
        />
      </div>
    </>
  );
}

