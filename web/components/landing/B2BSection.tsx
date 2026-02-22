import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileText, Package, Users } from 'lucide-react';

export default function B2BSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-[#F5F5F5]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Text */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-inter text-3xl sm:text-4xl lg:text-5xl font-bold text-[#111111] leading-tight mb-6">
                Built for businesses too.
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Whether you&apos;re stocking a store or managing corporate procurement, Carryofy supports bulk orders, quote requests, MOQ pricing, and invoice generation — all in one account.
              </p>
              <Link
                href="/buyer/products?b2b=true"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF6B00] text-white rounded-xl font-semibold hover:bg-[#E65F00] transition-colors shadow-lg shadow-[#FF6B00]/20"
              >
                Explore B2B Features
                <span aria-hidden>→</span>
              </Link>
            </motion.div>

            {/* Right - B2B mockup visual */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#FF6B00]" />
                    </div>
                    <div>
                      <div className="font-inter font-bold text-[#111111]">B2B Dashboard</div>
                      <div className="text-sm text-gray-500">Bulk orders & quotes</div>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { icon: Package, label: 'Bulk order request', sub: 'Min. order 10 units' },
                    { icon: FileText, label: 'Quote request', sub: 'Custom pricing' },
                    { icon: Users, label: 'Invoice generation', sub: 'Corporate accounts' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-3 rounded-xl bg-[#FAFAFA] border border-gray-100"
                    >
                      <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                        <item.icon className="w-4 h-4 text-[#FF6B00]" />
                      </div>
                      <div>
                        <div className="font-medium text-[#111111] text-sm">{item.label}</div>
                        <div className="text-xs text-gray-500">{item.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
