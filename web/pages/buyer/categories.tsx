import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import apiClient from '../../lib/api/client';
import { ArrowRight, Package } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  color: string;
  productCount?: number;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState<{ [key: string]: number }>({});

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
      fetchCategoryCounts();
    }
  }, [mounted]);

  const fetchCategoryCounts = async () => {
    try {
      setLoading(true);
      // Fetch products to count by category
      const response = await apiClient.get('/products?limit=1000');
      console.log('API Response:', response.data);
      // Fix: API wraps response in data.data.products
      const products = response.data.data?.products || response.data.products || [];
      console.log('Products fetched:', products.length);
      console.log('Sample product:', products[0]);
      
      // Count products per category
      const counts: { [key: string]: number } = {};
      products.forEach((product: { category?: string }) => {
        if (product.category) {
          counts[product.category] = (counts[product.category] || 0) + 1;
          console.log(`Added product to category: ${product.category}`);
        } else {
          console.log('Product without category:', product);
        }
      });
      
      console.log('Final counts:', counts);
      setCategoryCounts(counts);
    } catch (error) {
      console.error('Error fetching category counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories: Category[] = [
    {
      id: 'grains',
      name: 'Grains & Cereals',
      description: 'Rice, corn, millet, and other grain products from local farms',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
      color: 'from-orange-900/50 to-black',
    },
    {
      id: 'oils',
      name: 'Oils & Fats',
      description: 'Palm oil, vegetable oil, and traditional cooking oils',
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80',
      color: 'from-amber-900/50 to-black',
    },
    {
      id: 'packaged',
      name: 'Packaged Foods',
      description: 'Garri, ready-to-eat meals, and packaged snacks',
      image: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=600&q=80',
      color: 'from-yellow-900/50 to-black',
    },
    {
      id: 'spices',
      name: 'Spices & Seasonings',
      description: 'Ground pepper, curry, thyme, and traditional spice blends',
      image: 'https://images.unsplash.com/photo-1596040033229-a0b13b0c6c67?w=600&q=80',
      color: 'from-red-900/50 to-black',
    },
    {
      id: 'beverages',
      name: 'Beverages',
      description: 'Zobo, kunu, and traditional drink ingredients',
      image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80',
      color: 'from-orange-800/50 to-black',
    },
    {
      id: 'personal-care',
      name: 'Personal Care',
      description: 'Shea butter, black soap, and natural skincare products',
      image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80',
      color: 'from-orange-700/50 to-black',
    },
  ];

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              const productCount = categoryCounts[category.id] || 0;
              
              return (
                <Link
                  key={category.id}
                  href={`/buyer/products?category=${category.id}`}
                  className="group relative bg-[#1a1a1a] border border-[#ff6600]/30 rounded-2xl overflow-hidden hover:border-[#ff6600] transition-all duration-300 hover:shadow-lg hover:shadow-[#ff6600]/20"
                >
                  {/* Category Image */}
                  <div className="relative h-48 overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center transform group-hover:scale-110 transition-transform duration-300"
                      style={{ backgroundImage: `url(${category.image})` }}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-b ${category.color} group-hover:opacity-75 transition`}></div>
                    
                    {/* Product Count Badge */}
                    {!loading && (
                      <div className="absolute top-4 right-4 bg-[#ff6600] text-black px-3 py-1 rounded-full font-bold text-sm">
                        {productCount} {productCount === 1 ? 'product' : 'products'}
                      </div>
                    )}
                    
                    {loading && (
                      <div className="absolute top-4 right-4 bg-[#1a1a1a]/80 text-[#ffcc99] px-3 py-1 rounded-full text-sm">
                        Loading...
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
                    
                    <p className="text-[#ffcc99]/80 text-sm mb-4">
                      {category.description}
                    </p>

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

          {/* Empty State */}
          {!loading && Object.keys(categoryCounts).length === 0 && (
            <div className="mt-12 text-center p-12 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-2xl">
              <Package className="w-16 h-16 text-[#ffcc99] mx-auto mb-4" />
              <h3 className="text-white text-xl font-bold mb-2">No Products Yet</h3>
              <p className="text-[#ffcc99]/80">
                Products will appear here once sellers start listing them.
              </p>
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

