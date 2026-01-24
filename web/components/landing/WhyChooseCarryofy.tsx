import { motion } from 'framer-motion';
import Image from 'next/image';
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
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

          {/* Statistics Section with Image */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-primary/10 to-cyan-500/10 rounded-3xl overflow-hidden shadow-xl"
          >
            <div className="grid md:grid-cols-2 gap-0">
              <div className="relative h-64 md:h-auto min-h-[400px]">
                <img
                  src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&h=600&fit=crop"
                  alt="Carryofy marketplace - Nigeria's trusted e-commerce platform"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"></div>
              </div>
              <div className="p-8 md:p-12 flex flex-col justify-center bg-white">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                  Nigeria's Trusted Marketplace
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2">100%</div>
                    <div className="text-sm text-gray-600">Verified Sellers</div>
                  </div>
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2">24/7</div>
                    <div className="text-sm text-gray-600">Customer Support</div>
                  </div>
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2">Same-Day</div>
                    <div className="text-sm text-gray-600">Delivery Lagos</div>
                  </div>
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2">100%</div>
                    <div className="text-sm text-gray-600">Buyer Protection</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
