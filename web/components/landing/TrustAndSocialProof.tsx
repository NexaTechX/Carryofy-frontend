import Image from 'next/image';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, Headphones, Quote, ShieldCheck } from 'lucide-react';

const testimonials: {
  name: string;
  business: string;
  location: string;
  avatar: string;
  avatarAlt: string;
  quote: ReactNode;
}[] = [
  {
    name: 'Chioma G.',
    business: 'Threads & Co. Boutique',
    location: 'Yaba, Lagos',
    avatar:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&h=200&auto=format&fit=crop',
    avatarAlt: 'Portrait of Chioma, fashion retailer',
    quote: (
      <>
        &ldquo;Sourcing from one place instead of chasing three markets has already saved me{' '}
        <span className="font-semibold text-[#FF6B00]">half a day each week</span>.&rdquo;
      </>
    ),
  },
  {
    name: 'Ibrahim K.',
    business: 'K-Mobile Accessories',
    location: 'Computer Village corridor',
    avatar:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&h=200&auto=format&fit=crop',
    avatarAlt: 'Portrait of Ibrahim, electronics retailer',
    quote: (
      <>
        &ldquo;Verified vendors on the platform means I spend{' '}
        <span className="font-semibold text-[#FF6B00]">less time</span> worrying about who I am
        paying.&rdquo;
      </>
    ),
  },
  {
    name: 'Funke A.',
    business: 'Glow Beauty Supply',
    location: 'Lekki, Lagos',
    avatar:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&h=200&auto=format&fit=crop',
    avatarAlt: 'Portrait of Funke, beauty supply owner',
    quote: (
      <>
        &ldquo;I placed my first order in{' '}
        <span className="font-semibold text-[#FF6B00]">under three minutes</span> — clearer than my
        old WhatsApp-and-rider routine.&rdquo;
      </>
    ),
  },
];

const corridorPartners = [
  { label: 'Mainland retail', sub: 'Yaba · Surulere · Ikeja' },
  { label: 'Island corridors', sub: 'Lekki · Ajah · VI' },
  { label: 'Category depth', sub: 'Fashion · Beauty · Tech · Grocery' },
  { label: 'Logistics mesh', sub: 'Coordinated last-mile' },
];

const badges = [
  {
    icon: ShieldCheck,
    title: 'Verified suppliers',
    text: 'Every vendor is screened before they can trade on Carryofy.',
  },
  {
    icon: BadgeCheck,
    title: 'Order visibility',
    text: 'Track confirmations and handoffs without chasing status in chats.',
  },
  {
    icon: Headphones,
    title: 'Operator support',
    text: 'Real people for disputes, delivery exceptions, and account help.',
  },
];

export default function TrustAndSocialProof() {
  return (
    <section className="relative overflow-hidden border-t border-zinc-200/80 bg-gradient-to-b from-white via-stone-50/80 to-stone-50 py-20 sm:py-24 lg:py-28">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF6B00]/30 to-transparent"
        aria-hidden
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center rounded-full border border-zinc-200/90 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-600">
            Trust &amp; proof
          </span>
          <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl lg:text-[2.75rem]">
            Built for Lagos operators —{' '}
            <span className="text-[#FF6B00]">backed by real workflows</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">
            Early retailers and suppliers onboarding across the city. No fluff — just dependable B2B
            rails and support when things move fast.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="mt-12 rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-8 shadow-sm ring-1 ring-zinc-950/[0.03] backdrop-blur-sm sm:px-8"
        >
          <p className="text-center font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
            Ecosystem coverage
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {corridorPartners.map((p) => (
              <div
                key={p.label}
                className="rounded-xl border border-zinc-100 bg-stone-50/90 px-4 py-4 text-center lg:text-left"
              >
                <p className="font-heading text-sm font-semibold text-zinc-900">{p.label}</p>
                <p className="mt-1 text-xs leading-snug text-zinc-500">{p.sub}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {badges.map((b, index) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className="flex gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm ring-1 ring-zinc-950/[0.02]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#FF6B00]/20 bg-[#FF6B00]/10 text-[#FF6B00]">
                <b.icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </div>
              <div>
                <p className="font-heading text-sm font-semibold text-zinc-900">{b.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">{b.text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3 md:items-stretch">
          {testimonials.map((t, index) => (
            <motion.article
              key={t.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.07 }}
              className="flex min-w-0 flex-col rounded-2xl border border-zinc-200/90 bg-white p-7 shadow-sm ring-1 ring-zinc-950/[0.03]"
            >
              <Quote className="mb-4 h-7 w-7 text-[#FF6B00]/25" aria-hidden />
              <blockquote className="mb-8 grow text-[15px] leading-relaxed text-zinc-700 sm:text-base">
                {t.quote}
              </blockquote>
              <div className="flex items-center gap-4 border-t border-zinc-100 pt-5">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-white ring-offset-2 ring-offset-white">
                  <Image
                    src={t.avatar}
                    alt={t.avatarAlt}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-900">{t.name}</p>
                  <p className="truncate text-xs text-zinc-600 sm:text-sm">{t.business}</p>
                  <p className="text-xs text-zinc-500">{t.location}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
