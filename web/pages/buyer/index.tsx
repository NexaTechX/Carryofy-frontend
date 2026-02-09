import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import { Search, Package } from 'lucide-react';
import { useCategories } from '../../lib/buyer/hooks/useCategories';
import { categoryDisplayName } from '../../lib/buyer/categoryDisplay';

export default function BuyerDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/buyer/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Default fallback image and color for categories without them
  const getCategoryImage = (category: typeof categories[0]) => {
    return category.icon || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80';
  };

  const getCategoryColor = (category: typeof categories[0]) => {
    if (category.color) {
      return `bg-gradient-to-br from-[${category.color}]/50 to-black`;
    }
    return 'bg-gradient-to-br from-orange-900/50 to-black';
  };

  return (
    <>
      <Head>
        <title>Dashboard - Buyer | Carryofy</title>
        <meta
          name="description"
          content="Shop for trusted products from verified sellers on Carryofy."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <BuyerLayout>
        <div>
          {/* Hero Section */}
          <div
            className="relative rounded-2xl overflow-hidden mb-8"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&q=80)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
            <div className="relative px-8 py-16 md:py-24">
              <h1 className="text-white text-3xl md:text-5xl font-bold mb-4 max-w-2xl">
                Buy trusted products from verified sellers.
              </h1>
              <p className="text-[#ffcc99] text-lg md:text-xl mb-8 max-w-xl">
                Discover a wide range of high-quality products from local sellers you can trust.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="max-w-2xl">
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center bg-[#1a1a1a] rounded-xl border border-[#ff6600]/30">
                    <Search className="w-5 h-5 text-[#ffcc99] mx-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for products"
                      className="flex-1 bg-transparent text-white placeholder:text-[#ffcc99] py-4 pr-4 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-[#ff6600] hover:bg-[#cc5200] text-black px-8 py-4 rounded-xl font-bold transition"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Categories Section */}
          <div className="mb-12">
            <h2 className="text-white text-2xl md:text-3xl font-bold mb-6">Categories</h2>
            {categoriesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-[#ffcc99]">Loading categories...</div>
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="w-16 h-16 text-[#ffcc99]/50 mb-4" />
                <p className="text-[#ffcc99]/70 text-lg">No categories available yet</p>
                <p className="text-[#ffcc99]/50 text-sm mt-2">Check back later for new categories</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories
                  .filter(cat => cat.isActive)
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((category) => (
                    <Link
                      key={category.id}
                      href={`/buyer/products?category=${category.slug}`}
                      className="group"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden border border-[#ff6600]/30 hover:border-[#ff6600] transition">
                        {category.icon ? (
                          <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${category.icon})` }}
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-[#ff6600]/20 to-black flex items-center justify-center">
                            <Package className="w-12 h-12 text-[#ff6600]/50" />
                          </div>
                        )}
                        {category.color && (
                          <div 
                            className="absolute inset-0 opacity-50 group-hover:opacity-75 transition"
                            style={{ backgroundColor: category.color }}
                          />
                        )}
                        <div className="relative h-full flex items-end p-4">
                          <h3 className="text-white font-bold text-sm md:text-base drop-shadow-lg">
                            {categoryDisplayName(category.slug, category.name)}
                          </h3>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>
        </div>
      </BuyerLayout>
    </>
  );
}

