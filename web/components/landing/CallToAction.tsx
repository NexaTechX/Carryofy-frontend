import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Store, Truck } from 'lucide-react';
import StockPhoto from '../common/StockPhoto';
import { unsplashPhoto } from '../../lib/unsplash';

const ctaBg = unsplashPhoto('photo-1604719312566-8912e9227c6a', { w: 1920 });

export default function CallToAction() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24 lg:py-28">
      <div className="absolute inset-0">
        <StockPhoto
          src={ctaBg}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          priority={false}
        />
        <div className="absolute inset-0 bg-zinc-950/88" aria-hidden />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-sm font-semibold text-zinc-400"
        >
          Lagos wholesale · Open catalogue
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.04 }}
          className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.65rem]"
        >
          Your next restock starts in the catalogue — not in traffic.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-zinc-400"
        >
          Browse verified vendors, compare wholesale prices, and place orders with delivery coordinated
          across Yaba, Surulere, Lekki, and more.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.12 }}
          className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
        >
          <Link
            href="/buyer/products"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-primary/25 transition hover:bg-primary-dark sm:text-[15px]"
          >
            Browse wholesale catalogue
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15 sm:text-[15px]"
          >
            Create retailer account
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.14 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-400"
        >
          <span className="inline-flex items-center gap-2">
            <Store className="h-4 w-4 text-primary-light" aria-hidden />
            Verified vendor listings
          </span>
          <span className="inline-flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary-light" aria-hidden />
            Coordinated Lagos delivery
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.16 }}
          className="mt-8 text-sm text-zinc-500"
        >
          Selling wholesale?{' '}
          <Link href="/merchant-onboarding" className="font-medium text-primary-light hover:text-white">
            List on Carryofy →
          </Link>
        </motion.p>
      </div>
    </section>
  );
}
