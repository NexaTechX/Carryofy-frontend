import { motion } from 'framer-motion';
import { UserPlus, Package, Truck, CheckCircle, CreditCard } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: 'Upload Products',
    description: 'AI enhances titles & images for better visibility.',
    icon: UserPlus,
  },
  {
    id: 2,
    title: 'Send Inventory',
    description: 'Stored in our Smart Fulfillment Center.',
    icon: Package,
  },
  {
    id: 3,
    title: 'Customer Orders',
    description: 'We pick, pack, and ship within 15 minutes.',
    icon: Truck,
  },
  {
    id: 4,
    title: 'Delivery',
    description: '90-minute zones in Lagos.',
    icon: CheckCircle,
  },
  {
    id: 5,
    title: 'Instant Payment',
    description: 'Merchants get paid within 24 hours.',
    icon: CreditCard,
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-primary font-semibold tracking-wider uppercase text-sm"
          >
            Simple Process
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold mt-2 mb-4 text-gray-900"
          >
            How Carryofy Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 max-w-2xl mx-auto text-lg"
          >
            Seamless logistics from start to finish. We make it easy for everyone.
          </motion.p>
        </div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 rounded-2xl bg-white border-2 border-gray-100 shadow-lg flex items-center justify-center mb-6 group-hover:border-primary group-hover:shadow-primary/20 transition-all duration-300 relative z-10">
                  <step.icon className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors duration-300" />
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-md">
                    {step.id}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
