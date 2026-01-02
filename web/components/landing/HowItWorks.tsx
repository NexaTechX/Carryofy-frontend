import { motion } from 'framer-motion';
import { UserCheck, Package, TrendingUp, Search, ShoppingCart, PackageCheck } from 'lucide-react';

const vendorSteps = [
  {
    id: 1,
    title: 'Apply & get verified',
    icon: UserCheck,
  },
  {
    id: 2,
    title: 'List your products',
    icon: Package,
  },
  {
    id: 3,
    title: 'Sell and get paid securely',
    icon: TrendingUp,
  },
];

const buyerSteps = [
  {
    id: 1,
    title: 'Discover trusted products',
    icon: Search,
  },
  {
    id: 2,
    title: 'Place your order',
    icon: ShoppingCart,
  },
  {
    id: 3,
    title: 'Receive with confidence',
    icon: PackageCheck,
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-gray-900"
          >
            How It Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Simple, transparent, and designed for both sellers and buyers
          </motion.p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Vendors */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl p-8 sm:p-10 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  For Vendors
                </h3>
              </div>
              <div className="space-y-6">
                {vendorSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4 group"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                        <step.icon className="w-7 h-7" />
                      </div>
                      {index < vendorSteps.length - 1 && (
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-6 bg-gradient-to-b from-primary/30 to-transparent"></div>
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="text-xs text-primary font-semibold mb-2 uppercase tracking-wide">Step {step.id}</div>
                      <div className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                        {step.title}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Buyers */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-2xl p-8 sm:p-10 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  For Buyers
                </h3>
              </div>
              <div className="space-y-6">
                {buyerSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4 group"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                        <step.icon className="w-7 h-7" />
                      </div>
                      {index < buyerSteps.length - 1 && (
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-6 bg-gradient-to-b from-primary/30 to-transparent"></div>
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="text-xs text-primary font-semibold mb-2 uppercase tracking-wide">Step {step.id}</div>
                      <div className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                        {step.title}
                      </div>
                    </div>
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
