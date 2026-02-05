import { motion } from 'framer-motion';
import { Truck, Shield, CheckCircle } from 'lucide-react';

export default function TrustSection() {
  const stats = [
    {
      icon: Truck,
      value: 'Same-day delivery',
      label: 'Lagos',
      sublabel: '1–3 days nationwide',
    },
    {
      icon: Shield,
      value: 'Verified',
      label: 'sellers',
    },
    {
      icon: CheckCircle,
      value: 'Paystack',
      label: 'Payments — secure checkout',
    },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-12"
          >
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Trusted by Nigerian shoppers & sellers
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/10 to-cyan-500/10 flex items-center justify-center">
                  <stat.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-base sm:text-lg text-gray-700 font-medium mb-1">
                  {stat.label}
                </div>
                {stat.sublabel && (
                  <div className="text-sm text-gray-500">
                    {stat.sublabel}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
