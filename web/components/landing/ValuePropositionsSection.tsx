import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Building2 } from 'lucide-react';

export default function ValuePropositionsSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="font-inter text-3xl sm:text-4xl lg:text-5xl font-bold text-[#111111] mb-4">
              Who is Carryofy for?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you're starting a side hustle or scaling your business, we've got you covered.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Side-Hustler */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group relative bg-gradient-to-br from-[#FF6B00]/5 to-white rounded-3xl p-8 sm:p-10 border-2 border-[#FF6B00]/10 hover:border-[#FF6B00]/30 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF6B00]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-[#FF6B00]/10 flex items-center justify-center mb-6">
                  <Sparkles className="w-7 h-7 text-[#FF6B00]" />
                </div>
                <h3 className="font-inter text-2xl sm:text-3xl font-bold text-[#111111] mb-3">
                  Start an Online Business without Holding Inventory.
                </h3>
                <p className="text-gray-600 leading-relaxed mb-8">
                  Don't have millions to buy stock? Browse our wholesale catalog, pick products you love, and start selling. We hold the inventory; you find the customers. We handle the rest.
                </p>
                <Link
                  href="/auth/signup?role=SELLER"
                  className="group/btn inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B00] text-white rounded-xl font-semibold hover:bg-[#E65F00] transition-colors shadow-lg shadow-[#FF6B00]/20"
                >
                  Start Selling Now
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* Small Business Owner */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group relative bg-gradient-to-br from-[#111111]/5 to-white rounded-3xl p-8 sm:p-10 border-2 border-gray-200 hover:border-[#111111]/20 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#111111]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-[#111111]/10 flex items-center justify-center mb-6">
                  <Building2 className="w-7 h-7 text-[#111111]" />
                </div>
                <h3 className="font-inter text-2xl sm:text-3xl font-bold text-[#111111] mb-3">
                  Sourcing made Simple.
                </h3>
                <p className="text-gray-600 leading-relaxed mb-8">
                  Tired of traveling to markets to find stock? Access thousands of verified manufacturers across Africa and the globe. Buy at wholesale prices and have them delivered to your shop or directly to your customers.
                </p>
                <Link
                  href="/buyer/products?b2b=true"
                  className="group/btn inline-flex items-center gap-2 px-6 py-3 bg-[#111111] text-white rounded-xl font-semibold hover:bg-[#333333] transition-colors"
                >
                  Explore Wholesale
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
