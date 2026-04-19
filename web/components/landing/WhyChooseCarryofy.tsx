import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, Truck } from 'lucide-react';

const imageFeatures = [
  {
    icon: ShieldCheck,
    title: 'Verified vendor graph',
    description:
      'Buy from suppliers we underwrite — fewer bad batches, fewer disappearing sellers.',
    image:
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1400&auto=format&fit=crop',
    imageAlt: 'Quality inspection and documents on a desk',
  },
  {
    icon: Truck,
    title: 'Logistics orchestration',
    description:
      'Last-mile coordinated with partners you are not texting at midnight for status.',
    image:
      'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c0?q=80&w=1400&auto=format&fit=crop',
    imageAlt: 'Shipping containers at port',
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
            Trust, throughput, <span className="text-[#FF6600]">intelligence</span> — in one spine.
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {imageFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className="group flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-stone-50 shadow-sm ring-1 ring-zinc-950/[0.03]"
            >
              <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-zinc-200">
                <Image
                  src={feature.image}
                  alt={feature.imageAlt}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-[1.03]"
                  sizes="(min-width: 1024px) 33vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/55 via-transparent to-transparent" />
              </div>

              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200/80 bg-white shadow-sm">
                  <feature.icon className="h-5 w-5 text-[#FF6600]" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold tracking-tight text-zinc-950 sm:text-xl">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">{feature.description}</p>
              </div>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.12 }}
            className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-[#111111] shadow-sm ring-1 ring-zinc-950/[0.03]"
          >
            <div className="relative flex aspect-[16/10] w-full shrink-0 items-center justify-center bg-[#111111]">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <span className="absolute inline-flex h-5 w-5 animate-ping rounded-full bg-[#FF6600] opacity-40" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-[#FF6600]" />
              </div>
              <Sparkles className="absolute right-5 top-5 h-5 w-5 text-[#FF6600]/40" aria-hidden />
            </div>
            <div className="flex flex-1 flex-col p-6 sm:p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-sm">
                <Sparkles className="h-5 w-5 text-[#FF6600]" strokeWidth={1.75} aria-hidden />
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold tracking-tight text-white sm:text-xl">
                AI-assisted procurement
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Describe what you need in plain English. Carryofy&apos;s AI matches you to the right
                vendor, quantity, and price — before you even open a WhatsApp chat.
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mt-12 flex max-w-4xl flex-col items-center justify-center gap-3 border-t border-zinc-200/90 pt-10 text-center sm:flex-row sm:flex-wrap sm:gap-6 sm:gap-x-10"
        >
          <p className="text-xs text-zinc-500 sm:text-sm">Industry-leading order accuracy</p>
          <span className="hidden text-zinc-300 sm:inline" aria-hidden>
            |
          </span>
          <p className="text-xs text-zinc-500 sm:text-sm">&lt; 4hr avg. response time</p>
          <span className="hidden text-zinc-300 sm:inline" aria-hidden>
            |
          </span>
          <p className="text-xs text-zinc-500 sm:text-sm">100% vendor-verified</p>
        </motion.div>
      </div>
    </section>
  );
}
