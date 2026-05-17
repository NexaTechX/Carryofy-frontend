import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, Headphones, Quote, ShieldCheck } from 'lucide-react';
import StockPhoto from '../common/StockPhoto';
import { unsplashPhoto } from '../../lib/unsplash';

const testimonials: {
  name: string;
  business: string;
  location: string;
  avatar: string;
  avatarAlt: string;
  quote: ReactNode;
}[] = [
  {
    name: 'Chioma Okafor',
    business: 'Boutique retail',
    location: 'Yaba',
    avatar: unsplashPhoto('photo-1573496359142-b8d87734a5a2', { w: 200, h: 200 }),
    avatarAlt: 'Portrait of Chioma Okafor, boutique retailer in Yaba',
    quote: (
      <>
        &ldquo;I restocked without sending someone to Balogun. The{' '}
        <span className="font-semibold text-[#FF6B00]">prices were clear before I paid</span>.&rdquo;
      </>
    ),
  },
  {
    name: 'Ibrahim Lawal',
    business: 'Specialty retail',
    location: 'Ikeja',
    avatar: unsplashPhoto('photo-1560250097-0b93528c311a', { w: 200, h: 200 }),
    avatarAlt: 'Portrait of Ibrahim Lawal, retailer in Ikeja',
    quote: (
      <>
        &ldquo;For fast-moving stock, I need vendors I can call again. Carryofy helped me compare{' '}
        <span className="font-semibold text-[#FF6B00]">stock and delivery in one place</span>.&rdquo;
      </>
    ),
  },
  {
    name: 'Funke Adeyemi',
    business: 'Retail supply',
    location: 'Lekki',
    avatar: unsplashPhoto('photo-1580489944761-15a19d654956', { w: 200, h: 200 }),
    avatarAlt: 'Portrait of Funke Adeyemi, retailer in Lekki',
    quote: (
      <>
        &ldquo;My customers ask for the same products every week. Reordering was faster, and I could{' '}
        <span className="font-semibold text-[#FF6B00]">track when dispatch left</span>.&rdquo;
      </>
    ),
  },
];

const corridorPartners = [
  { value: '200+ retailers', label: 'Mainland retail', sub: 'Yaba · Surulere · Ikeja' },
  { value: '4 corridors', label: 'Island corridors', sub: 'Lekki · Ajah · VI' },
  { value: 'All retail categories', label: 'Product range', sub: 'Verified suppliers, open catalogue' },
  { value: '1 logistics partner', label: 'Logistics reach', sub: 'Coordinated last-mile' },
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
          <p className="landing-eyebrow text-zinc-600">Marketplace trust</p>
          <h2 className="landing-title mt-3 text-3xl sm:text-4xl lg:text-[2.75rem]">
            Retailers and suppliers already trading on{' '}
            <span className="text-[#FF6B00]">Carryofy</span>
          </h2>
          <p className="landing-lead mt-3 text-base sm:text-lg">
            Real shops across Lagos use Carryofy to source stock, reorder fast, and get support when
            delivery or orders need a human hand.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="mt-12 rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-8 shadow-sm ring-1 ring-zinc-950/[0.03] backdrop-blur-sm sm:px-8"
        >
          <p className="text-center text-sm font-semibold text-zinc-600">Ecosystem coverage</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {corridorPartners.map((p) => (
              <div
                key={p.label}
                className="rounded-xl border border-zinc-100 bg-stone-50/90 px-4 py-4 text-center lg:text-left"
              >
                <p className="text-xl font-bold text-zinc-950">
                  {p.value}
                </p>
                <p className="mt-2 text-sm font-semibold text-zinc-900">{p.label}</p>
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
                <p className="text-sm font-semibold text-zinc-900">{b.title}</p>
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
                  <StockPhoto
                    src={t.avatar}
                    alt={t.avatarAlt}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-900">{t.name}</p>
                  <p className="truncate text-xs text-zinc-600 sm:text-sm">
                    {t.business}, {t.location}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
