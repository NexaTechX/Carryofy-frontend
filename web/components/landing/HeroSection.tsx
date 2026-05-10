import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, LineChart, Package, Shield } from 'lucide-react';

/** Wholesale / logistics — aligns with B2B supply; scrims keep left-column copy readable. */
const heroBgImage =
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2400&auto=format&fit=crop';

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[min(100svh,52rem)] items-center overflow-hidden bg-gray-900 text-white">
      <div className="pointer-events-none absolute inset-0">
        <Image
          src={heroBgImage}
          alt=""
          fill
          className="object-cover object-[center_40%] sm:object-[center_35%]"
          sizes="100vw"
          priority
        />
        {/* Base cool tint so the photo reads on-brand with orange accents */}
        <div
          className="absolute inset-0 bg-[linear-gradient(135deg,rgba(17,24,39,0.55)_0%,rgba(23,30,44,0.4)_45%,rgba(42,45,62,0.25)_100%)]"
          aria-hidden
        />
        {/* Stronger scrim on the left where headlines sit; right stays more open so the image shows */}
        <div
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,7,18,0.92)_0%,rgba(17,24,39,0.78)_38%,rgba(17,24,39,0.45)_65%,rgba(17,24,39,0.22)_100%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_78%_24%,rgba(255,107,0,0.2),transparent_38%)]"
          aria-hidden
        />
        <div className="landing-vignette absolute inset-0 opacity-50" aria-hidden />
      </div>
      <div
        className="landing-grid-dark pointer-events-none absolute inset-0 opacity-[0.32]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-28 sm:px-6 sm:py-32 lg:px-8 lg:py-36">
        <div className="max-w-2xl lg:max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="mb-6 inline-flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-100 shadow-sm backdrop-blur-sm sm:text-xs">
              <span className="text-primary-light">B2B marketplace</span>
              <span className="h-1 w-1 rounded-full bg-white/40" aria-hidden />
              <span className="text-zinc-200">Lagos retailers · Verified suppliers</span>
            </div>

            <h1 className="font-heading text-[2rem] font-semibold leading-[1.12] tracking-tight text-white [text-shadow:0_2px_28px_rgba(0,0,0,0.45)] sm:text-4xl lg:text-[2.75rem] xl:text-[3rem]">
              <span className="block">
                Carryofy: Your Trusted Partner for Seamless B2B Trade in Lagos.
              </span>
              <span className="mt-3 block text-[0.92em] font-medium text-zinc-100 sm:mt-4">
                Connect with verified suppliers, streamline procurement, and grow with confidence.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-200 sm:text-lg">
              One platform for fashion, beauty, electronics, and grocery — authentic wholesale
              supply, transparent pricing, and logistics built for how Lagos actually moves.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                id="hero-primary-cta"
                href="/auth/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-primary/30 transition hover:bg-primary-dark sm:text-[15px]"
              >
                Get started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-zinc-100 underline decoration-white/35 underline-offset-4 transition hover:text-white sm:text-[15px]"
              >
                Sign in
              </Link>
            </div>

            <div className="mt-8 rounded-xl border border-white/15 bg-white/10 p-4 shadow-2xl shadow-zinc-950/20 backdrop-blur-md sm:mt-10 sm:max-w-xl sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary-light">
                  <Package className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </div>
                <p className="text-sm leading-relaxed text-zinc-200">
                  <span className="font-semibold text-white">On Carryofy — </span>
                  verified supplier network, category depth across fashion, beauty, electronics
                  &amp; grocery, and delivery you can track instead of chasing on WhatsApp.
                </p>
              </div>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-2 gap-6 border-t border-white/20 pt-10 sm:max-w-2xl sm:grid-cols-3">
              <div>
                <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-300">
                  <LineChart className="h-4 w-4 text-primary-light" aria-hidden />
                  Speed
                </dt>
                <dd className="mt-2 font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Same-day
                </dd>
                <dd className="mt-1 text-xs text-zinc-300">on key Lagos corridors</dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-300">
                  <Shield className="h-4 w-4 text-cyan-300/90" aria-hidden />
                  Trust
                </dt>
                <dd className="mt-2 font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Vetted only
                </dd>
                <dd className="mt-1 text-xs text-zinc-300">suppliers &amp; SKUs screened</dd>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-zinc-300">
                  Coverage
                </dt>
                <dd className="mt-2 font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  4 categories
                </dd>
                <dd className="mt-1 text-xs text-zinc-300">deep wholesale inventory</dd>
              </div>
            </dl>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
