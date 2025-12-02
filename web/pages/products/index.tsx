import { GetServerSideProps } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import SEO, { generateKeywords } from '../../components/seo/SEO';
import { BreadcrumbSchema, FAQSchema } from '../../components/seo/JsonLd';
import { ChevronLeft, ChevronRight, Star, Truck, Shield, Package } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com/api/v1';

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
  const limit = 24;

  try {
    // Fetch products
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('status', 'APPROVED');
    if (category) params.append('category', category);
    if (search) params.append('search', search);

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
  const buildUrl = (params: { page?: number; category?: string; search?: string }) => {
    const urlParams = new URLSearchParams();
    if (params.category) urlParams.set('category', params.category);
    if (params.search) urlParams.set('search', params.search);
    if (params.page && params.page > 1) urlParams.set('page', params.page.toString());
    const queryString = urlParams.toString();
    return `/products${queryString ? `?${queryString}` : ''}`;
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

        <main className="flex-grow">
          {/* Hero Section with Search */}
          <section className="bg-gradient-to-b from-[#1a1a1a] to-black py-12 border-b border-[#ff6600]/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-white text-4xl md:text-5xl font-bold mb-4 text-center">
                {selectedCategory ? `Shop ${getCategoryName(selectedCategory)}` : 'Shop Products Online'}
              </h1>
              <p className="text-[#ffcc99] text-lg text-center mb-8 max-w-2xl mx-auto">
                {selectedCategory
                  ? `Browse ${total} ${getCategoryName(selectedCategory)} products from verified Nigerian sellers`
                  : `Discover ${total.toLocaleString()} products with same-day delivery in Lagos`}
              </p>

              {/* Search Bar */}
              <form action="/products" method="GET" className="max-w-2xl mx-auto">
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="search"
                    defaultValue={searchQuery}
                    placeholder="Search products..."
                    className="flex-1 px-6 py-4 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:border-[#ff6600]"
                  />
                  {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
                  <button
                    type="submit"
                    className="px-8 py-4 bg-[#ff6600] text-black font-bold rounded-xl hover:bg-[#cc5200] transition"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Trust Badges */}
          <section className="bg-[#1a1a1a] py-6 border-b border-[#ff6600]/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Truck className="w-5 h-5 text-[#ff6600]" />
                  <span className="text-[#ffcc99] text-sm">Same-Day Delivery Lagos</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="text-[#ffcc99] text-sm">Buyer Protection</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Star className="w-5 h-5 text-[#ff6600]" />
                  <span className="text-[#ffcc99] text-sm">Verified Sellers</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Package className="w-5 h-5 text-[#ff6600]" />
                  <span className="text-[#ffcc99] text-sm">Secure Packaging</span>
                </div>
              </div>
            </div>
          </section>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar - Categories */}
              <aside className="lg:w-64 flex-shrink-0">
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 sticky top-24">
                  <h2 className="text-white font-bold text-lg mb-4">Categories</h2>
                  <nav aria-label="Product categories">
                    <ul className="space-y-2">
                      <li>
                        <Link
                          href="/products"
                          className={`block px-4 py-2 rounded-lg transition ${
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
                              className={`block px-4 py-2 rounded-lg transition ${
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

                  {/* Why Shop Here */}
                  <div className="mt-8 pt-6 border-t border-[#ff6600]/30">
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
              <div className="flex-1">
                {/* Results Header */}
                <div className="flex items-center justify-between mb-6">
                  <p className="text-[#ffcc99]">
                    Showing <span className="text-white font-bold">{products.length}</span> of{' '}
                    <span className="text-white font-bold">{total.toLocaleString()}</span> products
                    {selectedCategory && (
                      <>
                        {' '}in <span className="text-[#ff6600]">{getCategoryName(selectedCategory)}</span>
                      </>
                    )}
                  </p>
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
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                    aria-label="Products"
                    itemScope
                    itemType="https://schema.org/ItemList"
                  >
                    <meta itemProp="numberOfItems" content={total.toString()} />
                    {products.map((product, index) => (
                      <article
                        key={product.id}
                        className="group bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl overflow-hidden hover:border-[#ff6600] transition"
                        itemScope
                        itemType="https://schema.org/Product"
                        itemProp="itemListElement"
                      >
                        <meta itemProp="position" content={(index + 1).toString()} />
                        <Link href={`/products/${product.id}`} className="block">
                          {/* Product Image */}
                          <div className="aspect-square bg-black relative overflow-hidden">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0]}
                                alt={product.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                itemProp="image"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#ffcc99]">
                                No Image
                              </div>
                            )}
                            {product.quantity === 0 && (
                              <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                                <span className="text-red-400 font-bold">Out of Stock</span>
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="p-4">
                            <h3
                              className="text-white font-medium text-sm mb-1 line-clamp-2 group-hover:text-[#ff6600] transition"
                              itemProp="name"
                            >
                              {product.title}
                            </h3>
                            <p className="text-[#ffcc99]/70 text-xs mb-2" itemProp="brand">
                              {product.seller.businessName}
                            </p>
                            <div itemProp="offers" itemScope itemType="https://schema.org/Offer">
                              <p className="text-[#ff6600] font-bold text-lg" itemProp="price" content={(product.price / 100).toString()}>
                                {formatPrice(product.price)}
                              </p>
                              <meta itemProp="priceCurrency" content="NGN" />
                              <link
                                itemProp="availability"
                                href={product.quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'}
                              />
                            </div>
                          </div>
                        </Link>
                      </article>
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
                  <nav className="mt-8 flex justify-center items-center gap-2" aria-label="Pagination">
                    {currentPage > 1 && (
                      <Link
                        href={buildUrl({ category: selectedCategory, search: searchQuery, page: currentPage - 1 })}
                        className="p-2 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white hover:border-[#ff6600] transition"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="w-5 h-5" />
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
                          className={`w-10 h-10 flex items-center justify-center rounded-xl font-medium transition ${
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
                        className="p-2 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white hover:border-[#ff6600] transition"
                        aria-label="Next page"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    )}
                  </nav>
                )}

                {/* SEO Content Section */}
                <section className="mt-16 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-8">
                  <h2 className="text-white text-2xl font-bold mb-4">
                    {selectedCategory
                      ? `Buy ${getCategoryName(selectedCategory)} Online in Nigeria`
                      : 'Online Shopping in Nigeria Made Easy'}
                  </h2>
                  <div className="text-[#ffcc99] space-y-4">
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
                          Carryofy is Nigeria&apos;s premier AI-powered e-commerce platform connecting buyers with verified sellers
                          across the country. With over {total.toLocaleString()} products available, we offer everything from
                          electronics and fashion to groceries and home goods.
                        </p>
                        <p>
                          What sets Carryofy apart is our integrated logistics network offering same-day delivery in Lagos and
                          fast, reliable shipping across Nigeria. Every product is inspected at our fulfillment centers ensuring
                          quality and authenticity.
                        </p>
                        <p>
                          Whether you&apos;re looking to buy or sell, Carryofy provides a secure, seamless experience with multiple
                          payment options, buyer protection, and 24/7 customer support. Join thousands of satisfied customers
                          shopping on Nigeria&apos;s most trusted marketplace.
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
      </div>
    </>
  );
}

