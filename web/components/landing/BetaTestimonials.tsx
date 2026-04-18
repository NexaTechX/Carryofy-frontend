import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Chioma O.',
    business: 'Mini-mart · Surulere',
    quote:
      'Sourcing from one place instead of chasing three markets has already saved me half a day each week.',
  },
  {
    name: 'Ibrahim K.',
    business: 'Phone & accessories · Yaba',
    quote:
      'Having verified vendors on the platform means I spend less time worrying about who I am paying.',
  },
  {
    name: 'Funke A.',
    business: 'Beauty supply · Lekki',
    quote:
      'The delivery flow is clearer than my old WhatsApp-and-rider routine — still early days, but promising.',
  },
] as const;

function initials(name: string) {
  return name
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export default function BetaTestimonials() {
  return (
    <section className="relative overflow-hidden border-t border-zinc-200/80 bg-stone-100 py-20 sm:py-24">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF6B00]/35 to-transparent"
        aria-hidden
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col items-center gap-3 text-center sm:mb-16">
          <span className="inline-flex items-center rounded-full border border-zinc-200/90 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-600">
            Beta · Lagos retailers
          </span>
          <h2 className="max-w-xl font-heading text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
            Proof from the floor — not a billboard.
          </h2>
          <p className="max-w-lg text-sm leading-relaxed text-zinc-600">
            Early quotes from operators trialling Carryofy. Not incentivised; not polished for press
            releases.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-stretch">
          {testimonials.map((t, index) => (
            <motion.article
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.07 }}
              className="flex h-full flex-col rounded-2xl border border-zinc-200/90 bg-white p-7 shadow-sm ring-1 ring-zinc-950/[0.03]"
            >
              <Quote className="mb-5 h-7 w-7 text-[#FF6B00]/25" aria-hidden />
              <blockquote className="mb-8 grow text-sm leading-relaxed text-zinc-700">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-4 border-t border-zinc-100 pt-5">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 text-sm font-semibold tracking-tight text-zinc-700 ring-2 ring-white ring-offset-2 ring-offset-white"
                  aria-hidden
                >
                  {initials(t.name)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-900">{t.name}</p>
                  <p className="text-xs text-zinc-500">{t.business}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
