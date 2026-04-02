import { motion } from 'framer-motion';
import { Truck, ShieldCheck, Sparkles } from 'lucide-react';

const features = [
  {
    icon: ShieldCheck,
    title: 'Verified vendors',
    description: 'Buy from suppliers we vet, so you spend less time guessing and more time selling.',
  },
  {
    icon: Truck,
    title: 'Delivery included',
    description: 'We coordinate delivery to your store with our logistics partners, you are not chasing riders alone.',
  },
  {
    icon: Sparkles,
    title: 'AI-powered sourcing tools',
    description: 'Smarter ways to find and compare stock as we roll out new tools on the platform.',
    comingSoon: true,
  },
];

export default function WhyChooseCarryofy() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-[#F5F5F5]">
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
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-gray-200/80 transition-all relative"
              >
                {feature.comingSoon ? (
                  <span className="absolute top-4 right-4 text-[10px] sm:text-xs font-bold uppercase tracking-wide text-[#FF6B00] bg-[#FF6B00]/10 px-2 py-1 rounded-full">
                    Coming Soon
                  </span>
                ) : null}
                <div className="w-12 h-12 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-[#FF6B00]" />
                </div>
                <h3 className="font-inter font-bold text-[#111111] text-lg mb-2 pr-16">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
