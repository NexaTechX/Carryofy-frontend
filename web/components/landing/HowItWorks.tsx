import { motion } from 'framer-motion';
import { UserCheck, Store, Truck, Headphones } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      id: 1,
      title: 'Verify',
      description: 'Sellers pass our multi-stage vetting.',
      icon: UserCheck,
      iconColor: 'text-white',
      bgColor: 'bg-primary',
    },
    {
      id: 2,
      title: 'Store',
      description: 'Products are stored in Carryofy hubs.',
      icon: Store,
      iconColor: 'text-white',
      bgColor: 'bg-primary',
    },
    {
      id: 3,
      title: 'Deliver',
      description: 'Orders ship fulfilled in record time.',
      icon: Truck,
      iconColor: 'text-white',
      bgColor: 'bg-primary',
    },
    {
      id: 4,
      title: 'Support',
      description: 'Get support for every single order.',
      icon: Headphones,
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className={`w-16 h-16 ${step.bgColor} rounded-full flex items-center justify-center mb-6 mx-auto`}>
                  <step.icon className={`w-8 h-8 ${step.iconColor}`} />
                </div>
                <div className="text-sm text-primary font-bold mb-2">{step.id}. {step.title}</div>
                <p className="text-sm text-gray-600 leading-relaxed">
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
