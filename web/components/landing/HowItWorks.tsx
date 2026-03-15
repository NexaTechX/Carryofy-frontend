import { motion } from 'framer-motion';
import { Factory, Smartphone, ShoppingCart, Truck } from 'lucide-react';

const loopSteps = [
  {
    id: 1,
    title: 'Manufacturer lists bulk goods',
    description: 'Factories and verified wholesalers list their products on Carryofy.',
    icon: Factory,
  },
  {
    id: 2,
    title: 'You buy or source on Carryofy',
    description: 'Browse the catalog, order at wholesale prices. No need to hold inventory.',
    icon: Smartphone,
  },
  {
    id: 3,
    title: 'Consumer buys from your store',
    description: 'Sell via your custom store, WhatsApp, IG, or web. You set the price.',
    icon: ShoppingCart,
  },
  {
    id: 4,
    title: 'Carryofy delivers & handles payout',
    description: 'We pick up, verify, and deliver to your customer. You get paid instantly.',
    icon: Truck,
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-[#F5F5F5]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="font-inter text-3xl sm:text-4xl lg:text-5xl font-bold text-[#111111] mb-4">
              The Carryofy Loop
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From manufacturer to your customer's doorstep — one seamless flow.
            </p>
          </motion.div>

          {/* Visual flow: horizontal on large screens, vertical on small */}
          <div className="relative">
            {/* Connection line - visible on lg+ */}
            <div
              className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FF6B00]/20 via-[#FF6B00]/40 to-[#FF6B00]/20"
              style={{ left: '12.5%', right: '12.5%' }}
              aria-hidden
            />

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {loopSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#FF6B00]/20 shadow-md flex items-center justify-center mb-4 z-10">
                    <step.icon className="w-8 h-8 text-[#FF6B00]" />
                  </div>
                  <div className="text-sm font-bold text-[#FF6B00] mb-1">Step {step.id}</div>
                  <h3 className="font-inter font-bold text-[#111111] text-base mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
