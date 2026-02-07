import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle } from 'lucide-react';

export default function WhoCarryofyIsFor() {
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
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Built for Everyone
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you're selling or shopping, Carryofy combines <strong>trust, transparency, and intelligent tools</strong> to make commerce simple and secure.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* For Vendors */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -8 }}
              className="group relative bg-gradient-to-br from-orange-50/50 to-white rounded-3xl p-8 sm:p-10 lg:p-12 border-2 border-orange-100 hover:border-primary/30 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors duration-300"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">🚀</span>
                </div>
                <h2 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  For Vendors
                </h2>
                <p className="text-xl sm:text-2xl text-gray-700 mb-8 font-medium">
                  Sell without friction. Grow with clarity.
                </p>
                
                <ul className="space-y-5 mb-10">
                  {[
                    'Intelligent product onboarding and validation',
                    'Faster approvals through smart verification checks',
                    'Transparent, per‑product commissions',
                    'Built‑in tools to manage listings, orders, and performance',
                    'Insights that help you focus on selling, not platform complexity',
                  ].map((item, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-4 text-gray-700"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                        <CheckCircle className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-base sm:text-lg leading-relaxed">{item}</span>
                    </motion.li>
                  ))}
                </ul>

                <Link
                  href="/merchant-onboarding"
                  className="group/btn inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 font-semibold text-base"
                >
                  Become a Vendor
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* For Buyers */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative bg-gradient-to-br from-blue-50/50 to-white rounded-3xl p-8 sm:p-10 lg:p-12 border-2 border-blue-100 hover:border-primary/30 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors duration-300"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">🛒</span>
                </div>
                <h2 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  For Buyers
                </h2>
                <p className="text-xl sm:text-2xl text-gray-700 mb-8 font-medium">
                  Shop confidently from trusted sellers.
                </p>
                
                <ul className="space-y-5 mb-10">
                  {[
                    'Smarter product discovery from verified vendors',
                    'Personalized recommendations based on browsing behavior',
                    'Secure checkout with buyer protection',
                    'Faster decisions with relevant, trusted listings',
                  ].map((item, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-4 text-gray-700"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                        <CheckCircle className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-base sm:text-lg leading-relaxed">{item}</span>
                    </motion.li>
                  ))}
                </ul>

                <Link
                  href="/buyer/products"
                  className="group/btn inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 font-semibold text-base"
                >
                  Start Shopping
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
