import { motion } from 'framer-motion';
import { Search, ShoppingCart, Truck } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: 'Browse',
    description: 'Explore products from verified vendors.',
    icon: Search,
  },
  {
    id: 2,
    title: 'Order',
    description: 'Place orders in a few clicks, no market trips.',
    icon: ShoppingCart,
  },
  {
    id: 3,
    title: 'Receive',
    description: 'We coordinate delivery to your store.',
    icon: Truck,
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-12 md:items-start">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative flex flex-col items-center text-center md:flex-1 md:min-w-0"
              >
                <div className="relative mb-5 flex shrink-0 flex-col items-center">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-base font-bold text-white shadow-md ring-4 ring-white"
                    aria-hidden
                  >
                    {step.id}
                  </div>
                  <div className="mt-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-primary/20 bg-[#FAFAFA] shadow-md">
                    <step.icon className="h-8 w-8 text-primary" aria-hidden />
                  </div>
                </div>
                <h3 className="font-inter mb-2 text-lg font-bold text-[#111111] sm:text-xl">
                  {step.title}
                </h3>
                <p className="max-w-xs text-sm leading-relaxed text-gray-600 sm:max-w-none md:px-1">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
