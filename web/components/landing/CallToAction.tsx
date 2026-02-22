import Link from 'next/link';
import { motion } from 'framer-motion';

export default function CallToAction() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-[#FF6B00]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-inter text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8"
          >
            Buy or sell online with confidence.
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link
              href="/buyer/products"
              className="px-8 py-4 bg-white text-[#111111] rounded-xl font-bold hover:bg-gray-100 transition-colors"
            >
              Start Shopping
            </Link>
            <Link
              href="/merchant-onboarding"
              className="px-8 py-4 border-2 border-[#111111] text-white rounded-xl font-bold hover:bg-[#111111] transition-colors"
            >
              Sell on Carryofy
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
