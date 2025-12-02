import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function CallToAction() {
  return (
    <section className="py-12 sm:py-16 lg:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dark z-0"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2"
        >
          Be Part of the Future of African Commerce
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-base sm:text-lg lg:text-xl text-white/90 mb-8 sm:mb-10 max-w-2xl mx-auto px-4"
        >
          Join thousands of merchants and customers who trust Carryofy for their e-commerce needs.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0"
        >
          <Link
            href="/auth/signup"
            className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-primary rounded-full font-bold text-base sm:text-lg hover:shadow-xl hover:shadow-black/20 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 touch-target btn-mobile"
          >
            Join Waitlist
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <Link
            href="/products"
            className="px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur text-white rounded-full font-bold text-base sm:text-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2 border border-white/30 touch-target btn-mobile"
          >
            Shop Now
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
