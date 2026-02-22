import { motion } from 'framer-motion';
import { Users, Package, Headphones, Wallet } from 'lucide-react';

const stats = [
  { icon: Users, value: '500+', label: 'Verified Sellers' },
  { icon: Package, value: '10,000+', label: 'Products' },
  { icon: Headphones, value: '24/7', label: 'Support' },
  { icon: Wallet, value: 'Fast', label: 'Payouts for Sellers' },
];

export default function TrustSection() {
  return (
    <section className="py-8 sm:py-10 bg-white border-y border-gray-200/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 lg:gap-16"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center shrink-0">
                  <stat.icon className="w-5 h-5 text-[#FF6B00]" />
                </div>
                <div>
                  <div className="font-inter font-bold text-[#111111] text-lg sm:text-xl">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
