import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Link from 'next/link';

const checklist = [
  'We store pack and deliver your products',
  'We handle customer communication',
  'Fast payouts after delivery confirmation',
];

export default function SellerCTASection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-[#111111] text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-inter text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
          >
            Sell online without logistics stress.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-lg sm:text-xl text-gray-300 mb-10"
          >
            We store, pack, and deliver your products. You focus on growing your business.
          </motion.p>

          <ul className="space-y-4 mb-10 text-left max-w-md mx-auto">
            {checklist.map((item, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-[#FF6B00] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </div>
                <span className="text-gray-200">{item}</span>
              </motion.li>
            ))}
          </ul>

          <Link
            href="/merchant-onboarding"
            className="inline-block px-10 py-4 bg-[#FF6B00] text-white rounded-xl font-bold text-lg hover:bg-[#E65F00] transition-colors shadow-lg"
          >
            Apply as a Seller
          </Link>
          <p className="mt-4 text-gray-400 text-sm">
            Early access — limited seller spots
          </p>
        </div>
      </div>
    </section>
  );
}
