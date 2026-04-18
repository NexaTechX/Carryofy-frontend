import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

export default function HomepageOnboardingNote() {
  return (
    <section className="border-y border-zinc-200/80 bg-white py-12 sm:py-14">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex flex-col items-center gap-3 rounded-2xl border border-zinc-200/90 bg-stone-50 px-6 py-5 sm:flex-row sm:gap-4 sm:px-8 sm:py-6"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm">
            <MapPin className="h-5 w-5 text-[#FF6B00]" strokeWidth={1.75} aria-hidden />
          </div>
          <p className="text-sm leading-relaxed text-zinc-600 sm:text-left sm:text-[15px]">
            <span className="font-semibold text-zinc-900">Now onboarding retailers and vendors</span>{' '}
            across Lagos corridors — built with operators, not slide-decks.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
