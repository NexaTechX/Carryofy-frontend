import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative min-h-[70vh] flex items-center bg-[#FAFAFA] pt-24 sm:pt-28 pb-12 sm:pb-16 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-inter text-4xl sm:text-5xl lg:text-6xl font-bold text-[#111111] leading-tight mb-6">
              Stock Your Store Without Leaving It.
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-10 max-w-3xl mx-auto">
              Carryofy connects Lagos retailers with verified vendors across fashion, beauty, electronics, and grocery. Order today, delivered to your store.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/auth/signup"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#FF6B00] text-black rounded-xl font-semibold hover:bg-[#E65F00] transition-colors shadow-lg shadow-[#FF6B00]/20"
              >
                Start Sourcing
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/merchant-onboarding"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold border-2 border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
              >
                Sell on Carryofy
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
