import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

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
            Ready to stock your store smarter?
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Link
              href="/auth/signup"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#111111] rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg"
            >
              Start Sourcing Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
