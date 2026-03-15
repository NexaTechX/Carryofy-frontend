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
            Ready to source, sell, and scale?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-lg text-white/90 mb-10"
          >
            Join African SMEs who are growing with $0 inventory and built-in logistics.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link
              href="/auth/signup?role=SELLER"
              className="px-8 py-4 bg-white text-[#111111] rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg"
            >
              Start Selling Now
            </Link>
            <Link
              href="/merchant-onboarding"
              className="px-8 py-4 border-2 border-white text-white rounded-xl font-bold hover:bg-white hover:text-[#FF6B00] transition-colors"
            >
              Onboard your Wholesale Business
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
