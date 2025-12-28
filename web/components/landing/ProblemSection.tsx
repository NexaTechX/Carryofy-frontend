import { AlertTriangle, PackageX, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProblemSection() {
    const problems = [
        {
            icon: PackageX,
            title: 'Unreliable Vendors',
            description: 'Instagram and WhatsApp sellers often don\'t deliver on time, or at all. You\'re left wondering where your order is.',
        },
        {
            icon: TrendingDown,
            title: 'Delayed Deliveries',
            description: 'Orders take days or weeks, with no tracking or accountability. You have to keep following up via WhatsApp.',
        },
        {
            icon: AlertTriangle,
            title: 'No Accountability',
            description: 'When something goes wrong, there\'s no customer service or refund policy. You\'re on your own.',
        },
    ];

    return (
        <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10 sm:mb-12 lg:mb-16">
                    <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
                        Shopping Online in Lagos Shouldn't Be This Hard
                    </h2>
                    <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
                        Buying from sellers shouldn't mean dealing with unreliable deliveries and WhatsApp stress in Lagos.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    {problems.map((problem, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.15 }}
                            className="bg-white p-5 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                        >
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-50 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                                <problem.icon className="w-6 h-6 sm:w-7 sm:h-7 text-red-500" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{problem.title}</h3>
                            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                                {problem.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
