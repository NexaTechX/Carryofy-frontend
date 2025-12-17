import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import SEO from '../../components/seo/SEO';
import { ProductSchema, BreadcrumbSchema, FAQSchema } from '../../components/seo/JsonLd';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Store,
  Shield,
  Star,
  Truck,
  Package,
  CheckCircle,
  Clock,
  ArrowRight,
  Info,
  Droplets,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com/api/v1';
const SITE_URL = 'https://carryofy.com';

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
}

interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  authorName: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface RelatedProduct {
  id: string;
  title: string;
  price: number;
  images: string[];
  seller: { businessName: string };
}

interface ProductPageProps {
  product: Product | null;
  reviews: Review[];
  category: Category | null;
  relatedProducts: RelatedProduct[];
  error?: string;
}

// Full server-side rendering for SEO and AI readability
export const getServerSideProps: GetServerSideProps<ProductPageProps> = async ({ params }) => {
  const id = params?.id as string;

  if (!id) {
    return {
      props: {
        product: null,
        reviews: [],
        category: null,
        relatedProducts: [],
        error: 'Product ID not provided',
      },
    };
  }

  try {
    // Fetch product, reviews, and categories in parallel
    const [productRes, reviewsRes, categoriesRes] = await Promise.all([
      fetch(`${API_BASE_URL}/products/${id}`),
      fetch(`${API_BASE_URL}/products/${id}/reviews`),
      fetch(`${API_BASE_URL}/categories`),
    ]);

    if (!productRes.ok) {
      return {
        props: {
          product: null,
          reviews: [],
          category: null,
          relatedProducts: [],
          error: 'Product not found',
        },
      };
    }

    const productData = await productRes.json();
    const product: Product = productData.data || productData;

    let reviews: Review[] = [];
    if (reviewsRes.ok) {
      const reviewsData = await reviewsRes.json();
      reviews = reviewsData.data || reviewsData || [];
    }

    let category: Category | null = null;
    let relatedProducts: RelatedProduct[] = [];

    if (categoriesRes.ok) {
      const catData = await categoriesRes.json();
      const categories = catData.data?.categories || catData.categories || [];
      category = categories.find((c: Category) => c.slug === product.category) || null;
    }

    // Fetch related products from same category
    if (product.category) {
      try {
        const relatedRes = await fetch(
          `${API_BASE_URL}/products?category=${product.category}&limit=4&status=ACTIVE`
        );
        if (relatedRes.ok) {
          const relatedData = await relatedRes.json();
          const related = (relatedData.data?.products || relatedData.products || [])
            .filter((p: RelatedProduct) => p.id !== product.id)
            .slice(0, 4);
          relatedProducts = related;
        }
      } catch (e) {
        // Ignore related products error
      }
    }

    return {
      props: {
        product,
        reviews,
        category,
        relatedProducts,
      },
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return {
      props: {
        product: null,
        reviews: [],
        category: null,
        relatedProducts: [],
        error: 'Failed to load product',
      },
    };
  }
};

export default function PublicProductDetailPage({
  product,
  reviews,
  category,
  relatedProducts,
  error,
}: ProductPageProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const formatPrice = (priceInKobo: number) => {
    return `₦${(priceInKobo / 100).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getCategoryName = () => {
    return category?.name || product?.category || 'Products';
  };

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  // Generate keywords for this product
  const productKeywords = product
    ? [
        product.title,
        `buy ${product.title} Nigeria`,
        `buy ${product.title} online`,
        `${product.title} Lagos`,
        `${product.title} price Nigeria`,
        getCategoryName(),
        `buy ${getCategoryName()} online Nigeria`,
        product.seller?.businessName,
        'Carryofy',
        'same day delivery Lagos',
        'buy online Nigeria',
        'online shopping Nigeria',
        'fast delivery Nigeria',
        'verified seller Nigeria',
      ].filter(Boolean).join(', ')
    : '';

  // Product FAQ
  const productFaqs = product ? [
    {
      question: `Is this ${product.title} genuine?`,
      answer: `Yes, all products on Carryofy are sourced from verified sellers. This ${product.title} is sold by ${product.seller?.businessName}, a verified merchant on our platform. Products are inspected at our fulfillment center before shipping.`,
    },
    {
      question: `How fast will I receive this ${product.title}?`,
      answer: `Orders placed before 12pm qualify for same-day delivery in Lagos. For other areas in Nigeria, delivery typically takes 1-3 business days. You'll receive tracking information once your order ships.`,
    },
    {
      question: `Can I return this product?`,
      answer: `Yes, Carryofy offers a 7-day return policy. If you receive a damaged or incorrect item, contact our support team for a full refund or replacement.`,
    },
    {
      question: `Is it safe to buy on Carryofy?`,
      answer: `Absolutely. All transactions are encrypted and secure. We offer buyer protection on every purchase, multiple payment options, and a dedicated support team available 24/7.`,
    },
  ] : [];

  // Show 404-like page if product not found
  if (!product || error) {
    return (
      <>
        <SEO
          title="Product Not Found | Carryofy"
          description="The product you're looking for could not be found. Browse our catalog of thousands of products with same-day delivery in Lagos."
          noindex
        />
        <div className="min-h-screen flex flex-col bg-black">
          <Header />
          <main className="flex-grow flex items-center justify-center">
            <div className="text-center px-4">
              <Package className="w-24 h-24 text-[#ffcc99]/30 mx-auto mb-6" />
              <h1 className="text-white text-3xl font-bold mb-4">Product Not Found</h1>
              <p className="text-[#ffcc99] mb-8 max-w-md mx-auto">
                {error || "The product you're looking for doesn't exist or has been removed."}
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff6600] text-black font-bold rounded-xl hover:bg-[#cc5200] transition"
              >
                Browse Products
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title={`${product.title} - Buy Online in Nigeria | Carryofy`}
        description={`Buy ${product.title} online in Nigeria at ${formatPrice(product.price)}. ${product.description?.slice(0, 100) || 'Quality product'} Same-day delivery in Lagos. Sold by ${product.seller?.businessName || 'verified seller'} on Carryofy. Secure payment & buyer protection.`}
        keywords={productKeywords}
        canonical={`${SITE_URL}/products/${product.id}`}
        ogType="product"
        ogImage={product.images?.[0] || `${SITE_URL}/og/product.png`}
        ogImageAlt={product.title}
      />

      <ProductSchema
        name={product.title}
        description={product.description || `Buy ${product.title} online at Carryofy Nigeria`}
        image={product.images || []}
        price={product.price}
        currency="NGN"
        availability={product.quantity > 0 ? 'InStock' : 'OutOfStock'}
        sku={product.id}
        category={getCategoryName()}
        seller={{
          name: product.seller?.businessName || 'Carryofy Seller',
          url: `${SITE_URL}/seller/${product.seller?.id}`,
        }}
        rating={reviews.length > 0 ? { value: averageRating, count: reviews.length } : undefined}
        url={`${SITE_URL}/products/${product.id}`}
      />

      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Products', url: '/products' },
          ...(category ? [{ name: category.name, url: `/products?category=${category.slug}` }] : []),
          { name: product.title, url: `/products/${product.id}` },
        ]}
      />

      <FAQSchema faqs={productFaqs} />

      <div className="min-h-screen flex flex-col bg-black">
        <Header />

        <main className="flex-grow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm mb-6 flex-wrap" aria-label="Breadcrumb">
              <Link href="/" className="text-[#ffcc99] hover:text-[#ff6600] transition">
                Home
              </Link>
              <span className="text-[#ffcc99]/50">/</span>
              <Link href="/products" className="text-[#ffcc99] hover:text-[#ff6600] transition">
                Products
              </Link>
              {category && (
                <>
                  <span className="text-[#ffcc99]/50">/</span>
                  <Link
                    href={`/products?category=${category.slug}`}
                    className="text-[#ffcc99] hover:text-[#ff6600] transition"
                  >
                    {category.name}
                  </Link>
                </>
              )}
              <span className="text-[#ffcc99]/50">/</span>
              <span className="text-white truncate max-w-[200px]">{product.title}</span>
            </nav>

            {/* Product Details */}
            <article className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16" itemScope itemType="https://schema.org/Product">
              {/* Left Column - Images */}
              <div>
                {/* Main Image */}
                <div className="bg-[#1a1a1a] rounded-xl overflow-hidden mb-4 aspect-square relative border border-[#ff6600]/30">
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
                      <Package className="w-24 h-24 opacity-30" />
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
                {category && (
                  <div className="mb-4">
                    <Link
                      href={`/products?category=${category.slug}`}
                      className="inline-block px-3 py-1 bg-[#ff6600]/20 text-[#ff6600] rounded-full text-sm font-medium hover:bg-[#ff6600]/30 transition"
                    >
                      {category.name}
                    </Link>
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

                {/* Rating */}
                {reviews.length > 0 && (
                  <div className="flex items-center gap-2 mb-4" itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= Math.round(averageRating) ? 'text-[#ff6600] fill-[#ff6600]' : 'text-[#ffcc99]/30'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-white font-bold" itemProp="ratingValue">{averageRating.toFixed(1)}</span>
                    <span className="text-[#ffcc99]">
                      (<span itemProp="reviewCount">{reviews.length}</span> {reviews.length === 1 ? 'review' : 'reviews'})
                    </span>
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
                          <div className="w-10 h-10 bg-[#ff6600]/20 rounded-lg flex items-center justify-center flex-shrink-0">
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
                          <div className="w-10 h-10 bg-[#ff6600]/20 rounded-lg flex items-center justify-center flex-shrink-0">
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

                {/* Seller Info */}
                <div className="mb-6 p-4 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#ff6600]/20 rounded-full flex items-center justify-center">
                      <Store className="w-6 h-6 text-[#ff6600]" />
                    </div>
                    <div>
                      <p className="text-[#ffcc99] text-sm">Sold by</p>
                      <p className="text-white font-bold" itemProp="brand">{product.seller.businessName}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Verified Seller</span>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6 p-6 bg-gradient-to-r from-[#ff6600]/20 to-[#ff6600]/5 border border-[#ff6600]/30 rounded-xl" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[#ffcc99] text-sm mb-1">Price</p>
                      <p className="text-[#ff6600] text-4xl font-bold" itemProp="price" content={(product.price / 100).toString()}>
                        {formatPrice(product.price)}
                      </p>
                      <meta itemProp="priceCurrency" content="NGN" />
                    </div>
                    <div className="text-right">
                      <link itemProp="availability" href={product.quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'} />
                      {product.quantity > 0 ? (
                        <div className="flex items-center gap-2 text-green-400">
                          <Package className="w-5 h-5" />
                          <span className="font-bold">{product.quantity} in stock</span>
                        </div>
                      ) : (
                        <span className="text-red-400 font-bold">Out of Stock</span>
                      )}
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-[#ffcc99]">
                      <Truck className="w-4 h-4 text-[#ff6600]" />
                      <span>Same-day delivery in Lagos</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#ffcc99]">
                      <Clock className="w-4 h-4 text-[#ff6600]" />
                      <span>Order before 12pm</span>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3 mb-6">
                  <Link
                    href={`/auth/signup?redirect=/buyer/products/${product.id}`}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#ff6600] text-black rounded-xl font-bold text-lg hover:bg-[#cc5200] transition shadow-lg shadow-[#ff6600]/30"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Buy Now</span>
                  </Link>
                  <Link
                    href="/auth/login"
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#1a1a1a] text-white border-2 border-[#ff6600]/50 rounded-xl font-bold hover:bg-[#ff6600]/10 hover:border-[#ff6600] transition"
                  >
                    Sign In to Add to Cart
                  </Link>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-400" />
                    <span className="text-[#ffcc99] text-sm">Buyer Protection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#ff6600]" />
                    <span className="text-[#ffcc99] text-sm">Quality Checked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-[#ff6600]" />
                    <span className="text-[#ffcc99] text-sm">Fast Shipping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-[#ffcc99] text-sm">7-Day Returns</span>
                  </div>
                </div>
              </div>
            </article>

            {/* Reviews Section */}
            <section className="mb-16">
              <h2 className="text-white text-2xl font-bold mb-6">
                Customer Reviews {reviews.length > 0 && `(${reviews.length})`}
              </h2>

              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <article
                      key={review.id}
                      className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6"
                      itemScope
                      itemType="https://schema.org/Review"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#ff6600]/10 border border-[#ff6600]/40 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-lg">
                            {review.authorName.slice(0, 1).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-white font-semibold" itemProp="author">{review.authorName}</p>
                              <time className="text-[#ffcc99]/60 text-sm" itemProp="datePublished" dateTime={review.createdAt}>
                                {new Date(review.createdAt).toLocaleDateString('en-NG', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </time>
                            </div>
                            <div className="flex items-center gap-1" itemProp="reviewRating" itemScope itemType="https://schema.org/Rating">
                              <meta itemProp="ratingValue" content={review.rating.toString()} />
                              <meta itemProp="bestRating" content="5" />
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating ? 'text-[#ff6600] fill-[#ff6600]' : 'text-[#ffcc99]/30'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-[#ffcc99] leading-relaxed" itemProp="reviewBody">{review.comment}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-8 text-center">
                  <Star className="w-12 h-12 text-[#ffcc99]/30 mx-auto mb-4" />
                  <p className="text-white font-bold mb-2">No Reviews Yet</p>
                  <p className="text-[#ffcc99]">Be the first to review this product after purchase.</p>
                </div>
              )}
            </section>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <section className="mb-16">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-white text-2xl font-bold">Related Products</h2>
                  <Link
                    href={`/products?category=${product.category}`}
                    className="text-[#ff6600] hover:text-[#cc5200] flex items-center gap-1 transition"
                  >
                    View All <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {relatedProducts.map((related) => (
                    <Link
                      key={related.id}
                      href={`/products/${related.id}`}
                      className="group bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl overflow-hidden hover:border-[#ff6600] transition"
                    >
                      <div className="aspect-square bg-black relative overflow-hidden">
                        {related.images && related.images.length > 0 ? (
                          <img
                            src={related.images[0]}
                            alt={related.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-[#ffcc99]/30" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-white font-medium text-sm mb-1 line-clamp-2 group-hover:text-[#ff6600] transition">
                          {related.title}
                        </h3>
                        <p className="text-[#ffcc99]/70 text-xs mb-2">{related.seller.businessName}</p>
                        <p className="text-[#ff6600] font-bold">{formatPrice(related.price)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* FAQ Section */}
            <section className="mb-16">
              <h2 className="text-white text-2xl font-bold mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {productFaqs.map((faq, index) => (
                  <details
                    key={index}
                    className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl group"
                  >
                    <summary className="px-6 py-4 cursor-pointer text-white font-medium flex items-center justify-between hover:text-[#ff6600] transition">
                      {faq.question}
                      <ChevronRight className="w-5 h-5 transform group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="px-6 pb-4 text-[#ffcc99]">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </section>

            {/* SEO Content */}
            <section className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-8">
              <h2 className="text-white text-xl font-bold mb-4">
                Buy {product.title} Online in Nigeria
              </h2>
              <div className="text-[#ffcc99] space-y-4">
                <p>
                  Looking to buy {product.title} in Nigeria? Carryofy offers this product from {product.seller.businessName}, 
                  a verified seller on our platform. Get the best price of {formatPrice(product.price)} with same-day delivery 
                  available in Lagos.
                </p>
                <p>
                  All products on Carryofy are quality-checked at our fulfillment centers before shipping. We offer secure 
                  payment options, buyer protection on every purchase, and a 7-day return policy for your peace of mind.
                </p>
                <p>
                  Join thousands of satisfied customers who shop on Nigeria&apos;s most trusted e-commerce platform. 
                  Create an account today to buy {product.title} and enjoy fast, reliable delivery across Nigeria.
                </p>
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

