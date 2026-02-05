import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function SellerCTASection() {
  const sellerFeatures = [
    'We store, pack, and deliver your products',
    'We handle customer communication',
    'You focus on selling and growing your business',
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gray-900 rounded-3xl p-8 sm:p-10 lg:p-12 text-white text-center"
          >
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
              Sell online without logistics stress
            </h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              We handle storage, fulfillment, and delivery so you can focus on growing your business.
            </p>

            <ul className="space-y-3 mb-8 text-left max-w-md mx-auto">
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
                  <span className="text-sm sm:text-base text-gray-200">
                    {feature}
                  </span>
                </motion.li>
              ))}
            </ul>

            <Link
              href="/merchant-onboarding"
              className="inline-block px-8 py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all"
            >
              Apply as a Seller
            </Link>
            <p className="mt-4 text-gray-400 text-sm">
              Early access — limited seller slots.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
