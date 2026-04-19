import { motion } from 'framer-motion';

export default function TrustQuoteBreak() {
  return (
    <section className="bg-[#111111] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading text-xl font-semibold leading-snug text-white sm:text-2xl lg:text-[1.75rem]"
        >
          African commerce runs on trust. Carryofy puts that trust on a platform.
        </motion.p>
      </div>
    </section>
  );
}
