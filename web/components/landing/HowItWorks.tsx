import Link from 'next/link';
import { Fragment } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight, Package, Search, ShoppingCart } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: 'Discover',
    promise: 'Find vetted suppliers in minutes',
    description:
      'Browse categories and suppliers we verify for quality, fulfilment discipline, and retail fit.',
    Icon: Search,
  },
  {
    id: 2,
    title: 'Order',
    promise: 'Confirm with transparent wholesale pricing',
    description:
      'Build repeat baskets with clear unit economics — built for restocking, not one-off chaos.',
    Icon: ShoppingCart,
  },
  {
    id: 3,
    title: 'Receive',
    promise: 'Coordinated delivery across Lagos',
    description:
      'We orchestrate dispatch and last-mile handoff so stock lands where it sells, not in limbo.',
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
    <section className="border-y border-zinc-200/80 bg-white py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-14 max-w-2xl text-center sm:mb-20"
        >
          <p className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
            How it works
          </p>
          <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl lg:text-[2.75rem]">
            From discovery to shelf —{' '}
            <span className="text-primary">three simple steps</span>
          </h2>
          <div className="mx-auto mt-5 h-1 w-20 rounded-full bg-primary" aria-hidden />
          <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">
            A simple loop for Lagos retail: find trusted supply, place the order, receive stock with
            routing you can follow.
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
                className="rounded-2xl border border-primary/15 bg-stone-50/50 p-6 shadow-sm ring-1 ring-zinc-950/3"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                    <step.Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <span className="font-mono text-[11px] font-semibold text-zinc-400">
                      Step {step.id}
                    </span>
                    <h3 className="mt-1 font-heading text-xl font-semibold tracking-tight text-zinc-950">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm font-medium text-primary">{step.promise}</p>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-600">{step.description}</p>
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
                <div className="flex h-full flex-col rounded-2xl border border-primary/15 bg-stone-50/50 p-8 shadow-sm ring-1 ring-zinc-950/3">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                      <step.Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden />
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-sm font-semibold text-zinc-700">
                      {step.id}
                    </span>
                  </div>
                  <h3 className="mt-6 font-heading text-xl font-semibold tracking-tight text-zinc-950">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm font-medium text-primary">{step.promise}</p>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-600">{step.description}</p>
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
          className="mx-auto mt-16 max-w-xl text-center"
        >
          <p className="font-heading text-lg font-semibold text-zinc-950 sm:text-xl">
            Ready to place your first order?
          </p>
          <Link
            href="/auth/signup"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-primary bg-transparent px-7 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10 sm:text-[15px]"
          >
            Get started →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
