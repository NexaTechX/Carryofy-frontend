import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const retailImg =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop';
const vendorImg =
  'https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1600&auto=format&fit=crop';

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
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-zinc-500">
            Who it serves
          </p>
          <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl lg:text-[2.75rem]">
            One platform. Two sides of the <span className="text-[#FF6600]">aisle</span>.
          </h2>
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
            className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm ring-1 ring-zinc-950/[0.04]"
          >
            <div className="relative aspect-[16/11] sm:aspect-[16/10]">
              <Image
                src={retailImg}
                alt="Modern retail floor with shelving and inventory"
                fill
                className="object-cover transition duration-700 group-hover:scale-[1.02]"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/25 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-white/70">
                  For retailers
                </p>
                <h3 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Restock without the market marathon.
                </h3>
              </div>
            </div>
            <div className="border-t border-zinc-100 p-6 sm:p-8">
              <p className="text-sm leading-relaxed text-zinc-600 sm:text-[15px]">
                Browse verified vendors, compare lines, and place orders from the store — we
                coordinate delivery so your team stays on the floor.
              </p>
              <Link
                href="/auth/signup"
                className="group/link mt-6 inline-flex items-center gap-1 text-sm font-semibold text-zinc-900 transition hover:text-[#FF6600]"
              >
                <span className="border-b border-zinc-900/30 transition group-hover/link:border-[#FF6600]/50">
                  Explore buyer experience
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#FF6600]" strokeWidth={2} />
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
            className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm ring-1 ring-zinc-950/[0.04]"
          >
            <div className="relative aspect-[16/11] sm:aspect-[16/10]">
              <Image
                src={vendorImg}
                alt="Warehouse pallets and logistics"
                fill
                className="object-cover transition duration-700 group-hover:scale-[1.02]"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/25 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-white/70">
                  For vendors
                </p>
                <h3 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Put your products in front of 500+ active retail buyers — with payments you can
                  count on.
                </h3>
              </div>
            </div>
            <div className="border-t border-zinc-100 p-6 sm:p-8">
              <p className="text-sm leading-relaxed text-zinc-600 sm:text-[15px]">
                We handle the order, you handle the goods. List SKU depth with confidence — we bring
                demand, delivery orchestration, and the operational rigour retailers expect.
              </p>
              <Link
                href="/merchant-onboarding"
                className="group/link mt-6 inline-flex items-center gap-1 text-sm font-semibold text-zinc-900 transition hover:text-[#FF6600]"
              >
                <span className="border-b border-zinc-900/30 transition group-hover/link:border-[#FF6600]/50">
                  Partner as a seller
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#FF6600]" strokeWidth={2} />
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
