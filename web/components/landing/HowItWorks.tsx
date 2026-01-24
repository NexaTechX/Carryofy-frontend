import { motion } from 'framer-motion';
import { UserCheck, Store, Truck, Headphones } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      id: 1,
      title: 'Choose what you want',
      description: 'Browse products from verified Nigerian sellers. Select items from our curated marketplace.',
      icon: UserCheck,
      iconColor: 'text-white',
      bgColor: 'bg-primary',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop',
    },
    {
      id: 2,
      title: 'See real-time updates',
      description: 'Track your order from warehouse to your door. Get notifications every step of the way.',
      icon: Store,
      iconColor: 'text-white',
      bgColor: 'bg-primary',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
    },
    {
      id: 3,
      title: 'Get your items same-day',
      description: 'Fast, reliable delivery in Lagos. Same-day service available for orders before 12pm.',
      icon: Truck,
      iconColor: 'text-white',
      bgColor: 'bg-primary',
      image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=600&h=400&fit=crop',
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900"
            >
              How it Works
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                  <div className="absolute top-4 left-4">
                    <div className={`w-12 h-12 ${step.bgColor} rounded-full flex items-center justify-center shadow-lg`}>
                      <step.icon className={`w-6 h-6 ${step.iconColor}`} />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="text-sm text-primary font-bold mb-2">{step.id}. {step.title}</div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
