import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function CallToAction() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-primary via-primary-dark to-primary relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 sm:mb-8 leading-tight"
        >
          Ready to build or buy with confidence?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg sm:text-xl text-white/90 mb-10 sm:mb-12 max-w-2xl mx-auto"
        >
          Join thousands of vendors and buyers building the future of trusted digital commerce.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row justify-center gap-4 mb-8 sm:mb-10"
        >
          <Link
            href="/merchant-onboarding"
            className="group relative px-10 py-5 bg-white text-primary rounded-xl font-bold text-base sm:text-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3">
              Join Carryofy Today
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
          <Link
            href="/products"
            className="px-10 py-5 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl font-bold text-base sm:text-lg hover:bg-white/20 hover:border-white/50 transition-all duration-300 flex items-center justify-center gap-3"
          >
            Explore Products
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-sm sm:text-base text-white/80"
        >
          Start your journey today — no credit card required
        </motion.p>
      </div>
    </section>
  );
}
