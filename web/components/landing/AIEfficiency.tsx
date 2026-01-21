import { motion } from 'framer-motion';
import { Settings, TrendingUp, Zap } from 'lucide-react';

export default function AIEfficiency() {
  const features = [
    {
      number: 1,
      text: 'Demand forecasting for smarter inventory',
    },
    {
      number: 2,
      text: 'Dynamic routing to bypass Lagos traffic',
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Icon and Title */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-6">
                <Settings className="w-10 h-10 text-white" />
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                AI Efficiency
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                Powering 170+ daily deliveries
              </p>
            </motion.div>

            {/* Right - Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-base sm:text-lg text-gray-600 mb-8 leading-relaxed">
                Our platform isn't just a list of items. It's a complete nervous system that predicts demand, optimizes delivery, and automates operations (like intelligent) footprint across Nigeria.
              </p>

              <div className="space-y-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{feature.number}</span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed pt-1">
                      {feature.text}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
