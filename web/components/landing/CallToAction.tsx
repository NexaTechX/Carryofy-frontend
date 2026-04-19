import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { motion } from 'framer-motion';

const ctaBg =
  'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=2400&auto=format&fit=crop';

export default function CallToAction() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (trimmed.includes('@')) {
      void router.push(`/auth/signup?email=${encodeURIComponent(trimmed)}`);
      return;
    }
    void router.push('/auth/signup');
  };

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
          Growing community of Lagos retailers and vendors
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.04 }}
          className="mt-4 font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.65rem]"
        >
          Your next bulk order shouldn&apos;t start in a market.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-zinc-400"
        >
          Join Lagos retailers already sourcing smarter on Carryofy. Verified vendors. Coordinated
          delivery. No middlemen.
        </motion.p>
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.12 }}
          onSubmit={handleSubmit}
          className="mx-auto mt-10 flex max-w-2xl flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center"
        >
          <label htmlFor="cta-email" className="sr-only">
            Your email address
          </label>
          <input
            id="cta-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3.5 text-sm text-white placeholder:text-zinc-500 backdrop-blur-sm focus:border-[#FF6600]/50 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 sm:min-w-0 sm:flex-1"
          />
          <button
            type="submit"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6600] px-8 py-3.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-[#FF6600]/15 transition hover:bg-[#E65E00] sm:shrink-0 sm:py-4 sm:text-[15px]"
          >
            Start sourcing →
          </button>
        </motion.form>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.14 }}
          className="mt-3 text-xs text-zinc-500"
        >
          No commitment. We&apos;ll reach out within 24hrs.
        </motion.p>
      </div>
    </section>
  );
}
