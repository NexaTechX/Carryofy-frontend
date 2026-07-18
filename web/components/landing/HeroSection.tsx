import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Search } from 'lucide-react';
import StockPhoto from '../common/StockPhoto';
import { unsplashPhoto } from '../../lib/unsplash';

const heroImage = unsplashPhoto('photo-1586528116311-ad8dd3c8310d', { w: 2400 });

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
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-background text-foreground">
      {/* Full-bleed wholesale floor — the visual subject */}
      <div className="absolute inset-0 z-0">
        <StockPhoto
          src={heroImage}
          alt="Wholesale warehouse aisle with palletized inventory ready for retail restock"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-linear-to-r from-[#070a10]/96 via-[#070a10]/88 to-[#070a10]/55"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-linear-to-t from-[#070a10] via-[#070a10]/40 to-[#070a10]/55"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_15%_40%,rgba(255,107,0,0.16),transparent_60%)]"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-32 lg:px-8 lg:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="max-w-2xl"
        >
          <p className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Carryofy
          </p>

          <h1 className="landing-title mt-5 text-[2.15rem] leading-[1.05] sm:text-5xl lg:text-[3.4rem]">
            Wholesale stock for Lagos retailers —{' '}
            <span className="text-primary">priced, verified, delivered.</span>
          </h1>

          <p className="geo-speakable landing-lead mt-5 max-w-xl text-base sm:text-lg">
            Browse unit prices and MOQs from verified suppliers. Restock your shop without another
            market run.
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
                className="w-full rounded-xl border border-white/15 bg-[#0c1018]/80 py-3.5 pl-12 pr-4 text-sm text-white shadow-card backdrop-blur-sm placeholder:text-white/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 sm:text-[15px]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-[#1a0e00] shadow-primary-glow transition hover:bg-primary-dark sm:shrink-0 sm:text-[15px]"
            >
              Search catalogue
            </button>
          </form>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
          >
            <Link
              id="hero-browse-cta"
              href="/buyer/products"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-[#0a0c10] transition hover:bg-white/90 sm:text-[15px]"
            >
              Browse wholesale
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 sm:text-[15px]"
            >
              Create retailer account
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
