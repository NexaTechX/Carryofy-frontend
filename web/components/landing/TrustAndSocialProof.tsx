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
        <span className="font-semibold text-primary">prices were clear before I paid</span>.&rdquo;
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
        <span className="font-semibold text-primary">stock and delivery in one place</span>.&rdquo;
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
        <span className="font-semibold text-primary">track when dispatch left</span>.&rdquo;
      </>
    ),
  },
];

const badges = [
  {
    icon: ShieldCheck,
    title: 'Verified suppliers only',
    text: 'Vendors are screened before they can trade — so retailers buy with more confidence.',
  },
  {
    icon: BadgeCheck,
    title: 'Order visibility',
    text: 'Follow confirmations and handoffs without chasing status across WhatsApp threads.',
  },
  {
    icon: Headphones,
    title: 'Operator support',
    text: 'Real people for delivery exceptions, disputes, and account help when you need it.',
  },
];

export default function TrustAndSocialProof() {
  return (
    <section className="relative overflow-hidden border-t border-border-custom bg-background py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="landing-eyebrow">Trusted by Lagos retailers</p>
          <h2 className="landing-title mt-3 text-3xl sm:text-4xl lg:text-[2.75rem]">
            Built for shops that restock every week
          </h2>
          <p className="landing-lead mt-3 text-base sm:text-lg">
            Boutiques, specialty stores, and retail suppliers use Carryofy to source stock, reorder
            fast, and get support when delivery needs a human hand.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {badges.map((b, index) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className="flex gap-4 rounded-2xl border border-border-custom bg-card p-5 shadow-card"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                <b.icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{b.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/60">{b.text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3 md:items-stretch">
          {testimonials.map((t, index) => (
            <motion.article
              key={t.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.07 }}
              className="flex min-w-0 flex-col rounded-2xl border border-border-custom bg-card p-7 shadow-card"
            >
              <Quote className="mb-4 h-7 w-7 text-primary/40" aria-hidden />
              <blockquote className="mb-8 grow text-[15px] leading-relaxed text-foreground/80 sm:text-base">
                {t.quote}
              </blockquote>
              <div className="flex items-center gap-4 border-t border-border-custom pt-5">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-border-strong ring-offset-2 ring-offset-card">
                  <StockPhoto
                    src={t.avatar}
                    alt={t.avatarAlt}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{t.name}</p>
                  <p className="truncate text-xs text-foreground/55 sm:text-sm">
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
