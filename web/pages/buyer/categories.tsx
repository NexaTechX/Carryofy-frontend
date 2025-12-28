import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import { ArrowRight, Package, Sparkles, TrendingUp, Star, Zap } from 'lucide-react';
import { useCategories } from '../../lib/buyer/hooks/useCategories';

export default function CategoriesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const categories = categoriesData?.categories || [];

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


  if (!mounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Product Categories - Buyer | Carryofy</title>
        <meta
          name="description"
          content="Browse product categories and find trusted products from verified sellers on Carryofy."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <BuyerLayout>
        <div>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-8 h-8 text-[#ff6600]" />
              <h1 className="text-white text-3xl md:text-4xl font-bold">
                Shop by Category
              </h1>
            </div>
            <p className="text-[#ffcc99] text-lg">
              Discover amazing products from verified sellers - Same-day delivery available!
            </p>
          </div>

          {/* Categories Grid */}
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-[#ffcc99]">Loading categories...</div>
            </div>
          ) : categories.length === 0 ? (
            <div className="mt-12 text-center p-12 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-2xl">
              <Package className="w-16 h-16 text-[#ffcc99] mx-auto mb-4" />
              <h3 className="text-white text-xl font-bold mb-2">No Categories Yet</h3>
              <p className="text-[#ffcc99]/80">
                Categories will appear here once they are created by administrators.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories
                .filter(cat => cat.isActive)
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((category, index) => {
                  const productCount = category.productCount || 0;
                  const isPopular = productCount > 50;
                  const isNew = index < 3;
                  
                  return (
                    <Link
                      key={category.id}
                      href={`/buyer/products?category=${category.slug}`}
                      className="group relative bg-gradient-to-br from-[#1a1a1a] via-[#1a1a1a] to-black border-2 border-[#ff6600]/30 rounded-3xl overflow-hidden hover:border-[#ff6600] transition-all duration-500 hover:shadow-2xl hover:shadow-[#ff6600]/30 hover:-translate-y-2 transform"
                    >
                      {/* Promotional Badge */}
                      {isPopular && (
                        <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-[#ff6600] to-[#ff8800] text-black px-4 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-lg">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Popular</span>
                        </div>
                      )}
                      {isNew && !isPopular && (
                        <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-lg">
                          <Zap className="w-3.5 h-3.5" />
                          <span>New</span>
                        </div>
                      )}

                      {/* Category Image/Background */}
                      <div className="relative h-56 overflow-hidden">
                        {category.icon ? (
                          <>
                            <div
                              className="absolute inset-0 bg-cover bg-center transform group-hover:scale-125 transition-transform duration-700"
                              style={{ backgroundImage: `url(${category.icon})` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                          </>
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-[#ff6600]/30 via-[#ff6600]/10 to-black flex items-center justify-center">
                            <div className="relative">
                              <Package className="w-20 h-20 text-[#ff6600]/60 group-hover:text-[#ff6600] transition-colors" />
                              <div className="absolute inset-0 bg-[#ff6600]/20 rounded-full blur-2xl group-hover:bg-[#ff6600]/40 transition-colors" />
                            </div>
                          </div>
                        )}
                        {category.color && (
                          <div 
                            className="absolute inset-0 opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                            style={{ 
                              background: `linear-gradient(135deg, ${category.color}40 0%, transparent 100%)`
                            }}
                          />
                        )}
                        
                        {/* Product Count Badge */}
                        {productCount > 0 && (
                          <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm border-2 border-[#ff6600] text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg group-hover:bg-[#ff6600] group-hover:text-black transition-all">
                            <Star className="w-4 h-4 fill-[#ff6600] group-hover:fill-black transition-colors" />
                            <span>{productCount}+ Items</span>
                          </div>
                        )}

                        {/* Promotional Text Overlay */}
                        <div className="absolute bottom-4 left-4 right-4 z-10">
                          <div className="bg-gradient-to-r from-[#ff6600]/90 to-[#ff8800]/90 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                            <p className="text-white font-bold text-sm flex items-center gap-2">
                              <Sparkles className="w-4 h-4" />
                              Shop Now & Save!
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Category Details */}
                      <div className="p-6 bg-gradient-to-b from-transparent to-[#1a1a1a]">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h2 className="text-white text-2xl font-bold mb-1 group-hover:text-[#ff6600] transition-colors">
                              {category.name}
                            </h2>
                            {category.description && (
                              <p className="text-[#ffcc99]/70 text-sm line-clamp-2">
                                {category.description}
                              </p>
                            )}
                          </div>
                          <div className="ml-4 p-3 bg-[#ff6600]/20 rounded-xl group-hover:bg-[#ff6600] transition-all">
                            <ArrowRight className="w-6 h-6 text-[#ff6600] group-hover:text-black transform group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                        
                        {/* Call to Action */}
                        <div className="mt-4 pt-4 border-t border-[#ff6600]/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[#ffcc99] text-sm">
                              <Package className="w-4 h-4" />
                              <span>Browse Collection</span>
                            </div>
                            <div className="text-[#ff6600] font-bold text-sm group-hover:scale-110 transition-transform">
                              Explore →
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Hover Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#ff6600]/0 via-[#ff6600]/0 to-[#ff6600]/0 group-hover:from-[#ff6600]/5 group-hover:via-[#ff6600]/10 group-hover:to-[#ff6600]/5 transition-all duration-500 pointer-events-none rounded-3xl" />
                    </Link>
                  );
                })}
            </div>
          )}

          {/* Quick Action */}
          <div className="mt-12 bg-gradient-to-r from-[#ff6600]/10 to-transparent border border-[#ff6600]/30 rounded-2xl p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-white text-2xl font-bold mb-2">
                  Can&apos;t find what you&apos;re looking for?
                </h3>
                <p className="text-[#ffcc99]">
                  Browse all products or use the search to find specific items
                </p>
              </div>
              <Link
                href="/buyer/products"
                className="px-8 py-4 bg-[#ff6600] hover:bg-[#cc5200] text-black rounded-xl font-bold transition whitespace-nowrap"
              >
                View All Products
              </Link>
            </div>
          </div>
        </div>
      </BuyerLayout>
    </>
  );
}

