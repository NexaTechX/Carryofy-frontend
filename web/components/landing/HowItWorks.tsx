import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ShoppingCart, Truck, PackageCheck, UserCheck, Package, CircleDollarSign } from 'lucide-react';

const buyerSteps = [
  {
    id: 1,
    title: 'Browse & discover',
    description: 'Browse and discover products from verified sellers',
    icon: Search,
  },
  {
    id: 2,
    title: 'Place your order',
    description: 'Place your order securely',
    icon: ShoppingCart,
  },
  {
    id: 3,
    title: 'We handle fulfillment & delivery',
    description: 'We handle fulfillment & delivery',
    icon: Truck,
  },
  {
    id: 4,
    title: 'Receive & track',
    description: 'Receive your order, track in real time',
    icon: PackageCheck,
  },
];

const sellerSteps = [
  { id: 1, title: 'Apply & get verified', description: 'Apply and get verified', icon: UserCheck },
  { id: 2, title: 'List your products', description: 'List your products', icon: Package },
  { id: 3, title: 'We handle orders & delivery', description: 'We handle orders and delivery', icon: Truck },
  { id: 4, title: 'Get paid fast', description: 'Get paid fast', icon: CircleDollarSign },
];

export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState<'buyers' | 'sellers'>('buyers');
  const steps = activeTab === 'buyers' ? buyerSteps : sellerSteps;

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-[#F5F5F5]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-inter text-3xl sm:text-4xl lg:text-5xl font-bold text-[#111111] mb-6">
              How it Works
            </h2>
            <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab('buyers')}
                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'buyers'
                    ? 'bg-[#111111] text-white shadow-sm'
                    : 'text-gray-600 hover:text-[#111111]'
                }`}
              >
                For Buyers
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sellers')}
                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'sellers'
                    ? 'bg-[#111111] text-white shadow-sm'
                    : 'text-gray-600 hover:text-[#111111]'
                }`}
              >
                For Sellers
              </button>
            </div>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center mb-4">
                  <step.icon className="w-6 h-6 text-[#FF6B00]" />
                </div>
                <div className="text-sm font-semibold text-[#111111] mb-2">
                  {index + 1}. {step.title}
                </div>
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
