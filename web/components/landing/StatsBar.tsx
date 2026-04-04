import { motion } from 'framer-motion';
import { Package, ShieldCheck, Truck } from 'lucide-react';

const stats = [
  {
    icon: Package,
    line: '500+ Products Listed',
  },
  {
    icon: ShieldCheck,
    line: 'Verified Vendors Only',
  },
  {
    icon: Truck,
    line: 'Same-Day Delivery in Lagos',
  },
] as const;

export default function StatsBar() {
  return (
    <section className="border-y border-gray-200/80 bg-gray-100/90 py-7 sm:py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6 md:gap-10"
          >
            {stats.map((item, index) => (
              <motion.div
                key={item.line}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-center gap-3 sm:flex-col sm:gap-2.5"
              >
                <item.icon
                  className="h-5 w-5 shrink-0 text-gray-400"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <p className="font-inter min-w-0 text-left text-base font-bold tracking-tight text-gray-900 sm:text-center sm:text-lg">
                  {item.line}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
