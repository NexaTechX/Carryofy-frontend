import { motion } from 'framer-motion';
import { Shield, TrendingUp, Zap, Globe } from 'lucide-react';

export default function WhyChooseCarryofy() {
  const features = [
    {
      icon: Shield,
      title: 'Verification First',
      description: 'Only quality vendors and approved products reach buyers.',
      gradient: 'from-blue-500/10 to-blue-600/5',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      icon: TrendingUp,
      title: 'Transparent Rules',
      description: 'Clear commissions, no hidden fees, no surprises.',
      gradient: 'from-green-500/10 to-green-600/5',
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      icon: Zap,
      title: 'Intelligence‑Led Decisions',
      description: 'Smarter approvals, recommendations, and protections built into the platform.',
      gradient: 'from-yellow-500/10 to-yellow-600/5',
      iconBg: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
    },
    {
      icon: Globe,
      title: 'Built for Scale',
      description: 'Proven in high‑friction markets and designed to grow globally.',
      gradient: 'from-purple-500/10 to-purple-600/5',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white to-gray-50/50 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight"
          >
            Why Carryofy
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl sm:text-2xl text-gray-600 font-medium"
          >
            Not just another marketplace — a smarter way to trade.
          </motion.p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group relative bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-16 h-16 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
                </div>
                <h3 className="font-bold text-gray-900 mb-3 text-lg sm:text-xl group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  {feature.description}
                </p>
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}></div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
