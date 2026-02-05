import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  ShoppingBag, 
  Grid3x3,
  Smartphone,
  Shirt,
  UtensilsCrossed,
  Book,
  Home,
  Sparkles,
  Dumbbell,
  Gamepad2,
  Car,
  Heart,
  ShirtIcon,
  Sofa,
  Zap,
  Tent,
  Sprout,
  Briefcase,
  PawPrint,
  Baby,
  Package
} from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Product } from '../../types/product';
import ProductCard from '../common/ProductCard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com/api/v1';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  productCount?: number;
  displayOrder?: number;
}

interface ProductCategoriesProps {
  categories?: Category[];
  products?: Product[];
}

// Category icons mapping - using Lucide React icons
const categoryIcons: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  'electronics': Smartphone,
  'clothing': Shirt,
  'food': UtensilsCrossed,
  'books': Book,
  'home': Home,
  'beauty': Sparkles,
  'sports': Dumbbell,
  'toys': Gamepad2,
  'automotive': Car,
  'health': Heart,
  'fashion': ShirtIcon,
  'accessories': ShoppingBag,
  'furniture': Sofa,
  'appliances': Zap,
  'outdoor': Tent,
  'garden': Sprout,
  'office': Briefcase,
  'pet': PawPrint,
  'baby': Baby,
};

// Helper function to get icon component
const getCategoryIcon = (categoryKey: string): React.ComponentType<{ className?: string; size?: number }> => {
  const IconComponent = categoryIcons[categoryKey.toLowerCase()];
  return IconComponent || Package;
};

