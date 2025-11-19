import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import { Search } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  image: string;
  color: string;
}

export default function BuyerDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Categories with brand-themed colors
  const categories: Category[] = [
    {
      id: 'grains',
      name: 'Grains',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
      color: 'bg-gradient-to-br from-orange-900/50 to-black',
    },
    {
      id: 'oils',
      name: 'Oils',
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
      color: 'bg-gradient-to-br from-amber-900/50 to-black',
    },
    {
      id: 'packaged',
      name: 'Packaged Foods',
      image: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=400&q=80',
      color: 'bg-gradient-to-br from-yellow-900/50 to-black',
    },
    {
      id: 'spices',
      name: 'Spices',
      image: 'https://images.unsplash.com/photo-1596040033229-a0b13b0c6c67?w=400&q=80',
      color: 'bg-gradient-to-br from-red-900/50 to-black',
    },
    {
      id: 'beverages',
      name: 'Beverages',
      image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80',
      color: 'bg-gradient-to-br from-orange-800/50 to-black',
    },
    {
      id: 'personal-care',
      name: 'Personal Care',
      image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80',
      color: 'bg-gradient-to-br from-orange-700/50 to-black',
    },
  ];

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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/buyer/products?category=${category.id}`}
                  className="group"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden border border-[#ff6600]/30 hover:border-[#ff6600] transition">
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${category.image})` }}
                    />
                    <div className={`absolute inset-0 ${category.color} group-hover:opacity-75 transition`}></div>
                    <div className="relative h-full flex items-end p-4">
                      <h3 className="text-white font-bold text-sm md:text-base">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </BuyerLayout>
    </>
  );
}

