import { motion } from 'framer-motion';

export default function HomepageOnboardingNote() {
  return (
    <section className="py-12 sm:py-16 bg-white border-y border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-gray-600 text-base sm:text-lg max-w-2xl mx-auto"
        >
          Now onboarding retailers and vendors in Lagos.
        </motion.p>
      </div>
    </section>
  );
}
