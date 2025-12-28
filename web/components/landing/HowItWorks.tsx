import { motion } from 'framer-motion';
import { Search, ShoppingCart, MapPin, Package } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: 'Browse Products',
    description: 'Explore verified sellers and products in Lagos.',
    icon: Search,
  },
  {
    id: 2,
    title: 'Add to Cart',
    description: 'Select items and checkout securely.',
    icon: ShoppingCart,
  },
  {
    id: 3,
    title: 'Track Order',
    description: 'Real-time tracking from pickup to delivery.',
    icon: MapPin,
  },
  {
    id: 4,
    title: 'Receive Same-Day',
    description: 'Get your order delivered within hours.',
    icon: Package,
  },
];

export default function HowItWorks() {
  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-16 lg:mb-20">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-primary font-semibold tracking-wider uppercase text-xs sm:text-sm"
          >
            Simple Process
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold mt-2 mb-3 sm:mb-4 text-gray-900"
          >
            How Carryofy Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg"
          >
            Shop from trusted local sellers in Lagos and get same-day delivery. It's that simple.
          </motion.p>
        </div>

        <div className="relative">
          {/* Connecting Line (Desktop - only for xl and above where we show 4 columns) */}
          <div className="hidden xl:block absolute top-1/2 left-[12.5%] right-[12.5%] h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>

          {/* Mobile: 1 col, Tablet: 2 col, Desktop: 4 col */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 rounded-xl sm:rounded-2xl bg-white border-2 border-gray-100 shadow-lg flex items-center justify-center mb-4 sm:mb-6 group-hover:border-primary group-hover:shadow-primary/20 transition-all duration-300 relative z-10">
                  <step.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-gray-400 group-hover:text-primary transition-colors duration-300" />
                  <div className="absolute -top-2 sm:-top-3 -right-2 sm:-right-3 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-md">
                    {step.id}
                  </div>
                </div>

                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-primary transition-colors">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed text-xs sm:text-sm max-w-[200px]">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
