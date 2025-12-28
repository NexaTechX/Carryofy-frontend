import Link from 'next/link';
import Image from 'next/image';
import { motion, useAnimation } from 'framer-motion';
import { ArrowRight, Truck, ShieldCheck, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

// Animated counter hook
function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / duration;

      if (progress < 1) {
        setCount(Math.floor(end * progress));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}

export default function HeroSection() {
  const deliveryCount = useCounter(12450, 2500);
  const satisfactionRate = useCounter(99.8, 2500);
  return (
    <section className="relative min-h-[100svh] sm:min-h-[800px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-20 sm:pt-24">
      {/* Background Image with Enhanced Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/truck.jpg"
          alt="Delivery truck"
          fill
          className="object-cover opacity-30 sm:opacity-40"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/95 via-gray-900/80 to-gray-900/90 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-600/20 to-orange-500/20 mix-blend-overlay z-10 animate-pulse-slow"></div>

        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-float-delayed"></div>
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-left"
          >
            <h1 className="font-heading text-3xl xs:text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-[1.1] text-white">
              Same-Day Delivery from <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light">Verified Sellers</span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 text-gray-300 max-w-xl leading-relaxed">
              Carryofy helps urban customers get same-day delivery from trusted local sellers without WhatsApp stress.
            </p>

            <div className="flex flex-col xs:flex-row gap-3 sm:gap-4">
              <Link
                href="/auth/signup"
                className="group px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary to-primary-light text-white rounded-full hover:shadow-lg hover:shadow-primary/40 transition-all duration-300 font-bold text-base sm:text-lg flex items-center justify-center gap-2 touch-target btn-mobile"
              >
                Shop Now
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/merchant-onboarding"
                className="px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 border border-white/20 transition-all duration-300 font-semibold text-base sm:text-lg flex items-center justify-center gap-2 touch-target btn-mobile"
              >
                Become a Seller
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </div>

            <div className="mt-8 sm:mt-12 grid grid-cols-3 gap-3 sm:gap-6 border-t border-white/10 pt-6 sm:pt-8">
              {[
                { icon: Clock, label: "Same-Day Delivery" },
                { icon: ShieldCheck, label: "Trusted Sellers" },
                { icon: Truck, label: "Lagos Coverage" },
              ].map((item, index) => (
                <div key={index} className="flex flex-col gap-1 sm:gap-2">
                  <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  <span className="text-xs sm:text-sm text-gray-400 font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Floating Elements / Visuals - Hidden on mobile, shown on desktop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="hidden lg:block relative h-[500px] xl:h-[600px]"
          >
            {/* Abstract shapes or secondary image could go here. For now, using a glass card effect */}
            <div className="absolute top-10 right-10 w-full h-full bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-3xl blur-3xl"></div>
            <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl glass-dark p-6 xl:p-8 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm">Current Status</p>
                  <h3 className="text-xl xl:text-2xl font-bold text-white mt-1">In Transit</h3>
                </div>
                <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Live
                </div>
              </div>

              {/* Mock Map or Tracking UI */}
              <div className="flex-grow my-6 xl:my-8 bg-gray-800/50 rounded-2xl relative overflow-hidden group">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 xl:w-32 h-24 xl:h-32 bg-primary/20 rounded-full animate-ping absolute"></div>
                  <div className="w-3 xl:w-4 h-3 xl:h-4 bg-primary rounded-full relative z-10 shadow-[0_0_20px_rgba(255,107,0,0.5)]"></div>
                </div>
                <div className="absolute bottom-3 xl:bottom-4 left-3 xl:left-4 right-3 xl:right-4 bg-gray-900/90 backdrop-blur p-3 xl:p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 xl:w-10 h-8 xl:h-10 rounded-full bg-gray-800 flex items-center justify-center">
                      <Truck className="w-4 xl:w-5 h-4 xl:h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-white text-xs xl:text-sm font-medium">Order #29384</p>
                      <p className="text-gray-500 text-xs">Arriving in 25 mins</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 xl:gap-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-3 xl:p-4 border border-white/10"
                >
                  <p className="text-gray-400 text-xs">Total Deliveries</p>
                  <p className="text-white text-lg xl:text-xl font-bold mt-1 bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                    {deliveryCount.toLocaleString()}+
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                  className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-3 xl:p-4 border border-white/10"
                >
                  <p className="text-gray-400 text-xs">Satisfaction Rate</p>
                  <p className="text-white text-lg xl:text-xl font-bold mt-1 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    {satisfactionRate.toFixed(1)}%
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Mobile Stats Card - Only visible on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="lg:hidden mt-8"
          >
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/10 rounded-xl p-4 shadow-lg"
              >
                <p className="text-gray-400 text-xs">Total Deliveries</p>
                <p className="text-white text-xl sm:text-2xl font-bold mt-1 bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                  {deliveryCount.toLocaleString()}+
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/10 rounded-xl p-4 shadow-lg"
              >
                <p className="text-gray-400 text-xs">Satisfaction Rate</p>
                <p className="text-white text-xl sm:text-2xl font-bold mt-1 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  {satisfactionRate.toFixed(1)}%
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

