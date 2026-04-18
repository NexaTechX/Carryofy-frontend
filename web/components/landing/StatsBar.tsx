import { motion } from 'framer-motion';
import { Package, ShieldCheck, Truck } from 'lucide-react';

const stats = [
  {
    icon: Package,
    line: '500+ products listed',
    detail: 'Curated wholesale assortment',
  },
  {
    icon: ShieldCheck,
    line: 'Verified vendors only',
    detail: 'Onboarding & quality bar',
  },
  {
    icon: Truck,
    line: 'Coordinated delivery',
    detail: 'Lagos corridors & partners',
  },
] as const;

export default function StatsBar() {
  return (
    <section className="border-y border-white/10 bg-zinc-950 py-10 sm:py-11">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="divide-y divide-white/10 sm:grid sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-y-0 sm:divide-white/10"
          >
            {stats.map((item, index) => (
              <motion.div
                key={item.line}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-4 py-8 first:pt-0 last:pb-0 sm:block sm:px-8 sm:py-0 sm:first:pl-0 sm:last:pr-0"
              >
                <item.icon
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#FF6B00]"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <div>
                  <p className="font-heading text-lg font-semibold tracking-tight text-white sm:text-xl">
                    {item.line}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">{item.detail}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
