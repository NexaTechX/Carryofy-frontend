import { motion } from 'framer-motion';
import { Shield, FileCheck, TrendingUp, Target } from 'lucide-react';

export default function TrustCredibility() {
  const trustPoints = [
    {
      icon: Shield,
      title: 'Secure payment infrastructure',
      description: 'Bank-level encryption and secure transactions',
      gradient: 'from-green-500/10 to-emerald-500/5',
    },
    {
      icon: FileCheck,
      title: 'Admin‑approved products',
      description: 'Quality assurance for every listing',
      gradient: 'from-blue-500/10 to-cyan-500/5',
    },
    {
      icon: TrendingUp,
      title: 'Clear commission structure',
      description: 'Transparent pricing with no hidden fees',
      gradient: 'from-purple-500/10 to-violet-500/5',
    },
    {
      icon: Target,
      title: 'Founder‑led, long‑term vision',
      description: 'Built for sustainable growth',
      gradient: 'from-orange-500/10 to-amber-500/5',
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white to-gray-50/30 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Trust & Credibility
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built on transparency, security, and quality assurance
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
            {trustPoints.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="group relative bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                    <point.icon className="w-7 h-7" />
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                      {point.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </div>
                <div className={`absolute inset-0 bg-gradient-to-br ${point.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}></div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
