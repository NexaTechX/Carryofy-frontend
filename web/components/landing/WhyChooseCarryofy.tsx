import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, Truck } from 'lucide-react';

const features = [
  {
    icon: ShieldCheck,
    title: 'Verified vendor graph',
    description:
      'Buy from suppliers we underwrite — fewer bad batches, fewer disappearing sellers.',
    image:
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1400&auto=format&fit=crop',
    imageAlt: 'Quality inspection and documents on a desk',
    wide: false,
  },
  {
    icon: Truck,
    title: 'Logistics orchestration',
    description:
      'Last-mile coordinated with partners you are not texting at midnight for status.',
    image:
      'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c0?q=80&w=1400&auto=format&fit=crop',
    imageAlt: 'Shipping containers at port',
    wide: false,
  },
  {
    icon: Sparkles,
    title: 'AI-assisted procurement',
    description:
      'Compare lines, spot gaps in your basket, and move faster as new tools ship — without changing how you run the floor.',
    image:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1400&auto=format&fit=crop',
    imageAlt: 'Operations dashboard with charts',
    wide: true,
  },
] as const;

export default function WhyChooseCarryofy() {
  return (
    <section className="relative bg-white py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-14 max-w-2xl text-center sm:mb-20"
        >
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-zinc-500">
            Why operators choose Carryofy
          </p>
          <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl lg:text-[2.75rem]">
            Trust, throughput, intelligence — in one spine.
          </h2>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className={`group flex overflow-hidden rounded-2xl border border-zinc-200/90 bg-stone-50 shadow-sm ring-1 ring-zinc-950/[0.03] ${
                feature.wide
                  ? 'min-h-[280px] flex-col sm:col-span-2 sm:flex-row lg:col-span-3 lg:min-h-[240px]'
                  : 'flex-col'
              }`}
            >
              <div
                className={`relative shrink-0 overflow-hidden bg-zinc-200 ${
                  feature.wide ? 'aspect-[16/10] w-full sm:aspect-auto sm:h-auto sm:w-[44%] lg:w-[42%]' : 'aspect-[16/10] w-full'
                }`}
              >
                <Image
                  src={feature.image}
                  alt={feature.imageAlt}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-[1.03]"
                  sizes={
                    feature.wide
                      ? '(min-width: 1024px) 35vw, 100vw'
                      : '(min-width: 1024px) 30vw, 100vw'
                  }
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/55 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-zinc-950/25" />
              </div>

              <div
                className={`flex flex-1 flex-col justify-center ${
                  feature.wide ? 'p-7 sm:p-8 lg:p-10' : 'p-6 sm:p-7'
                }`}
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200/80 bg-white shadow-sm ${
                    feature.wide ? 'mb-4' : 'mb-4'
                  }`}
                >
                  <feature.icon className="h-5 w-5 text-[#FF6B00]" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="font-heading text-lg font-semibold tracking-tight text-zinc-950 sm:text-xl">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
