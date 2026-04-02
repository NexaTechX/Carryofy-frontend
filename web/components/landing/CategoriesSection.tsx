import { motion } from 'framer-motion';
import { Shirt, Sparkles, Cpu, Apple } from 'lucide-react';

const categories = [
  { name: 'Fashion', icon: Shirt },
  { name: 'Beauty', icon: Sparkles },
  { name: 'Electronics', icon: Cpu },
  { name: 'Grocery', icon: Apple },
];

export default function CategoriesSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-[#F5F5F5]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-12"
          >
            <h2 className="font-inter text-3xl sm:text-4xl lg:text-5xl font-bold text-[#111111] mb-3">
              Categories
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              More categories added as vendors join.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, index) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#FF6B00]/20 transition-all text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center mx-auto mb-4">
                  <cat.icon className="w-7 h-7 text-[#FF6B00]" />
                </div>
                <h3 className="font-inter font-bold text-[#111111] text-lg">{cat.name}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
