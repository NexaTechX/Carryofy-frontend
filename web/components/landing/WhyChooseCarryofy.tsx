import { motion } from 'framer-motion';
import { Target, Gauge, Shield, CreditCard } from 'lucide-react';

export default function WhyChooseCarryofy() {
  const features = [
    {
      icon: Target,
      title: 'Real-time Tracking',
      description: 'Know exactly where your item is as soon as you order it in real time.',
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
    },
    {
      icon: Gauge,
      title: 'AI Optimization',
      description: 'Smart routing and inventory to give you the fastest possible shipping.',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      icon: Shield,
      title: 'Fraud Prevention',
      description: 'A background team and smart validation to keep your payments safe.',
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
    },
    {
      icon: CreditCard,
      title: 'Seamless Payouts',
      description: 'Fast, simple payment processing after a successful delivery.',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
            >
              Not just another marketplace
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-base sm:text-lg text-gray-600"
            >
              Built for the unique challenges of Nigerian commerce.
            </motion.p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className={`w-12 h-12 ${feature.iconBg} rounded-lg flex items-center justify-center mb-6`}>
                  <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>
                <h3 className="font-bold text-gray-900 mb-3 text-lg">
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
