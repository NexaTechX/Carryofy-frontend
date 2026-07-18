import Link from 'next/link';
import { Fragment } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight, Package, Search, ShoppingCart } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: 'Browse the catalogue',
    promise: 'Filter by category, price, and stock',
    description:
      'Open wholesale aisles, compare unit prices from verified vendors, and shortlist SKUs the way you would on a market floor.',
    Icon: Search,
  },
  {
    id: 2,
    title: 'Place a wholesale order',
    promise: 'MOQ and totals before you pay',
    description:
      'Confirm quantities, see cart totals upfront, and reorder favourites without chasing suppliers on WhatsApp.',
    Icon: ShoppingCart,
  },
  {
    id: 3,
    title: 'Receive at your shop',
    promise: 'Coordinated Lagos delivery',
    description:
      'Carryofy routes dispatch and last-mile handoff so stock lands at your storefront — with status you can follow.',
    Icon: Package,
  },
] as const;

function ConnectorHorizontal() {
  return (
    <div className="hidden shrink-0 items-center gap-1 self-center lg:flex" aria-hidden>
      <div className="h-px w-5 bg-primary/35 xl:w-8" />
      <ArrowRight className="h-5 w-5 text-primary" strokeWidth={2} />
      <div className="h-px w-5 border-t border-dashed border-primary/45 xl:w-8" />
    </div>
  );
}

function ConnectorVertical() {
  return (
    <div className="flex justify-center py-2 lg:hidden" aria-hidden>
      <div className="flex flex-col items-center gap-1">
        <div className="h-5 w-px bg-primary/35" />
        <ArrowDown className="h-5 w-5 text-primary" strokeWidth={2} />
        <div className="h-5 w-px border-l border-dashed border-primary/45" />
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section className="border-y border-border-custom bg-sidebar-bg py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-12 max-w-2xl text-center sm:mb-14"
        >
          <p className="landing-eyebrow">How wholesale buying works</p>
          <h2 className="landing-title mt-3 text-3xl sm:text-4xl lg:text-[2.75rem]">
            From catalogue to shop floor in{' '}
            <span className="text-primary">three steps</span>
          </h2>
          <p className="landing-lead mt-3 text-base sm:text-lg">
            The same restock rhythm retailers already know — browse, buy wholesale, receive —
            without the market run.
          </p>
        </motion.div>

        <div className="lg:hidden">
          {steps.map((step, index) => (
            <Fragment key={step.id}>
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.07 }}
                className="rounded-2xl border border-border-custom bg-card p-6 shadow-card"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                    <step.Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/45">
                      Step {step.id}
                    </span>
                    <h3 className="mt-1 text-xl font-bold text-foreground">{step.title}</h3>
                    <p className="mt-2 text-sm font-medium text-primary">{step.promise}</p>
                    <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
              {index < steps.length - 1 && <ConnectorVertical />}
            </Fragment>
          ))}
        </div>

        <div className="hidden lg:flex lg:flex-row lg:items-stretch lg:gap-4 xl:gap-6">
          {steps.map((step, index) => (
            <Fragment key={step.id}>
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.07 }}
                className="min-w-0 flex-1"
              >
                <div className="flex h-full flex-col rounded-2xl border border-border-custom bg-card p-8 shadow-card">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                      <step.Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden />
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border-strong bg-surface-2 font-mono text-sm font-semibold text-foreground/80">
                      {step.id}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm font-medium text-primary">{step.promise}</p>
                  <p className="mt-4 text-sm leading-relaxed text-foreground/60">{step.description}</p>
                </div>
              </motion.div>
              {index < steps.length - 1 && <ConnectorHorizontal />}
            </Fragment>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mt-12 max-w-xl text-center sm:mt-14"
        >
          <p className="text-lg font-semibold text-foreground sm:text-xl">
            Ready to check what&apos;s in stock?
          </p>
          <Link
            href="/buyer/products"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-[#1a0e00] transition hover:bg-primary-dark sm:text-[15px]"
          >
            Open wholesale catalogue
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
