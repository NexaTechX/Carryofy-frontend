import { motion } from 'framer-motion';
import { Search, ShoppingCart, PackageCheck, Store } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: 'Browse',
    description: 'Explore products from verified vendors across the categories your customers expect.',
    icon: Search,
  },
  {
    id: 2,
    title: 'Order',
    description: 'Place orders for your store in a few clicks — no market runs required.',
    icon: ShoppingCart,
  },
  {
    id: 3,
    title: 'We dispatch',
    description: 'Carryofy coordinates pickup and delivery with our logistics partners.',
    icon: PackageCheck,
  },
  {
    id: 4,
    title: 'Delivered to your store',
    description: 'Stock arrives at your location so you can sell with confidence.',
    icon: Store,
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="font-inter text-3xl sm:text-4xl lg:text-5xl font-bold text-[#111111] mb-4">
              How it works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From browse to doorstep — built for Lagos retailers.
            </p>
          </motion.div>

          <div className="relative">
            <div
              className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FF6B00]/20 via-[#FF6B00]/40 to-[#FF6B00]/20"
              style={{ left: '12.5%', right: '12.5%' }}
              aria-hidden
            />

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#FAFAFA] border-2 border-[#FF6B00]/20 shadow-md flex items-center justify-center mb-4 z-10">
                    <step.icon className="w-8 h-8 text-[#FF6B00]" />
                  </div>
                  <div className="text-sm font-bold text-[#FF6B00] mb-1">Step {step.id}</div>
                  <h3 className="font-inter font-bold text-[#111111] text-base mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
