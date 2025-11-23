import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import { ArrowRight, Package } from 'lucide-react';
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
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2">
              Product Categories
            </h1>
            <p className="text-[#ffcc99] text-lg">
              Explore our wide range of product categories from trusted sellers
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
                .map((category) => {
                  const productCount = category.productCount || 0;
                  
                  return (
                    <Link
                      key={category.id}
                      href={`/buyer/products?category=${category.slug}`}
                      className="group relative bg-[#1a1a1a] border border-[#ff6600]/30 rounded-2xl overflow-hidden hover:border-[#ff6600] transition-all duration-300 hover:shadow-lg hover:shadow-[#ff6600]/20"
                    >
                      {/* Category Image */}
                      <div className="relative h-48 overflow-hidden">
                        {category.icon ? (
                          <div
                            className="absolute inset-0 bg-cover bg-center transform group-hover:scale-110 transition-transform duration-300"
                            style={{ backgroundImage: `url(${category.icon})` }}
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-[#ff6600]/20 to-black flex items-center justify-center">
                            <Package className="w-16 h-16 text-[#ff6600]/50" />
                          </div>
                        )}
                        {category.color && (
                          <div 
                            className="absolute inset-0 opacity-50 group-hover:opacity-75 transition"
                            style={{ backgroundColor: category.color }}
                          />
                        )}
                        
                        {/* Product Count Badge */}
                        {productCount > 0 && (
                          <div className="absolute top-4 right-4 bg-[#ff6600] text-black px-3 py-1 rounded-full font-bold text-sm">
                            {productCount} {productCount === 1 ? 'product' : 'products'}
                          </div>
                        )}
                      </div>

                      {/* Category Details */}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h2 className="text-white text-xl font-bold group-hover:text-[#ff6600] transition">
                            {category.name}
                          </h2>
                          <ArrowRight className="w-5 h-5 text-[#ff6600] transform group-hover:translate-x-1 transition" />
                        </div>
                        
                        {category.description && (
                          <p className="text-[#ffcc99]/80 text-sm mb-4">
                            {category.description}
                          </p>
                        )}

                        {/* Browse Button */}
                        <div className="flex items-center gap-2 text-[#ff6600] font-medium text-sm group-hover:gap-3 transition-all">
                          <Package className="w-4 h-4" />
                          <span>Browse Products</span>
                        </div>
                      </div>
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

