import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Shield, Zap, TrendingUp, Sparkles, Package } from 'lucide-react';

export default function HeroSection() {
  const currentYear = new Date().getFullYear();
  
  const stats = [
    { value: 'Verified', label: 'Sellers' },
    { value: '24/7', label: 'Support' },
    { value: 'Same-day', label: 'Lagos' },
    { value: '1–3 days', label: 'Nationwide' },
    { value: 'Fast', label: 'Payouts' },
    { value: 'Paystack', label: 'Payments' },
  ];

  const floatingIcons = [
    { Icon: Shield, color: 'text-cyan-500', delay: 0 },
    { Icon: Zap, color: 'text-primary', delay: 0.2 },
    { Icon: TrendingUp, color: 'text-cyan-600', delay: 0.4 },
    { Icon: Package, color: 'text-primary-light', delay: 0.6 },
  ];
  
  return (
    <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden bg-linear-to-br from-white via-cyan-50/30 to-white pt-20 sm:pt-24">
      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-300/5 rounded-full blur-3xl"></div>
        
        {/* Floating Icons */}
        {floatingIcons.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.15, scale: 1 }}
            transition={{ delay: item.delay, duration: 0.8 }}
            className={`absolute ${
              index === 0 ? 'top-32 left-20' :
              index === 1 ? 'top-40 right-32' :
              index === 2 ? 'bottom-40 left-40' :
              'bottom-32 right-20'
            }`}
            style={{
              animation: index % 2 === 0 ? 'float 20s ease-in-out infinite' : 'float-delayed 25s ease-in-out infinite'
            }}
          >
            <item.Icon className={`w-16 h-16 sm:w-20 sm:h-20 ${item.color}`} strokeWidth={1} />
          </motion.div>
        ))}

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="order-2 lg:order-1"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-cyan-500/10 to-primary/10 border border-cyan-500/20 rounded-full text-sm font-semibold text-gray-700 mb-6 backdrop-blur-sm"
              >
                <Sparkles className="w-4 h-4 text-cyan-500" />
                <span>Nigeria's Smart Marketplace • Est. {currentYear}</span>
              </motion.div>

              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight">
                <span className="text-gray-900">Sell and shop trusted products</span>
                <span className="text-gray-900 block mt-2">— without logistics stress.</span>
              </h1>

              <p className="text-lg sm:text-xl lg:text-2xl mb-8 text-gray-600 leading-relaxed">
                Carryofy helps Nigerian businesses sell online while we handle delivery, storage, and customer protection.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  href="/merchant-onboarding"
                  className="group relative px-8 py-4 bg-linear-to-r from-primary to-primary-light text-white rounded-2xl hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 font-semibold text-base sm:text-lg flex items-center justify-center gap-2 overflow-hidden transform hover:-translate-y-1"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Sell on Carryofy
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-linear-to-r from-primary-dark to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                <Link
                  href="/products"
                  className="group px-6 py-3 text-gray-700 rounded-2xl border border-gray-300 hover:bg-gray-100 transition-all duration-300 font-medium text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  <span>Start Shopping</span>
                </Link>
              </div>

              {/* Trust Signals */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex flex-wrap items-center gap-6 text-sm sm:text-base"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-cyan-600" />
                  </div>
                  <span className="font-medium text-gray-700">Verified Sellers Only</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-cyan-600" />
                  </div>
                  <span className="font-medium text-gray-700">Fast Delivery</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-cyan-600" />
                  </div>
                  <span className="font-medium text-gray-700">Secure payments (Paystack)</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column - Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative order-1 lg:order-2"
            >
              {/* Hero Image */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-6">
                <img
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop"
                  alt="Fresh groceries and products from verified Nigerian sellers"
                  className="w-full h-[400px] sm:h-[500px] object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <p className="text-gray-900 font-bold text-lg mb-1">Same-Day Delivery Available</p>
                    <p className="text-gray-600 text-sm">Order before 12pm, receive today in Lagos</p>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 text-center"
                  >
                    <div className="text-2xl sm:text-3xl font-bold text-gradient bg-linear-to-r from-primary to-cyan-500 bg-clip-text text-transparent mb-1">
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 font-medium">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Feature Highlights */}
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-cyan-100 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shrink-0">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1 text-lg">Buyer Protection</h3>
                      <p className="text-gray-600 text-sm">Every purchase is protected. Get refunds if anything goes wrong.</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-primary/20 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary to-primary-light flex items-center justify-center shrink-0">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1 text-lg">Fulfilled by Carryofy</h3>
                      <p className="text-gray-600 text-sm">Products stored in our warehouse, ready to ship immediately.</p>
                    </div>
                  </div>
                </motion.div>

              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Decorative Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-white to-transparent pointer-events-none"></div>
    </section>
  );
}