export default function ProductCategories({ categories: initialCategories, products: initialProducts }: ProductCategoriesProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [loading, setLoading] = useState(!initialCategories && !initialProducts);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!initialCategories && !initialProducts) {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories and products in parallel
      const [categoriesRes, productsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/categories`).catch(() => ({ data: { categories: [] } })),
        axios.get(`${API_BASE_URL}/products`, {
          params: { status: 'ACTIVE', limit: 20, page: 1 },
        }).catch(() => ({ data: { products: [] } })),
      ]);

      const categoriesData = categoriesRes.data?.data?.categories || categoriesRes.data?.categories || [];
      const productsData = productsRes.data?.data?.products || productsRes.data?.products || [];

      setCategories(categoriesData);
      setProducts(productsData.map((p: any) => ({
        ...p,
        name: p.title || p.name,
        stockQuantity: p.quantity ?? p.stockQuantity ?? 0,
      })));
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Beta: only 1–2 core verticals active; rest shown as "Coming Soon"
  const BETA_ACTIVE_COUNT = 2;
  const sortedCategories = [...categories].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const activeCategories = sortedCategories.slice(0, BETA_ACTIVE_COUNT);
  const comingSoonCategories = sortedCategories.slice(BETA_ACTIVE_COUNT);
  const totalCategories = categories.length;
  const categoriesToShow = showAll ? sortedCategories : sortedCategories.slice(0, Math.max(BETA_ACTIVE_COUNT + 2, 4)); // show a few "Coming Soon" in view

  // For small catalogs (less than 5 categories), show individual products instead
  const shouldShowProducts = totalCategories < 5 && products.length > 0;

  if (loading) {
    return (
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Show individual products for small catalogs
  if (shouldShowProducts) {
    return (
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-purple-500/10 px-4 py-2 rounded-full border border-primary/20 mb-4"
            >
              <ShoppingBag className="w-4 h-4 text-primary" />
              <span className="text-primary font-semibold tracking-wider uppercase text-xs sm:text-sm">
                Shop by Category
              </span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold mt-2 mb-3 sm:mb-4 text-gray-900"
            >
              Explore Popular Products
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg"
            >
              Discover a wide variety of quality products from trusted sellers
            </motion.p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {products.slice(0, 8).map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <ProductCard
                  product={{
                    id: product.id,
                    title: (product as any).title || product.name || 'Product',
                    price: product.price,
                    images: product.images || [],
                    quantity: product.stockQuantity || (product as any).quantity || 0,
                    status: product.status,
                    seller: {
                      id: product.sellerId || product.seller?.id || '',
                      businessName: product.seller?.businessName || 'Seller',
                    },
                    keyFeatures: (product as any).keyFeatures,
                    category: product.category,
                  }}
                  href={`/products/${product.id}`}
                  showFeatures={false}
                />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 sm:mt-12 text-center"
          >
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary to-orange-600 text-white rounded-full font-bold hover:shadow-lg hover:shadow-primary/40 transition-all duration-300 text-sm sm:text-base"
            >
              View All Products
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    );
  }

  // Show categories for normal catalogs
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-purple-500/10 px-4 py-2 rounded-full border border-primary/20 mb-4"
          >
            <Grid3x3 className="w-4 h-4 text-primary" />
            <span className="text-primary font-semibold tracking-wider uppercase text-xs sm:text-sm">
              Shop by Category
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold mt-2 mb-3 sm:mb-4 text-gray-900"
          >
            Browse by Product Type
            </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg"
          >
            Explore our diverse range of product categories and find exactly what you're looking for
          </motion.p>
        </div>

        {/* Desktop: Grid layout with icons — first 2 active, rest Coming Soon */}
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {categoriesToShow.map((category, index) => {
            const IconComponent = category.icon 
              ? getCategoryIcon(category.icon) 
              : getCategoryIcon(category.slug.toLowerCase()) || getCategoryIcon(category.name.toLowerCase());
            const bgColor = category.color || '#ff6600';
            const isActive = activeCategories.some((c) => c.id === category.id);

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={isActive ? { y: -4 } : undefined}
              >
                {isActive ? (
                  <Link
                    href={`/products?category=${category.slug}`}
                    className="block bg-white rounded-xl p-4 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300"
                        style={{ backgroundColor: `${bgColor}15` }}
                      >
                        <div style={{ color: bgColor }}>
                          <IconComponent className="w-8 h-8 sm:w-10 sm:h-10" />
                        </div>
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors line-clamp-2">
                        {category.name}
                      </h3>
                      {category.productCount !== undefined && (
                        <p className="text-xs sm:text-sm text-gray-500">
                          {category.productCount} {category.productCount === 1 ? 'product' : 'products'}
                        </p>
                      )}
                    </div>
                  </Link>
                ) : (
                  <div className="block bg-gray-100 rounded-xl p-4 sm:p-6 border border-gray-200 opacity-75 cursor-default">
                    <div className="flex flex-col items-center text-center">
                      <div
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-3 sm:mb-4"
                        style={{ backgroundColor: `${bgColor}15` }}
                      >
                        <div style={{ color: bgColor }}>
                          <IconComponent className="w-8 h-8 sm:w-10 sm:h-10" />
                        </div>
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-gray-600 line-clamp-2">
                        {category.name}
                      </h3>
                      <span className="text-xs font-medium text-gray-500 mt-1 px-2 py-0.5 bg-gray-200 rounded-full">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Mobile: Text links — first 2 active, rest Coming Soon */}
        <div className="sm:hidden space-y-2">
          {categoriesToShow.map((category, index) => {
            const IconComponent = category.icon 
              ? getCategoryIcon(category.icon) 
              : getCategoryIcon(category.slug.toLowerCase()) || getCategoryIcon(category.name.toLowerCase());
            const bgColor = category.color || '#ff6600';
            const isActive = activeCategories.some((c) => c.id === category.id);

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
              >
                {isActive ? (
                  <Link
                    href={`/products?category=${category.slug}`}
                    className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all border border-gray-100 group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="shrink-0" style={{ color: bgColor }}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors truncate">
                          {category.name}
                        </h3>
                        {category.productCount !== undefined && (
                          <p className="text-xs text-gray-500">
                            {category.productCount} {category.productCount === 1 ? 'product' : 'products'}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" />
                  </Link>
                ) : (
                  <div className="flex items-center justify-between bg-gray-100 rounded-lg p-3 border border-gray-200 opacity-75">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="shrink-0" style={{ color: bgColor }}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-600 truncate">
                          {category.name}
                        </h3>
                        <span className="text-xs text-gray-500">Coming Soon</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Show more/less toggle if there are more categories */}
        {totalCategories > categoriesToShow.length && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 sm:mt-10 text-center"
          >
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-2 px-6 py-3 text-primary font-semibold hover:text-primary-dark transition-colors text-sm sm:text-base"
            >
              {showAll ? (
                <>
                  Show Less
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              ) : (
                <>
                  View All {totalCategories} Categories
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* View All Products Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 sm:mt-10 text-center"
        >
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary to-orange-600 text-white rounded-full font-bold hover:shadow-lg hover:shadow-primary/40 transition-all duration-300 text-sm sm:text-base"
          >
            View All Products
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

