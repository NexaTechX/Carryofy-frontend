import { MapPin, UserX, ShieldOff } from 'lucide-react';
import { motion } from 'framer-motion';

const retailerProblems = [
  {
    icon: UserX,
    title: 'Unreliable Suppliers',
    description:
      'Fragmented markets make it hard to know who will deliver quality stock on time — or show up at all.',
    gradient: 'from-red-100/90 to-red-50',
    iconWrap: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  {
    icon: MapPin,
    title: 'Endless Market Trips',
    description:
      'Hours lost traveling and chasing stock — time better spent serving customers and growing sales.',
    gradient: 'from-orange-100/90 to-orange-50',
    iconWrap: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    icon: ShieldOff,
    title: 'No Trust No Delivery',
    description:
      'Without verified partners or reliable logistics, restocking stays risky, slow, and expensive.',
    gradient: 'from-rose-100/90 to-rose-50',
    iconWrap: 'bg-rose-100',
    iconColor: 'text-rose-600',
  },
];

export default function ProblemSection() {
  return (
    <section className="relative bg-gray-50 py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-left sm:mb-16">
            <h2 className="font-heading mb-4 text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">
              Commerce in Africa is fragmented.
            </h2>
            <p className="max-w-2xl text-base text-gray-600 sm:text-lg">
              Lagos retailers face unreliable suppliers, repeated market trips, and no standard way to trust who they buy from — or how stock gets to the store.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-stretch">
            {retailerProblems.map((problem, index) => (
              <motion.div
                key={problem.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-lg"
              >
                <div
                  className={`relative flex h-44 w-full shrink-0 flex-col items-center justify-center bg-linear-to-br ${problem.gradient} px-6`}
                  aria-hidden
                >
                  <div
                    className={`flex h-20 w-20 items-center justify-center rounded-2xl ${problem.iconWrap} shadow-sm ring-1 ring-black/5`}
                  >
                    <problem.icon className={`h-10 w-10 ${problem.iconColor}`} strokeWidth={1.75} />
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/6 to-transparent" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="mb-3 text-xl font-bold text-gray-900">{problem.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-700">{problem.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
