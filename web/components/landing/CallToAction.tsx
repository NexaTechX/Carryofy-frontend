import Link from 'next/link';
import { motion } from 'framer-motion';

export default function CallToAction() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-primary via-primary-dark to-primary relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 sm:mb-8 leading-tight"
          >
            Buy or sell online with confidence.
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link
              href="/buyer/products"
              className="px-8 py-4 bg-white text-gray-900 rounded-xl font-bold text-base sm:text-lg hover:shadow-2xl transition-all duration-300"
            >
              Start Shopping
            </Link>
            <Link
              href="/merchant-onboarding"
              className="px-8 py-4 bg-gray-900 text-white rounded-xl font-bold text-base sm:text-lg hover:bg-gray-800 transition-all duration-300"
            >
              Sell on Carryofy
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
