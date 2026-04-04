import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Chioma O.',
    business: 'Mini-mart · Surulere',
    quote: 'Sourcing from one place instead of chasing three markets has already saved me half a day each week.',
  },
  {
    name: 'Ibrahim K.',
    business: 'Phone & accessories · Yaba',
    quote: 'Having verified vendors on the platform means I spend less time worrying about who I am paying.',
  },
  {
    name: 'Funke A.',
    business: 'Beauty supply · Lekki',
    quote: 'The delivery flow is clearer than my old WhatsApp-and-rider routine — still early days, but promising.',
  },
];

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
    <section className="border-t border-gray-200/80 bg-[#FAFAFA] py-14 sm:py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col items-center gap-3 text-center sm:mb-12">
            <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Beta feedback
            </span>
            <p className="max-w-2xl text-sm text-gray-600">
              Early quotes from retailers trying Carryofy — not paid endorsements.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-stretch">
            {testimonials.map((t, index) => (
              <motion.article
                key={t.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <Quote className="mb-4 h-8 w-8 text-primary/20" aria-hidden />
                <blockquote className="mb-6 grow text-sm leading-relaxed text-gray-800">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700"
                    aria-hidden
                  >
                    {initials(t.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.business}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
