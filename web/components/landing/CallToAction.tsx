import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Package, ShieldCheck, Truck } from 'lucide-react';
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
        <div className="absolute inset-0 bg-background/93" aria-hidden />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_120%,rgba(255,107,0,0.2),transparent_60%)]"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="landing-eyebrow justify-center"
        >
          Next restock starts here
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.04 }}
          className="landing-title mt-3 text-3xl sm:text-4xl lg:text-[2.65rem]"
        >
          Open the wholesale catalogue. Fill your shelves this week.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="landing-lead mx-auto mt-5 max-w-lg text-base"
        >
          Compare verified suppliers, confirm MOQs, and place orders with delivery coordinated across
          Lagos — Yaba, Surulere, Lekki, Ikeja, and more.
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
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-[#1a0e00] shadow-lg shadow-primary/25 transition hover:bg-primary-dark sm:text-[15px]"
          >
            Browse wholesale now
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
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-foreground/55"
        >
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
            Verified suppliers
          </span>
          <span className="inline-flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" aria-hidden />
            Clear MOQs
          </span>
          <span className="inline-flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" aria-hidden />
            Lagos delivery
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.16 }}
          className="mt-8 text-sm text-foreground/45"
        >
          Selling wholesale?{' '}
          <Link href="/merchant-onboarding" className="font-medium text-primary hover:text-primary-light">
            List your catalogue on Carryofy →
          </Link>
        </motion.p>
      </div>
    </section>
  );
}
