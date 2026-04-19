import Image from 'next/image';
import { motion } from 'framer-motion';

type RetailerProblem =
  | {
      title: string;
      description: string;
      callout: string;
      variant: 'image';
      image: string;
      imageAlt: string;
    }
  | {
      title: string;
      description: string;
      callout: string;
      variant: 'dark';
      quote: string;
    };

const retailerProblems: RetailerProblem[] = [
  {
    title: 'Unreliable suppliers',
    description:
      'Fragmented sourcing makes it hard to know who will deliver quality stock on time — or show up at all.',
    callout: 'Every vendor on Carryofy is verified and rated by real buyers.',
    image:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1400&auto=format&fit=crop',
    imageAlt: 'Person reviewing paperwork and logistics stress',
    variant: 'image',
  },
  {
    title: 'Endless market trips',
    description:
      'Hours lost traveling and chasing stock — time better spent serving customers and compounding sales.',
    callout: 'Browse, order, and restock from your phone in minutes.',
    image:
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=1400&auto=format&fit=crop',
    imageAlt: 'Urban traffic and commuting in a dense city',
    variant: 'image',
  },
  {
    title: 'Trust without rails',
    description:
      'Without verified partners and dependable logistics, restocking stays risky, slow, and expensive.',
    callout: 'Escrow-style order protection. Pay only when goods are confirmed.',
    quote: 'Trust scales when every handoff is visible — not just promised.',
    variant: 'dark',
  },
];

export default function ProblemSection() {
  return (
    <section className="relative bg-white py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 max-w-3xl sm:mb-20">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-zinc-500">
            The gap
          </p>
          <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl lg:text-[2.75rem]">
            African commerce runs on relationships — but not on a shared operating{' '}
            <span className="text-[#FF6600]">layer</span>.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg">
            Lagos retailers still stitch orders across WhatsApp, markets, and ad-hoc riders. Carryofy
            is building the verified, logistics-backed layer retailers can run on.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:items-stretch">
          {retailerProblems.map((problem, index) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-stone-50/80 shadow-sm ring-1 ring-zinc-950/[0.03]"
            >
              {problem.variant === 'image' ? (
                <div className="relative aspect-[16/11] w-full shrink-0 overflow-hidden">
                  <Image
                    src={problem.image}
                    alt={problem.imageAlt}
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 33vw, 100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent" />
                  <p className="absolute bottom-4 left-4 right-4 font-heading text-lg font-semibold text-white">
                    {problem.title}
                  </p>
                </div>
              ) : (
                <div className="relative flex aspect-[16/11] w-full shrink-0 flex-col items-center justify-center bg-[#1A1A1A] px-6 py-5">
                  <div className="relative h-14 w-14 sm:h-16 sm:w-16">
                    <Image
                      src="/logo.png"
                      alt=""
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="font-heading text-lg font-semibold text-white">{problem.title}</p>
                  <p className="mt-4 max-w-[15rem] text-center text-sm italic leading-relaxed text-white/85">
                    &ldquo;{problem.quote}&rdquo;
                  </p>
                </div>
              )}
              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <p className="text-sm leading-relaxed text-zinc-600">{problem.description}</p>
                <p className="mt-4 text-sm font-medium leading-snug text-[#FF6600]">
                  What Carryofy does instead: {problem.callout}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
