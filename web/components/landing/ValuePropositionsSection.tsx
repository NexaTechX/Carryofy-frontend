import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check } from 'lucide-react';

const retailImg =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop';
const vendorImg =
  'https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1600&auto=format&fit=crop';

const retailerFeatures = [
  {
    title: 'Verified Products',
    text: 'Access a curated selection of authentic goods from trusted suppliers.',
  },
  {
    title: 'Competitive Pricing',
    text: 'Maximize your margins with transparent wholesale rates.',
  },
  {
    title: 'Effortless Ordering',
    text: 'Simplify procurement with our intuitive platform and fast delivery.',
  },
  {
    title: 'Flexible Payments',
    text: 'Manage your cash flow with convenient payment options.',
  },
];

const supplierFeatures = [
  {
    title: 'Verified Retail Network',
    text: 'Connect with serious buyers across Lagos.',
  },
  {
    title: 'Streamlined Sales',
    text: 'Automate orders, payments, and logistics.',
  },
  {
    title: 'Market Insights',
    text: 'Gain valuable data to optimize your product offerings.',
  },
  {
    title: 'Secure Payments',
    text: 'Ensure timely and reliable transactions.',
  },
];

export default function ValuePropositionsSection() {
  return (
    <section className="bg-stone-50 py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-14 max-w-2xl text-center sm:mb-20"
        >
          <p className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
            Who it serves
          </p>
          <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl lg:text-[2.75rem]">
            One platform. Two sides of the <span className="text-primary">aisle</span>.
          </h2>
          <div className="mx-auto mt-5 h-1 w-20 rounded-full bg-primary" aria-hidden />
          <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">
            Procurement for retailers. Distribution rails for vendors — with fulfilment that matches
            how Lagos actually runs.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm ring-1 ring-zinc-950/4"
          >
            <div className="absolute inset-x-0 top-0 z-10 h-1 bg-primary" aria-hidden />
            <div className="relative aspect-16/11 sm:aspect-16/10">
              <Image
                src={retailImg}
                alt="Modern retail floor with shelving and inventory"
                fill
                className="object-cover transition duration-700 group-hover:scale-[1.02]"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
              <div className="absolute inset-0 bg-linear-to-t from-zinc-950/85 via-zinc-950/25 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-primary-light">
                  For retailers
                </p>
                <h3 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Stock Smart, Sell More.
                </h3>
              </div>
            </div>
            <div className="border-t border-zinc-100 p-6 sm:p-8">
              <ul className="space-y-4 text-sm leading-relaxed text-zinc-600 sm:text-[15px]">
                {retailerFeatures.map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                    </span>
                    <span>
                      <strong className="font-semibold text-zinc-900">{item.title}:</strong>{' '}
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/signup"
                className="group/link mt-6 inline-flex items-center gap-1 text-sm font-semibold text-zinc-900 transition hover:text-primary"
              >
                <span className="border-b border-zinc-900/30 transition group-hover/link:border-primary/50">
                  Explore buyer experience
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
              </Link>
              <p className="mt-3 text-[12px] leading-snug text-zinc-500">
                Used by boutique owners across Yaba, Lekki &amp; Surulere
              </p>
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06 }}
            className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm ring-1 ring-zinc-950/4"
          >
            <div className="absolute inset-x-0 top-0 z-10 h-1 bg-primary" aria-hidden />
            <div className="relative aspect-16/11 sm:aspect-16/10">
              <Image
                src={vendorImg}
                alt="Warehouse pallets and logistics"
                fill
                className="object-cover transition duration-700 group-hover:scale-[1.02]"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
              <div className="absolute inset-0 bg-linear-to-t from-zinc-950/85 via-zinc-950/25 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-primary-light">
                  For suppliers
                </p>
                <h3 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Expand Your Reach, Simplify Your Sales.
                </h3>
              </div>
            </div>
            <div className="border-t border-zinc-100 p-6 sm:p-8">
              <ul className="space-y-4 text-sm leading-relaxed text-zinc-600 sm:text-[15px]">
                {supplierFeatures.map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                    </span>
                    <span>
                      <strong className="font-semibold text-zinc-900">{item.title}:</strong>{' '}
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/merchant-onboarding"
                className="group/link mt-6 inline-flex items-center gap-1 text-sm font-semibold text-zinc-900 transition hover:text-primary"
              >
                <span className="border-b border-zinc-900/30 transition group-hover/link:border-primary/50">
                  Partner as a seller
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
              </Link>
              <p className="mt-3 text-[12px] leading-snug text-zinc-500">
                Suppliers across fashion, beauty, electronics &amp; grocery
              </p>
            </div>
          </motion.article>
        </div>
      </div>
    </section>
  );
}
