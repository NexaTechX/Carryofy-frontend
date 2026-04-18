import Image from 'next/image';
import { motion } from 'framer-motion';

const steps = [
  {
    id: 1,
    title: 'Discover',
    description: 'Search across categories and suppliers we verify for quality and fulfilment.',
    image:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop',
    imageAlt: 'Analytics dashboard on a laptop',
  },
  {
    id: 2,
    title: 'Order',
    description: 'Purchase in clicks with clear pricing — built for repeat baskets, not one-offs.',
    image:
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1200&auto=format&fit=crop',
    imageAlt: 'Payment terminal at checkout counter',
  },
  {
    id: 3,
    title: 'Receive',
    description: 'We coordinate dispatch and last-mile delivery so stock shows up where it sells.',
    image:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop',
    imageAlt: 'Delivery and logistics in a warehouse',
  },
] as const;

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
            From signal to shelf — without the chaos.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">
            A closed loop for modern Lagos retail: browse, buy, and inbound stock with a team behind
            the routing.
          </p>
        </motion.div>

        <div className="grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-10">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.07 }}
              className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-950/[0.03]"
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
                <h3 className="font-heading text-xl font-semibold tracking-tight text-zinc-950">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
