import { motion } from 'framer-motion';
import { Store, Package } from 'lucide-react';

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
              Who is it for?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The B2B marketplace for Lagos retailers. Source from verified vendors, we handle delivery.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group relative bg-gradient-to-br from-[#FF6B00]/5 to-white rounded-3xl p-8 sm:p-10 border-2 border-[#FF6B00]/10 hover:border-[#FF6B00]/25 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF6B00]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-[#FF6B00]/10 flex items-center justify-center mb-6">
                  <Store className="w-7 h-7 text-[#FF6B00]" />
                </div>
                <h3 className="font-inter text-2xl sm:text-3xl font-bold text-[#111111] mb-3">
                  Retailers
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Stop making market trips. Browse verified vendors, place orders, and receive stock at your store.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="group relative bg-gradient-to-br from-[#111111]/5 to-white rounded-3xl p-8 sm:p-10 border-2 border-gray-200 hover:border-[#111111]/20 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#111111]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-[#111111]/10 flex items-center justify-center mb-6">
                  <Package className="w-7 h-7 text-[#111111]" />
                </div>
                <h3 className="font-inter text-2xl sm:text-3xl font-bold text-[#111111] mb-3">
                  Vendors
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  List your products, reach retailers across Lagos, and we handle logistics.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
