import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Package, Truck, CircleDollarSign, ShoppingBag, CreditCard, Shield } from 'lucide-react';

const sellerSteps = [
  { id: 1, title: 'Apply & get verified', description: 'Submit your business details. We verify and onboard you.', icon: UserCheck },
  { id: 2, title: 'List products', description: 'Add your products. We help if needed.', icon: Package },
  { id: 3, title: 'We handle orders & delivery', description: 'We store, pack, and deliver. You focus on selling.', icon: Truck },
  { id: 4, title: 'Get paid', description: 'Receive payouts after delivery confirmation.', icon: CircleDollarSign },
];

const buyerSteps = [
  { id: 1, title: 'Browse & order', description: 'Shop quality products from verified Lagos sellers. Add to cart and checkout.', icon: ShoppingBag },
  { id: 2, title: 'Pay securely', description: 'Checkout safely. Your payment is protected until delivery.', icon: CreditCard },
  { id: 3, title: 'Same-day delivery', description: 'Get your order the same day. Track it in real time across Lagos.', icon: Truck },
  { id: 4, title: 'Buyer protection', description: 'Full refunds and support if delivery fails or the item isn\'t as described.', icon: Shield },
];

export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState<'sellers' | 'buyers'>('sellers');

  const steps = activeTab === 'sellers' ? sellerSteps : buyerSteps;

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900"
            >
              How it Works
            </motion.h2>
            {/* Tabs */}
            <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 mt-4">
              <button
                type="button"
                onClick={() => setActiveTab('sellers')}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === 'sellers'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                For Sellers
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('buyers')}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === 'buyers'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                For Buyers
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-5xl mx-auto relative">
            {/* Step connector line - hidden on mobile */}
            <div className="hidden lg:block absolute top-7 left-[12.5%] right-[12.5%] h-0.5 bg-linear-to-r from-primary/30 via-primary/50 to-primary/30" aria-hidden />
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="text-center relative"
              >
                <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 relative z-10 shadow-lg shadow-primary/25">
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
