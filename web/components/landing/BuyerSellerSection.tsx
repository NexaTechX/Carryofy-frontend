import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function BuyerSellerSection() {
  const buyerFeatures = [
    'Buyer Protection: 100% money-back guarantee',
    'Direct Logistics: Track every move of your package',
    'No hidden fees: Straightforward, what you see',
  ];

  const sellerFeatures = [
    'Bulk fulfillment: We store and deliver for you.',
    'Analytics: Real-time data on your sales',
    'Fast Payouts: Get paid the same or next-day delivered',
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* For Buyers - Light */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-orange-50 rounded-3xl p-8 sm:p-10 lg:p-12 border border-orange-100"
            >
              <div className="mb-6">
                <div className="text-xs sm:text-sm font-bold text-primary uppercase tracking-wider mb-4">
                  FOR BUYERS
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                  Buy with absolute peace of mind.
                </h2>
              </div>

              <ul className="space-y-4 mb-8">
                {buyerFeatures.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      {feature}
                    </span>
                  </motion.li>
                ))}
              </ul>

              <Link
                href="/products"
                className="inline-block px-8 py-4 bg-white text-gray-900 rounded-xl font-bold hover:shadow-lg transition-all border border-gray-200"
              >
                Explore Marketplace
              </Link>
            </motion.div>

            {/* For Sellers - Dark */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-gray-900 rounded-3xl p-8 sm:p-10 lg:p-12 text-white"
            >
              <div className="mb-6">
                <div className="text-xs sm:text-sm font-bold text-primary uppercase tracking-wider mb-4">
                  FOR SELLERS
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">
                  Scale your business across Nigeria.
                </h2>
              </div>

              <ul className="space-y-4 mb-8">
                {sellerFeatures.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm sm:text-base text-gray-200 leading-relaxed">
                      {feature}
                    </span>
                  </motion.li>
                ))}
              </ul>

              <Link
                href="/merchant-onboarding"
                className="inline-block px-8 py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all"
              >
                Apply to Sell
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
