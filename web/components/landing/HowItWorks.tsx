import { motion } from 'framer-motion';
import { UserCheck, Store, Truck } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      id: 1,
      title: 'Shop verified sellers',
      description: 'Browse products from verified Nigerian sellers.',
      icon: UserCheck,
      iconColor: 'text-white',
      bgColor: 'bg-primary',
    },
    {
      id: 2,
      title: 'We store & handle delivery',
      description: 'Products stored in our warehouse, ready to ship.',
      icon: Store,
      iconColor: 'text-white',
      bgColor: 'bg-primary',
    },
    {
      id: 3,
      title: 'Receive fast, track easily',
      description: 'Same-day delivery in Lagos, 1–3 days nationwide.',
      icon: Truck,
      iconColor: 'text-white',
      bgColor: 'bg-primary',
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

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className={`w-16 h-16 ${step.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <step.icon className={`w-8 h-8 ${step.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">
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
