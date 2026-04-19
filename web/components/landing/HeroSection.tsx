import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Cpu, LineChart } from 'lucide-react';

const heroPrimary =
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2000&auto=format&fit=crop';

const heroSecondary =
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1200&auto=format&fit=crop';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 text-white">
      <div className="landing-vignette pointer-events-none absolute inset-0" aria-hidden />
      <div className="landing-grid-dark pointer-events-none absolute inset-0 opacity-90" aria-hidden />
      <div
        className="pointer-events-none absolute -right-24 top-24 h-96 w-96 rounded-full bg-[#FF6600]/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-cyan-500/5 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-32 pt-28 sm:px-6 sm:pb-24 sm:pt-32 lg:px-8 lg:pb-28 lg:pt-36">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.95fr)] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-300 sm:text-xs">
              <span className="text-[#FF6600]">B2B</span>
              <span className="h-1 w-1 rounded-full bg-white/25" aria-hidden />
              <span className="text-zinc-400">Commerce · Supply · Lagos</span>
            </div>

            <h1 className="font-heading text-[2.35rem] font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.25rem] xl:text-[3.5rem]">
              Retail intelligence for operators who move real inventory —{' '}
              <span className="text-zinc-400">not slides.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
              Carryofy is the procurement layer for Lagos retailers: verified vendors, coordinated
              fulfilment, and AI-assisted sourcing — built for shelves, stockrooms, and last-mile
              reality.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-500 sm:text-[15px]">
              No cold calls to market. No cash upfront to strangers. Every vendor verified, every
              delivery tracked.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                id="hero-primary-cta"
                href="/auth/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6600] px-7 py-3.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-[#FF6600]/20 transition hover:bg-[#E65E00] sm:text-[15px]"
              >
                Start sourcing
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-zinc-300 underline decoration-white/25 underline-offset-4 transition hover:text-white sm:text-[15px]"
              >
                Sign in
              </Link>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-2 gap-6 border-t border-white/10 pt-10 sm:max-w-none sm:grid-cols-3">
              <div>
                <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  <LineChart className="h-4 w-4 text-[#FF6600]" aria-hidden />
                  Throughput
                </dt>
                <dd className="mt-2 font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Same-day
                </dd>
                <dd className="mt-1 text-xs text-zinc-500">corridors across Lagos</dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  <Cpu className="h-4 w-4 text-cyan-400/80" aria-hidden />
                  Platform
                </dt>
                <dd className="mt-2 font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  AI-assisted
                </dd>
                <dd className="mt-1 text-xs text-zinc-500">compare, route, restock</dd>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Trust
                </dt>
                <dd className="mt-2 font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Vetted vendors only
                </dd>
                <dd className="mt-1 text-xs text-zinc-500">Every supplier is quality-screened.</dd>
              </div>
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="relative mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-white/10">
              <Image
                src={heroPrimary}
                alt="Warehouse operations and palletized inventory"
                fill
                priority
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-zinc-400">
                  Fulfillment graph
                </p>
                <p className="mt-1 font-heading text-lg font-semibold text-white sm:text-xl">
                  Dispatch orchestration, not chatter threads.
                </p>
              </div>
            </div>

            <div className="absolute -bottom-6 left-4 right-4 sm:-bottom-8 sm:left-auto sm:right-[-8%] sm:w-[58%]">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950/80 shadow-2xl shadow-black/40 ring-1 ring-white/5 backdrop-blur-md">
                <div className="relative aspect-[16/10]">
                  <Image
                    src={heroSecondary}
                    alt="Team reviewing supply chain operations"
                    fill
                    sizes="(min-width: 1024px) 24vw, 85vw"
                    className="object-cover opacity-95"
                  />
                </div>
                <div className="border-t border-white/10 px-4 py-3">
                  <p className="text-xs font-medium text-white">Operator cockpit</p>
                  <p className="text-[11px] leading-snug text-zinc-500">
                    Orders, vendors, and delivery windows in one surface.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
