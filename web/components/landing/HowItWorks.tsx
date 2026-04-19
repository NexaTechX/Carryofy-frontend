import Image from 'next/image';
import Link from 'next/link';
import { Fragment } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: 'Discover',
    promise: 'Find vetted suppliers in under 2 minutes',
    description: 'Search across categories and suppliers we verify for quality and fulfilment.',
    image:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop',
    imageAlt: 'Analytics dashboard on a laptop',
  },
  {
    id: 2,
    title: 'Order',
    promise: 'Confirm your order with one tap',
    description: 'Purchase in clicks with clear pricing — built for repeat baskets, not one-offs.',
    image:
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1200&auto=format&fit=crop',
    imageAlt: 'Payment terminal at checkout counter',
  },
  {
    id: 3,
    title: 'Receive',
    promise: 'Same-day or next-day delivery across Lagos',
    description: 'We coordinate dispatch and last-mile delivery so stock shows up where it sells.',
    image:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop',
    imageAlt: 'Delivery and logistics in a warehouse',
  },
] as const;

function StepCard({
  step,
  className = '',
}: {
  step: (typeof steps)[number];
  className?: string;
}) {
  return (
    <div
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-950/[0.03] ${className}`}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={step.image}
          alt={step.imageAlt}
          fill
          className="object-cover transition duration-700 group-hover:scale-[1.03]"
          sizes="(min-width: 768px) 33vw, 100vw"
        />
        <div className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-zinc-950/70 text-sm font-semibold text-white backdrop-blur-sm">
          {step.id}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <h3 className="font-heading text-xl font-semibold tracking-tight text-zinc-950">{step.title}</h3>
        <p className="mt-2 text-sm font-medium text-[#FF6600]">{step.promise}</p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">{step.description}</p>
      </div>
    </div>
  );
}

function ConnectorHorizontal() {
  return (
    <div className="hidden shrink-0 items-center gap-1 self-center md:flex" aria-hidden>
      <div className="h-px w-5 bg-[#FF6600]/35 lg:w-8" />
      <ArrowRight className="h-5 w-5 text-[#FF6600]" strokeWidth={2} />
      <div className="h-px w-5 border-t border-dashed border-[#FF6600]/50 lg:w-8" />
    </div>
  );
}

function ConnectorVertical() {
  return (
    <div className="flex justify-center py-2 md:hidden" aria-hidden>
      <div className="flex flex-col items-center gap-1">
        <div className="h-5 w-px bg-[#FF6600]/35" />
        <ArrowDown className="h-5 w-5 text-[#FF6600]" strokeWidth={2} />
        <div className="h-5 w-px border-l border-dashed border-[#FF6600]/50" />
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section className="border-y border-zinc-200/80 bg-stone-50 py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-14 max-w-2xl text-center sm:mb-20"
        >
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-zinc-500">
            Workflow
          </p>
          <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl lg:text-[2.75rem]">
            From signal to <span className="text-[#FF6600]">shelf</span> — without the chaos.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">
            A closed loop for modern Lagos retail: browse, buy, and inbound stock with a team behind
            the routing.
          </p>
        </motion.div>

        {/* Mobile: stacked + vertical connectors */}
        <div className="md:hidden">
          {steps.map((step, index) => (
            <Fragment key={step.id}>
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.07 }}
              >
                <StepCard step={step} />
              </motion.div>
              {index < steps.length - 1 && <ConnectorVertical />}
            </Fragment>
          ))}
        </div>

        {/* Desktop: row + horizontal connectors */}
        <div className="hidden md:flex md:flex-row md:items-stretch md:gap-3 lg:gap-5">
          {steps.map((step, index) => (
            <Fragment key={step.id}>
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.07 }}
                className="min-w-0 flex-1"
              >
                <StepCard step={step} />
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
            Ready to make your first order?
          </p>
          <Link
            href="/auth/signup"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#FF6600] bg-transparent px-7 py-3 text-sm font-semibold text-[#FF6600] transition hover:bg-[#FF6600]/10 sm:text-[15px]"
          >
            Start sourcing →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
