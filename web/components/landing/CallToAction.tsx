import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const ctaBg =
  'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=2400&auto=format&fit=crop';

export default function CallToAction() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={ctaBg}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          priority={false}
        />
        <div className="absolute inset-0 bg-zinc-950/82" />
        <div className="landing-vignette absolute inset-0 opacity-60" aria-hidden />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-28 lg:px-8 lg:py-32">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-zinc-400"
        >
          Ready when you are
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.04 }}
          className="mt-4 font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.65rem]"
        >
          Put procurement on rails — starting this quarter.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-zinc-400"
        >
          Join retailers and vendors building the next layer of B2B commerce in Lagos — with
          fulfilment that matches the pace of your stores.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.12 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href="/auth/signup"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-8 py-4 text-sm font-semibold text-zinc-950 shadow-lg shadow-[#FF6B00]/15 transition hover:bg-[#E65F00] sm:text-[15px]"
          >
            Start sourcing — free to join
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-xl border border-white/20 px-8 py-4 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5 sm:text-[15px]"
          >
            Talk to our team
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
