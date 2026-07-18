import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

const retailerFeatures = [
  {
    title: 'Compare wholesale prices',
    text: 'Unit rates and MOQs shown before you add to basket — no WhatsApp price chase.',
  },
  {
    title: 'Buy from verified suppliers',
    text: 'Every vendor is screened so you restock from sellers you can reorder from.',
  },
  {
    title: 'Reorder in minutes',
    text: "Save fast-moving SKUs and rebuild last week's basket without another market trip.",
  },
  {
    title: 'Delivery to your shop',
    text: 'Carryofy coordinates dispatch and last-mile across Lagos corridors.',
  },
];

const supplierFeatures = [
  {
    title: 'Reach serious retailers',
    text: 'List where Lagos shops already browse for wholesale stock.',
  },
  {
    title: 'Orders in one place',
    text: 'Receive structured orders with quantities, pricing, and delivery context.',
  },
  {
    title: 'Grow corridor by corridor',
    text: 'Get in front of buyers in Yaba, Surulere, Lekki, Ikeja, and beyond.',
  },
];

export default function ValuePropositionsSection() {
  return (
    <section className="bg-background py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-12 max-w-2xl text-center sm:mb-14"
        >
          <p className="landing-eyebrow">Built for wholesale trade</p>
          <h2 className="landing-title mt-3 text-3xl sm:text-4xl lg:text-[2.75rem]">
            Source like a buyer. Sell like a supplier.{' '}
            <span className="text-primary">One marketplace.</span>
          </h2>
          <p className="landing-lead mt-3 text-base sm:text-lg">
            Carryofy is the wholesale floor for Lagos retail — catalogue, pricing, and delivery in
            one flow.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border-custom bg-card p-6 shadow-card sm:p-8"
          >
            <p className="landing-eyebrow">For retailers</p>
            <h3 className="landing-title mt-2 text-2xl sm:text-3xl">
              Restock without leaving the shop
            </h3>
            <p className="landing-lead mt-3 text-sm sm:text-base">
              Browse verified wholesale listings, confirm MOQs, and place orders that arrive at your
              storefront.
            </p>
            <ul className="mt-7 space-y-4 text-sm leading-relaxed text-foreground/65 sm:text-[15px]">
              {retailerFeatures.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                  </span>
                  <span>
                    <strong className="font-semibold text-foreground">{item.title}.</strong>{' '}
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/buyer/products"
              className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-[#1a0e00] transition hover:bg-primary-dark"
            >
              Start browsing wholesale
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06 }}
            className="rounded-2xl border border-border-custom bg-sidebar-bg p-6 sm:p-8"
          >
            <p className="landing-eyebrow">For suppliers</p>
            <h3 className="landing-title mt-2 text-xl sm:text-2xl">
              Put your catalogue in front of retailers who buy weekly
            </h3>
            <ul className="mt-6 space-y-4 text-sm leading-relaxed text-foreground/65 sm:text-[15px]">
              {supplierFeatures.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                  </span>
                  <span>
                    <strong className="font-semibold text-foreground">{item.title}.</strong>{' '}
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/merchant-onboarding"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary-light"
            >
              Apply to sell wholesale
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </motion.article>
        </div>
      </div>
    </section>
  );
}
