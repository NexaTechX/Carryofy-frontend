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
import StockPhoto from '../common/StockPhoto';
import { unsplashPhoto } from '../../lib/unsplash';

/** Wholesale market / retail trade — marketplace first impression */
const heroBgImage = unsplashPhoto('photo-1555529669-156f81f57b1e', { w: 1920 });

const quickCategories = [
  { label: 'Electronics', slug: 'electronics' },
  { label: 'Fashion', slug: 'fashion' },
  { label: 'Beauty', slug: 'beauty' },
  { label: 'Home & kitchen', slug: 'home' },
  { label: 'Groceries', slug: 'grocery' },
];

const marketplaceStats = [
  { label: 'Verified vendors', value: 'Screened suppliers', icon: ShieldCheck },
  { label: 'Wholesale catalogue', value: 'MOQ-friendly SKUs', icon: Store },
  { label: 'Lagos delivery', value: 'Coordinated last-mile', icon: Truck },
];

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
    <section className="relative overflow-hidden bg-stone-100 text-zinc-900">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="border-b border-zinc-200/90 bg-white"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-2.5 text-center text-xs text-zinc-600 sm:px-6 sm:text-sm">
          <span className="inline-flex items-center gap-1.5 font-medium text-zinc-800">
            <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden />
            Wholesale marketplace · Lagos
          </span>
          <span className="hidden text-zinc-300 sm:inline" aria-hidden>
            |
          </span>
          <span>Browse catalog free — account only when you order</span>
          <span className="hidden text-zinc-300 md:inline" aria-hidden>
            |
          </span>
          <span className="hidden md:inline">Same-day on key corridors</span>
        </div>
      </motion.div>

      <div className="relative">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="pointer-events-none absolute inset-0"
        >
          <StockPhoto
            src={heroBgImage}
            alt=""
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(105deg,rgba(250,250,249,0.97)_0%,rgba(250,250,249,0.92)_42%,rgba(250,250,249,0.55)_68%,rgba(250,250,249,0.2)_100%)]"
            aria-hidden
          />
        </motion.div>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-4 py-24 sm:px-6 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12 lg:px-8 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-xl"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="landing-eyebrow mb-4 inline-flex items-center gap-2"
            >
              <Store className="h-4 w-4 shrink-0" aria-hidden />
              B2B wholesale marketplace
            </motion.div>

            <h1 className="landing-title text-[2rem] leading-[1.15] sm:text-4xl lg:text-[2.75rem]">
              Source wholesale stock from verified Lagos suppliers.
            </h1>

            <p className="landing-lead mt-5 text-base sm:text-lg">
              Browse categories, compare unit prices, and reorder fast — without running between
              markets. Built for retailers stocking shops across Yaba, Surulere, Lekki &amp; beyond.
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
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
                  aria-hidden
                />
                <input
                  id="hero-marketplace-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products, brands, or categories…"
                  className="w-full rounded-xl border border-zinc-200 bg-white py-3.5 pl-12 pr-4 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 sm:text-[15px]"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-zinc-950 shadow-md shadow-primary/25 transition hover:bg-primary-dark sm:shrink-0 sm:text-[15px]"
              >
                Search catalogue
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-zinc-500">Popular:</span>
              {quickCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/buyer/products?category=${cat.slug}`}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 transition hover:border-primary/40 hover:text-primary"
                >
                  {cat.label}
                </Link>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
            >
              <Link
                id="hero-browse-cta"
                href="/buyer/products"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:text-[15px]"
              >
                Browse wholesale catalogue
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-6 py-3.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400 sm:text-[15px]"
              >
                Retailer sign in
              </Link>
              <Link
                href="/merchant-onboarding"
                className="text-sm font-medium text-zinc-600 underline decoration-zinc-300 underline-offset-4 transition hover:text-primary"
              >
                Sell on Carryofy
              </Link>
            </motion.div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden lg:block"
          >
            <div className="rounded-2xl border border-zinc-200/90 bg-white/95 p-6 shadow-xl shadow-zinc-900/8 backdrop-blur-sm ring-1 ring-zinc-950/5">
              <p className="text-sm font-semibold text-zinc-700">On the marketplace</p>
              <ul className="mt-5 space-y-4">
                {marketplaceStats.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li
                      key={item.label}
                      className="flex items-start gap-3 border-b border-zinc-100 pb-4 last:border-0 last:pb-0"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">{item.label}</p>
                        <p className="mt-0.5 text-sm text-zinc-500">{item.value}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Link
                href="/buyer/products"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary/30 bg-primary/5 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10"
              >
                View all categories
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}
