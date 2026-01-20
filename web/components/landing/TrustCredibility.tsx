import { motion } from 'framer-motion';
import { Users, Star, Award, TrendingUp, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

export default function TrustCredibility() {
  const currentYear = new Date().getFullYear();
  
  const trustMetrics = [
    {
      icon: Award,
      value: '100%',
      label: 'Verified Sellers',
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
    },
    {
      icon: Users,
      value: '1000+',
      label: 'Active Users',
      color: 'from-primary to-primary-light',
      bgColor: 'bg-orange-50',
      iconColor: 'text-primary',
    },
    {
      icon: TrendingUp,
      value: '95%',
      label: 'Success Rate',
      color: 'from-cyan-600 to-cyan-700',
      bgColor: 'bg-cyan-50',
      iconColor: 'text-cyan-700',
    },
    {
      icon: Star,
      value: '4.8/5',
      label: 'Average Rating',
      color: 'from-primary-light to-primary',
      bgColor: 'bg-orange-50',
      iconColor: 'text-primary',
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white via-gray-50/50 to-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-primary mb-6">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Building Nigeria's Most Trusted Marketplace
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Since {currentYear}, we've been connecting verified sellers with confident buyers. Join our growing community of trusted commerce.
            </p>
          </motion.div>

          {/* Trust Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {trustMetrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <div className={`w-14 h-14 ${metric.bgColor} rounded-xl flex items-center justify-center mb-4 mx-auto`}>
                  <metric.icon className={`w-7 h-7 ${metric.iconColor}`} />
                </div>
                <div className={`text-3xl sm:text-4xl font-bold bg-gradient-to-r ${metric.color} bg-clip-text text-transparent mb-2 text-center`}>
                  {metric.value}
                </div>
                <div className="text-sm sm:text-base text-gray-600 font-medium text-center">
                  {metric.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Testimonial Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-cyan-50 via-white to-orange-50 rounded-3xl p-8 sm:p-12 border border-cyan-100 shadow-xl mb-12"
          >
            <div className="text-center max-w-3xl mx-auto">
              <div className="flex justify-center mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <blockquote className="text-xl sm:text-2xl lg:text-3xl font-medium text-gray-800 mb-6 italic">
                "Early customers are testing Carryofy and loving the experience. Real reviews coming soon."
              </blockquote>
              <div className="text-gray-600 font-semibold">
                — The Carryofy Community
              </div>
            </div>
          </motion.div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              Have Questions? We're Here to Help
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Our Nigerian support team is available to assist with orders, delivery issues, refunds, or any questions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:support@carryofy.com"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-xl hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-300 font-semibold transform hover:-translate-y-1"
              >
                <Mail className="w-5 h-5" />
                Email Support
              </a>
              <a
                href="tel:+2349166783040"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-primary-light text-white rounded-xl hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 font-semibold transform hover:-translate-y-1"
              >
                <Phone className="w-5 h-5" />
                Call Us: +234 916 678 3040
              </a>
            </div>
            <div className="mt-8">
              <Link
                href="/contact"
                className="text-cyan-600 hover:text-cyan-700 font-semibold underline underline-offset-4"
              >
                Visit our full contact page →
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
