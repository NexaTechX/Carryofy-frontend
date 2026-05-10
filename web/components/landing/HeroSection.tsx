import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, LineChart, Package, Shield } from 'lucide-react';

const heroImage = '/images/hero-b2b-lagos.png';

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[min(100svh,52rem)] items-center overflow-hidden text-white">
      <div className="absolute inset-0">
        <Image
          src={heroImage}
          alt="Busy wholesale warehouse with organized aisles for fashion, beauty, and general trade — team coordinating B2B inventory and fulfilment"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_32%]"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-zinc-950/45" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/88 to-zinc-950/35 sm:from-zinc-950 sm:via-zinc-950/80 sm:to-zinc-950/25"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/15 to-zinc-950/55"
        aria-hidden
      />
      <div
        className="landing-vignette pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-28 sm:px-6 sm:py-32 lg:px-8 lg:py-36">
        <div className="max-w-2xl lg:max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="mb-6 inline-flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-zinc-950/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-200 backdrop-blur-sm sm:text-xs">
              <span className="text-[#FF6B00]">B2B marketplace</span>
              <span className="h-1 w-1 rounded-full bg-white/30" aria-hidden />
              <span className="text-zinc-300">Lagos retailers · Verified suppliers</span>
            </div>

            <h1 className="font-heading text-[2rem] font-semibold leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-[2.75rem] xl:text-[3rem]">
              <span className="block">
                Carryofy: Your Trusted Partner for Seamless B2B Trade in Lagos.
              </span>
              <span className="mt-3 block text-[0.92em] font-medium text-zinc-200 sm:mt-4">
                Connect with verified suppliers, streamline procurement, and grow with confidence.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
              One platform for fashion, beauty, electronics, and grocery — authentic wholesale
              supply, transparent pricing, and logistics built for how Lagos actually moves.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                id="hero-primary-cta"
                href="/auth/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-7 py-3.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-[#FF6B00]/30 transition hover:bg-[#E65100] sm:text-[15px]"
              >
                Get started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-zinc-200 underline decoration-white/30 underline-offset-4 transition hover:text-white sm:text-[15px]"
              >
                Sign in
              </Link>
            </div>

            <div className="mt-8 rounded-xl border border-white/15 bg-zinc-950/50 p-4 backdrop-blur-md sm:mt-10 sm:max-w-xl sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FF6B00]/25 text-[#FF6B00]">
                  <Package className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </div>
                <p className="text-sm leading-relaxed text-zinc-300">
                  <span className="font-semibold text-white">On Carryofy — </span>
                  verified supplier network, category depth across fashion, beauty, electronics
                  &amp; grocery, and delivery you can track instead of chasing on WhatsApp.
                </p>
              </div>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-2 gap-6 border-t border-white/15 pt-10 sm:max-w-2xl sm:grid-cols-3">
              <div>
                <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                  <LineChart className="h-4 w-4 text-[#FF6B00]" aria-hidden />
                  Speed
                </dt>
                <dd className="mt-2 font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Same-day
                </dd>
                <dd className="mt-1 text-xs text-zinc-400">on key Lagos corridors</dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                  <Shield className="h-4 w-4 text-cyan-300/90" aria-hidden />
                  Trust
                </dt>
                <dd className="mt-2 font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Vetted only
                </dd>
                <dd className="mt-1 text-xs text-zinc-400">suppliers &amp; SKUs screened</dd>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                  Coverage
                </dt>
                <dd className="mt-2 font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  4 categories
                </dd>
                <dd className="mt-1 text-xs text-zinc-400">deep wholesale inventory</dd>
              </div>
            </dl>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
