import { motion } from 'framer-motion';
import { Truck, ShieldCheck, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: Truck,
    title: 'Logistics Built-in',
    description: 'No more arguing with bike riders. We pick up, verify, and deliver — so you can focus on selling.',
  },
  {
    icon: ShieldCheck,
    title: 'Escrow Payments',
    description: 'Build trust with buyers — their money is safe until delivery. You get paid when the order is complete.',
  },
  {
    icon: TrendingUp,
    title: 'AI-Powered Insights',
    description: 'We tell you what is trending so you know what to source. Smarter decisions, less guesswork.',
  },
];

export default function WhyChooseCarryofy() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-inter text-3xl sm:text-4xl lg:text-5xl font-bold text-[#111111] mb-12 text-center"
          >
            Why Carryofy?
          </motion.h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#FAFAFA] rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-gray-200/80 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-[#FF6B00]" />
                </div>
                <h3 className="font-inter font-bold text-[#111111] text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
