import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  MapPin,
  Search,
  ShieldCheck,
  Store,
  Truck,
} from 'lucide-react';

const quickCategories = [
  { label: 'Electronics', slug: 'electronics' },
  { label: 'Fashion', slug: 'fashion' },
  { label: 'Beauty', slug: 'beauty' },
  { label: 'Home & kitchen', slug: 'home' },
  { label: 'Groceries', slug: 'grocery' },
];

const indexRows = [
  {
    icon: ShieldCheck,
    label: 'Verified vendors',
    sub: 'Every supplier screened before trading',
    metric: 'SCREENED',
  },
  {
    icon: Store,
    label: 'Wholesale catalogue',
    sub: 'MOQ-friendly SKUs, unit pricing upfront',
    metric: 'ALL RETAIL',
  },
  {
    icon: Truck,
    label: 'Lagos delivery',
    sub: 'Coordinated dispatch + last-mile handoff',
    metric: 'SAME-DAY*',
  },
];

const corridors = ['Yaba', 'Surulere', 'Lekki', 'Ajah', 'Ikeja', 'VI'];

export default function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      void router.push(`/buyer/products?search=${encodeURIComponent(q)}`);
      return;
    }
    void router.push('/buyer/products');
  };

  return (
    <section className="relative isolate overflow-hidden bg-background text-foreground">
      {/* Backdrop: plotting grid + orange vignette glow (atmosphere, not the subject) */}
      <div className="landing-grid-dark pointer-events-none absolute inset-0 z-0" aria-hidden />
      <div className="landing-vignette pointer-events-none absolute inset-0 z-0" aria-hidden />
      <div
        className="pointer-events-none absolute -right-40 -top-40 z-0 h-[38rem] w-[38rem] rounded-full bg-primary/10 blur-[120px]"
        aria-hidden
      />

      {/* Announcement strip */}
      <div className="relative z-10 border-b border-border-custom/70">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-2.5 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-foreground/55 sm:px-6">
          <span className="inline-flex items-center gap-1.5 text-foreground/80">
            <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden />
            Wholesale marketplace · Lagos
          </span>
          <span className="hidden text-border-strong sm:inline" aria-hidden>
            /
          </span>
          <span>Browse catalogue free — account only when you order</span>
          <span className="hidden text-border-strong md:inline" aria-hidden>
            /
          </span>
          <span className="hidden md:inline">Same-day on key corridors</span>
        </div>
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:px-8 lg:py-28">
        {/* Left — the pitch */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="max-w-xl"
        >
          <div className="landing-eyebrow mb-5 inline-flex items-center gap-2 rounded-full border border-border-custom bg-card/60 px-3 py-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            Best B2B wholesale · Nigeria &amp; Africa
          </div>

          <h1 className="landing-title text-[2.4rem] leading-[1.03] sm:text-5xl lg:text-[3.75rem]">
            Source stock from{' '}
            <span className="text-primary">verified Lagos wholesalers</span> — skip the
            market run.
          </h1>

          <p className="geo-speakable landing-lead mt-6 text-base sm:text-lg">
            Browse verified suppliers, compare unit prices, and reorder fast — one wholesale
            floor with pricing, MOQs, and coordinated delivery across Yaba, Surulere, Lekki
            &amp; beyond.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-stretch"
            role="search"
          >
            <label htmlFor="hero-marketplace-search" className="sr-only">
              Search wholesale products
            </label>
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/40"
                aria-hidden
              />
              <input
                id="hero-marketplace-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, brands, or categories…"
                className="w-full rounded-xl border border-border-strong bg-card py-3.5 pl-12 pr-4 text-sm text-foreground shadow-card placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 sm:text-[15px]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-[#1a0e00] shadow-primary-glow transition hover:bg-primary-dark sm:shrink-0 sm:text-[15px]"
            >
              Search catalogue
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/45">
              Popular
            </span>
            {quickCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/buyer/products?category=${cat.slug}`}
                className="rounded-full border border-border-custom bg-card/50 px-3 py-1 text-xs font-medium text-foreground/75 transition hover:border-primary/50 hover:text-primary"
              >
                {cat.label}
              </Link>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
          >
            <Link
              id="hero-browse-cta"
              href="/buyer/products"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-7 py-3.5 text-sm font-semibold text-background transition hover:bg-white sm:text-[15px]"
            >
              Browse wholesale catalogue
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-xl border border-border-strong bg-card/40 px-6 py-3.5 text-sm font-semibold text-foreground/90 transition hover:border-foreground/40 sm:text-[15px]"
            >
              Retailer sign in
            </Link>
            <Link
              href="/merchant-onboarding"
              className="text-sm font-medium text-foreground/60 underline decoration-border-strong underline-offset-4 transition hover:text-primary"
            >
              Sell on Carryofy
            </Link>
          </motion.div>
        </motion.div>

        {/* Right — live sourcing index panel (data density = the differentiator) */}
        <motion.aside
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="hidden lg:block"
        >
          <div className="relative overflow-hidden rounded-2xl border border-border-custom bg-card/80 shadow-elevated backdrop-blur-sm">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" aria-hidden />

            <div className="flex items-center justify-between border-b border-border-custom px-5 py-3.5">
              <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/60">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                </span>
                Lagos catalogue · live
              </span>
              <span className="font-mono text-[11px] tracking-[0.1em] text-foreground/35">
                /marketplace
              </span>
            </div>

            <ul>
              {indexRows.map((row, i) => {
                const Icon = row.icon;
                return (
                  <li
                    key={row.label}
                    className={`flex items-start gap-3.5 px-5 py-4 ${
                      i < indexRows.length - 1 ? 'border-b border-border-custom/70' : ''
                    }`}
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">{row.label}</p>
                        <span className="shrink-0 rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.1em] text-primary-light">
                          {row.metric}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] leading-snug text-foreground/55">
                        {row.sub}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-border-custom px-5 py-4">
              <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/40">
                Active corridors
              </p>
              <div className="flex flex-wrap gap-1.5">
                {corridors.map((c) => (
                  <span
                    key={c}
                    className="rounded-md border border-border-custom bg-surface-2/60 px-2 py-1 font-mono text-[11px] tracking-[0.06em] text-foreground/70"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href="/buyer/products"
              className="flex items-center justify-center gap-2 border-t border-border-custom bg-primary/[0.07] py-3.5 text-sm font-semibold text-primary transition hover:bg-primary/[0.12]"
            >
              View all categories
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </motion.aside>
      </div>
    </section>
  );
}
