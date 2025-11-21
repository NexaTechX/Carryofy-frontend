import { AlertTriangle, PackageX, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProblemSection() {
    const problems = [
        {
            icon: PackageX,
            title: 'Delivery Failures',
            description: '60%+ of online orders arrive late or never arrive at all, leading to frustrated customers and lost sales.',
        },
        {
            icon: TrendingDown,
            title: 'Seller Struggles',
            description: 'Sellers lack professional storage, packaging, and reliable delivery services to scale their businesses.',
        },
        {
            icon: AlertTriangle,
            title: 'Logistics Chaos',
            description: 'No unified platform combines marketplace, logistics, fulfillment, and AI, creating operational headaches.',
        },
    ];

    return (
        <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                        The Problem: African Commerce Is Broken
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Merchants and buyers face daily challenges that hinder growth and trust.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {problems.map((problem, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                        >
                            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-6">
                                <problem.icon className="w-7 h-7 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{problem.title}</h3>
                            <p className="text-gray-600 leading-relaxed">
                                {problem.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
