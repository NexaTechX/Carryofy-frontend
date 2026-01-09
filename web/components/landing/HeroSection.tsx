import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check, MessageCircle } from 'lucide-react';

export default function HeroSection() {
  const whatsappNumber = '+2349166783040'; // WhatsApp Business number
  
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-orange-50/30 to-white pt-20 sm:pt-24">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/3 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Fulfilled by Carryofy Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm font-semibold text-primary mb-6"
            >
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              Fulfilled by Carryofy
            </motion.div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 sm:mb-8 leading-tight text-gray-900">
              Verified Nigerian sellers.{' '}
              <span className="text-gradient">We store, deliver, and support your order.</span>
            </h1>

            <p className="text-lg sm:text-xl lg:text-2xl mb-10 sm:mb-12 text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Buy confidently. Carryofy holds inventory, delivers fast, and resolves issues if anything goes wrong.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mb-10 sm:mb-12">
              <Link
                href="/products"
                className="group relative px-8 py-4 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 font-semibold text-base sm:text-lg flex items-center justify-center gap-2 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Shop verified products
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-dark to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group px-8 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 border-2 border-green-500 hover:border-green-600 transition-all duration-300 font-semibold text-base sm:text-lg flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                <MessageCircle className="w-5 h-5" />
                Chat with Carryofy
              </a>
            </div>

            {/* WhatsApp Business Number - Visible and Clickable */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mb-6"
            >
              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 hover:bg-green-100 transition-colors font-medium text-sm sm:text-base"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp: {whatsappNumber}
              </a>
            </motion.div>

            {/* Trust signals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm sm:text-base"
            >
              <div className="flex items-center gap-2.5 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 shadow-sm">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-green-600" />
                </div>
                <span className="font-medium text-gray-700">Products stocked in Carryofy warehouse</span>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 shadow-sm">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-green-600" />
                </div>
                <span className="font-medium text-gray-700">Pay safely — support available</span>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 shadow-sm">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-green-600" />
                </div>
                <span className="font-medium text-gray-700">Nigerian support team</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

