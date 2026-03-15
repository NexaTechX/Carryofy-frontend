import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Package, Store, Truck } from 'lucide-react';

const carryofyCircle = [
  {
    label: 'SOURCE',
    sublabel: 'The Wholesaler',
    description: 'Buy in bulk directly from manufacturers and verified wholesalers at factory prices.',
    icon: Package,
  },
  {
    label: 'SELL',
    sublabel: 'The Entrepreneur',
    description: 'List products on your custom store and sell to consumers via WhatsApp, IG, or Web.',
    icon: Store,
  },
  {
    label: 'DELIVER',
    sublabel: 'The Logistics',
    description: "We pick up, verify, and deliver to your customer's doorstep. You get paid instantly.",
    icon: Truck,
  },
];

const trustBadges = [
  'Verified Sellers',
  'Same-Day Delivery',
  'Buyer Protection',
  'Secure Payments',
];

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-[#FAFAFA] pt-24 sm:pt-28 pb-16 sm:pb-20 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Headline block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto mb-14"
          >
            <h1 className="font-inter text-4xl sm:text-5xl lg:text-6xl font-bold text-[#111111] leading-tight mb-6">
              Source Wholesale. Sell Retail. Scale Globally.
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-10">
              The all-in-one AI platform for African SMEs to buy inventory from top manufacturers and sell directly to consumers with built-in logistics. Start your business today with $0 inventory.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
              <Link
                href="/auth/signup?role=SELLER"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#FF6B00] text-white rounded-xl font-semibold hover:bg-[#E65F00] transition-colors shadow-lg shadow-[#FF6B00]/20"
              >
                Start Selling Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/merchant-onboarding"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold border-2 border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
              >
                Onboard your Wholesale Business
              </Link>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-wrap justify-center gap-6 text-sm sm:text-base"
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

          {/* Three-pillar Process Flow - The Carryofy Circle */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid md:grid-cols-3 gap-6 lg:gap-8"
          >
            {carryofyCircle.map((pillar, i) => (
              <motion.div
                key={pillar.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="relative bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#FF6B00]/20 transition-all"
              >
                {i < carryofyCircle.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 lg:-right-5 w-8 h-0.5 bg-gray-200 z-0" aria-hidden />
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center mb-4">
                    <pillar.icon className="w-6 h-6 text-[#FF6B00]" />
                  </div>
                  <div className="text-xs font-bold tracking-wider text-[#FF6B00] mb-1">{pillar.label}</div>
                  <div className="text-sm font-semibold text-gray-500 mb-3">{pillar.sublabel}</div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
