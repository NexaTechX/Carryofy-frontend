import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Star } from 'lucide-react';

const products = [
  {
    id: 1,
    name: 'Wireless Headphones',
    price: '₦45,000',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
    category: 'Electronics',
    rating: 4.8,
  },
  {
    id: 2,
    name: 'Smart Watch Series 5',
    price: '₦85,000',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
    category: 'Wearables',
    rating: 4.9,
  },
  {
    id: 3,
    name: 'Premium Sneakers',
    price: '₦35,000',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
    category: 'Fashion',
    rating: 4.7,
  },
  {
    id: 4,
    name: 'Designer Backpack',
    price: '₦25,000',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80',
    category: 'Accessories',
    rating: 4.6,
  },
];

export default function FeaturedProducts() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-primary font-semibold tracking-wider uppercase text-xs sm:text-sm"
          >
            Trending Now
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold mt-2 mb-3 sm:mb-4 text-gray-900"
          >
            Featured Products
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg"
          >
            Discover the hottest items being delivered by Carryofy today.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-8">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-md sm:shadow-lg hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 group border border-gray-100"
            >
              <div className="relative h-40 sm:h-52 lg:h-64 bg-gray-100 overflow-hidden">
                {/* Placeholder for actual images */}
                <div className="absolute inset-0 bg-gray-200 animate-pulse group-hover:animate-none transition-all"></div>
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-white/90 backdrop-blur rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold text-gray-900 shadow-sm flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400 fill-yellow-400" />
                  {product.rating}
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-center justify-center">
                  <button className="bg-white text-gray-900 px-4 sm:px-6 py-2 rounded-full font-bold transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-primary hover:text-white text-sm">
                    View Details
                  </button>
                </div>
              </div>

              <div className="p-3 sm:p-4 lg:p-6">
                <div className="text-[10px] sm:text-xs text-primary font-semibold mb-1 sm:mb-2 uppercase tracking-wide">{product.category}</div>
                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
                <div className="flex items-center justify-between mt-2 sm:mt-4">
                  <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">{product.price}</span>
                  <button className="p-1.5 sm:p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-primary hover:text-white transition-colors touch-target btn-mobile">
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 sm:mt-12 lg:mt-16 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-primary font-bold hover:text-primary-dark transition-colors group text-base sm:text-lg touch-target"
          >
            View All Products
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
