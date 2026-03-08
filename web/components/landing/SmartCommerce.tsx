import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Shield, Zap, Search, CheckCircle2 } from 'lucide-react';

export default function SmartCommerce() {
  const vendorFeatures = [
    {
      icon: CheckCircle2,
      title: 'Smart listing checks to improve product quality',
    },
    {
      icon: TrendingUp,
      title: 'Automated category and pricing suggestions',
    },
    {
      icon: Zap,
      title: 'Order and sales insights powered by usage patterns',
    },
    {
      icon: Shield,
      title: 'Faster vendor verification through intelligent screening',
    },
  ];

  const buyerFeatures = [
    {
      icon: Search,
      title: 'Relevant product recommendations from trusted sellers',
    },
    {
      icon: Shield,
      title: 'Fraud and risk detection running continuously',
    },
    {
      icon: CheckCircle2,
      title: 'Cleaner marketplace with fewer low‑quality listings',
    },
    {
      icon: Zap,
      title: 'A safer, faster buying experience without complexity',
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-full text-sm font-semibold text-[#FF6B00] mb-4">
              <Sparkles className="w-4 h-4" />
              AI-Powered
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              AI-powered commerce tools
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Demand forecasting. Smart pricing. Fraud detection. Automated routing. AI works behind the scenes so sellers scale faster and buyers shop with confidence.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* For Vendors */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-orange-50/50 to-white rounded-2xl p-8 sm:p-10 border border-orange-100 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#FF6B00]/10 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-[#FF6B00]" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  For Vendors <span className="text-[#FF6B00]">(AI‑assisted)</span>
                </h3>
              </div>
              <ul className="space-y-4">
                {vendorFeatures.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center mt-0.5">
                      <feature.icon className="w-5 h-5 text-[#FF6B00]" />
                    </div>
                    <span className="text-base sm:text-lg text-gray-700 leading-relaxed pt-1.5">
                      {feature.title}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* For Buyers */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-gradient-to-br from-blue-50/50 to-white rounded-2xl p-8 sm:p-10 border border-blue-100 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#FF6B00]/10 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-[#FF6B00]" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  For Buyers <span className="text-[#FF6B00]">(AI‑assisted)</span>
                </h3>
              </div>
              <ul className="space-y-4">
                {buyerFeatures.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center mt-0.5">
                      <feature.icon className="w-5 h-5 text-[#FF6B00]" />
                    </div>
                    <span className="text-base sm:text-lg text-gray-700 leading-relaxed pt-1.5">
                      {feature.title}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
