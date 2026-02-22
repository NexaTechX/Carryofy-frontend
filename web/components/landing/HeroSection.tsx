import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Shield, Package, Truck } from 'lucide-react';

export default function HeroSection() {
  const trustBadges = [
    'Verified Sellers Only',
    'Fast Delivery',
    'Buyer Protection',
    'Secure Payments',
  ];

  const floatingCards = [
    { text: 'Same-Day Delivery Available (Lagos)', icon: Truck },
    { text: 'Fulfilled by Carryofy', icon: Package },
    { text: 'Buyer Protection Active', icon: Shield },
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center bg-[#FAFAFA] pt-24 sm:pt-28 pb-16 sm:pb-20 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <h1 className="font-inter text-4xl sm:text-5xl lg:text-6xl font-bold text-[#111111] leading-tight mb-6">
                Sell and shop trusted products without logistics stress.
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-8 max-w-xl">
                Carryofy connects Nigerian businesses and shoppers with verified sellers, we handle storage, fulfillment, and delivery.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  href="/buyer/products"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#FF6B00] text-white rounded-xl font-semibold hover:bg-[#E65F00] transition-colors shadow-lg shadow-[#FF6B00]/20"
                >
                  Start Shopping
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/merchant-onboarding"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold border-2 border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
                >
                  Sell on Carryofy
                </Link>
              </div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex flex-wrap gap-6 text-sm sm:text-base"
              >
                {trustBadges.map((badge, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#FF6B00]/10 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-[#FF6B00]" strokeWidth={3} />
                    </div>
                    <span className="font-medium text-[#111111]">{badge}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Column - Mockup / Visual */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative order-1 lg:order-2"
            >
              {/* Platform mockup placeholder - abstract geometric style */}
              <div className="relative rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-xl">
                <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
                  {/* Abstract product grid placeholder */}
                  <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-xl bg-white border border-gray-200 shadow-sm"
                      />
                    ))}
                  </div>
                </div>
                {/* Floating badge cards */}
                <div className="absolute inset-0 pointer-events-none p-4 sm:p-6">
                  {floatingCards.map((card, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.15 }}
                      className={`absolute bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 flex items-center gap-3 ${
                        i === 0 ? 'top-4 left-4 sm:top-6 sm:left-6' :
                        i === 1 ? 'bottom-20 left-4 sm:bottom-24 sm:left-6' :
                        'top-1/2 -translate-y-1/2 right-4 sm:right-6'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center shrink-0">
                        <card.icon className="w-4 h-4 text-[#FF6B00]" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-[#111111] whitespace-nowrap">
                        {card.text}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
